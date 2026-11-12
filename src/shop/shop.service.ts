import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { Purchase } from './entities/purchase.entity.js';
import { PurchaseItem } from './entities/purchase-item.entity.js';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    private readonly dataSource: DataSource,
  ) {}

  async createPurchase(dto: CreatePurchaseDto, user: User) {
    const productIds = dto.items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException(
        'No puedes repetir el mismo producto en una compra',
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
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado`,
          );
        }

        if (!product.sizes.includes(item.size)) {
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

  findMyPurchases(user: User) {
    return this.purchaseRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  findAllPurchases(search?: string) {
    const query = this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.user', 'user')
      .leftJoinAndSelect('purchase.items', 'items')
      .orderBy('purchase.createdAt', 'DESC');

    if (search) {
      query.where(
        'purchase.id = :search OR user.id = :search',
        { search },
      );
    }

    return query.getMany();
  }
}
