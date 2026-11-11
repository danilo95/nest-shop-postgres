import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { Product } from './product.entity.js';

@Entity({ name: 'products_images' })
export class ProductImage {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column('text')
  @ApiProperty({ example: 'https://example.com/images/classic-t-shirt-front.jpg' })
  url: string;

  @ManyToOne('Product', (product: Product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
