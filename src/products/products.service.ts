import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, QueryFailedError, Raw, Repository } from 'typeorm';
import { Product } from './entities/product.entity.js';
import { ProductListDto } from './dto/product-list.dto.js';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities/product-image.entity.js';
import { User } from '../auth/entities/user.entity.js';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>, // inject repository (Typeorm generate this one) to follow repository patttern

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}
  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(
          (image) => this.productImageRepository.create({ url: image }),
          user,
        ),
      });

      await this.productRepository.save(product);
      return { ...product, images };
    } catch (error: unknown) {
      this.handleDbExeptions(error);
    }
  }

  async findAll(paginationDto: ProductListDto) {
    const { limit = 10, offset = 0, search, searchBy } = paginationDto;
    const term = search?.trim();
    const escaped = term?.replace(/[\\%_]/g, '\\$&');
    const pattern = escaped ? '%' + escaped + '%' : undefined;
    const where = pattern
      ? [
          { slug: ILike(pattern) },
          searchBy === 'admin'
            ? { id: Raw((column) => `CAST(${column} AS text) ILIKE :productId`, { productId: pattern }) }
            : { title: ILike(pattern) },
        ]
      : undefined;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      order: { title: 'ASC', id: 'ASC' },
      where,
      relations: {
        images: true,
      },
    });

    return products.map((product) => ({
      ...product,
      images: product.images?.map((img) => img.url),
    }));
  }

  async findOne(id: string) {
    let product: Product | null;

    if (isUUID(id)) {
      product = await this.productRepository.findOneBy({ id });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      product = await queryBuilder
        .where('UPPER(product.title) = :id OR UPPER(product.slug) = :id', {
          id: id.toUpperCase(),
        })
        .leftJoinAndSelect('product.images', 'prodImages')
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with id: ${id} not found`);
    }
    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map((img) => img.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...dataToUpdate } = updateProductDto;
    const product = await this.productRepository.preload({
      id,
      ...dataToUpdate,
    });

    //Query Runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (!product) {
      throw new NotFoundException(`product with ${id} not found`);
    }

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      }
      product.user = user;
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      //await this.productRepository.save(product);
      return product;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.handleDbExeptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  private handleDbExeptions(error: unknown) {
    if (
      error instanceof QueryFailedError &&
      error.driverError?.code === '23505'
    ) {
      throw new BadRequestException(error.driverError.detail);
    }
    this.logger.error(error instanceof Error ? error.stack : String(error));
    throw new InternalServerErrorException(
      'unexpected error check the server log',
    );
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      await query.delete().execute();
    } catch (error) {
      this.handleDbExeptions(error);
    }
  }
}
