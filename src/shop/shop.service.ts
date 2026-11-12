import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { Purchase, PurchaseStatus } from './entities/purchase.entity.js';
import { PurchaseItem } from './entities/purchase-item.entity.js';
import { PaginationDto } from '../common/dtos/pagination.dto.js';
import { AdminPurchaseQueryDto } from './dto/admin-purchase-query.dto.js';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    private readonly dataSource: DataSource,
  ) {}

  async createPurchase(dto: CreatePurchaseDto, user: User) {
    return this.createPurchaseWithStatus(dto, user, PurchaseStatus.PAID);
  }

  async createPendingPurchase(dto: CreatePurchaseDto, user: User) {
    return this.createPurchaseWithStatus(dto, user, PurchaseStatus.PENDING);
  }

  private async createPurchaseWithStatus(
    dto: CreatePurchaseDto,
    user: User,
    status: PurchaseStatus,
  ) {
    const itemKeys = dto.items.map(({ productId, size }) => JSON.stringify([productId, size]));

    if (new Set(itemKeys).size !== itemKeys.length) {
      throw new BadRequestException(
        'No puedes repetir el mismo producto y talla en una compra',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseItems: PurchaseItem[] = [];
      let purchaseTotal = 0;

      // Ordenar los bloqueos evita deadlocks cuando dos compras contienen
      // varios productos en distinto orden.
      const itemsToLock = [...dto.items].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );

      for (const item of itemsToLock) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
          loadEagerRelations: false, lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado`,
          );
        }

        if (product.sizes.length ? !product.sizes.includes(item.size) : item.size !== '') {
          throw new BadRequestException(
            `La talla ${item.size} no está disponible para ${product.title}`,
          );
        }

        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Stock insuficiente para ${product.title}. Disponible: ${product.stock}`,
          );
        }

        product.stock -= item.quantity;
        await queryRunner.manager.save(Product, product);

        const itemTotal = product.price * item.quantity;
        purchaseTotal += itemTotal;

        purchaseItems.push(
          queryRunner.manager.create(PurchaseItem, {
            productId: product.id,
            productTitle: product.title,
            size: item.size,
            quantity: item.quantity,
            unitPrice: product.price,
            total: itemTotal,
          }),
        );
      }

      const purchase = queryRunner.manager.create(Purchase, {
        user,
        items: purchaseItems,
        total: purchaseTotal,
        status,
      });

      const savedPurchase = await queryRunner.manager.save(Purchase, purchase);
      await queryRunner.commitTransaction();

      return savedPurchase;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async attachPayPalOrder(purchaseId: string, paypalOrderId: string) {
    await this.purchaseRepository.update(
      { id: purchaseId, status: PurchaseStatus.PENDING },
      { paypalOrderId },
    );

    return this.purchaseRepository.findOneByOrFail({ id: purchaseId });
  }

  async findPendingPayPalPurchase(paypalOrderId: string, user: User, allowPaid = false) {
    const purchase = await this.purchaseRepository.findOne({
      where: {
        paypalOrderId,
        status: allowPaid ? In([PurchaseStatus.PENDING, PurchaseStatus.PAID]) : PurchaseStatus.PENDING,
        user: { id: user.id },
      },
    });

    if (!purchase) {
      throw new NotFoundException('Orden PayPal pendiente no encontrada');
    }

    return purchase;
  }

  async capturePayPalPurchase(
    orderId: string,
    user: User,
    capture: (purchase: Purchase) => Promise<string>,
  ) {
    const owned = await this.findPendingPayPalPurchase(orderId, user, true);

    return this.dataSource.transaction(async (manager) => {
      const purchase = await manager.findOneOrFail(Purchase, {
        where: { id: owned.id },
        loadEagerRelations: false,
        lock: { mode: 'pessimistic_write' },
      });

      if (purchase.status === PurchaseStatus.PENDING) {
        const paypalCaptureId = await capture(purchase);
        await manager.update(Purchase, purchase.id, {
          status: PurchaseStatus.PAID,
          paypalCaptureId,
        });
      } else if (purchase.status !== PurchaseStatus.PAID) {
        throw new ConflictException('La compra ya cambió de estado');
      }

      return manager.findOneByOrFail(Purchase, { id: purchase.id });
    });
  }

  async cancelPendingPurchase(paypalOrderId: string, user: User) {
    const purchase = await this.findPendingPayPalPurchase(paypalOrderId, user);

    return this.cancelPurchase(purchase.id);
  }

  async cancelPurchase(purchaseId: string) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id: purchaseId, status: PurchaseStatus.PENDING },
    });

    if (!purchase) {
      throw new NotFoundException('Compra pendiente no encontrada');
    }

    // El stock se reservó al crear la compra. Se devuelve una sola vez.
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(Purchase,
        { id: purchaseId, status: PurchaseStatus.PENDING },
        { status: PurchaseStatus.CANCELLED },
      );
      if (!result.affected) throw new ConflictException('La compra ya cambió de estado');

      for (const item of purchase.items) {
        await manager.increment(Product, { id: item.productId }, 'stock', item.quantity);
      }

      purchase.status = PurchaseStatus.CANCELLED;
    });

    return purchase;
  }

  async findMyPurchases(user: User, pagination: PaginationDto) {
    const { limit = 10, offset = 0 } = pagination;
    const [data, total] = await this.purchaseRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasNextPage: offset + data.length < total,
      },
    };
  }

  async findAllPurchases(queryDto: AdminPurchaseQueryDto) {
    const { search, limit = 10, offset = 0 } = queryDto;
    const query = this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.user', 'user')
      .leftJoinAndSelect('purchase.items', 'items')
      .orderBy('purchase.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (search) {
      query.where(
        'CAST(purchase.id AS text) = LOWER(:search) OR CAST(user.id AS text) = LOWER(:search) OR purchase.paypalOrderId = :search OR purchase.paypalCaptureId = :search',
        { search },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasNextPage: offset + data.length < total,
      },
    };
  }
}
