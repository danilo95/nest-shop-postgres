import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ProductImage } from './product-image.entity.js';
import type { User } from '../../auth/entities/user.entity.js';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c' })
  id: string;

  @Column('text', {
    unique: true,
  })
  @ApiProperty({ example: 'Classic T-Shirt' })
  title: string;

  @Column('float', {
    default: 0,
  })
  @ApiProperty({ example: 29.99 })
  price: number;

  @Column('text', {
    nullable: true,
  })
  @ApiProperty({ example: 'Comfortable cotton t-shirt for everyday wear.' })
  description: string;

  @Column('text', {
    unique: true,
  })
  @ApiProperty({ example: 'classic_t-shirt' })
  slug: string;

  @Column('int', {
    default: 0,
  })
  @ApiProperty({ example: 25 })
  stock: number;

  @Column('text', {
    array: true,
  })
  @ApiProperty({ example: ['S', 'M', 'L', 'XL'], type: [String] })
  sizes: string[];

  @Column('text')
  @ApiProperty({ example: 'men' })
  gender: string;

  @Column('text', {
    array: true,
    default: [],
  })
  @ApiProperty({ example: ['cotton', 'casual', 'summer'], type: [String] })
  tags: string[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  @ApiProperty({
    required: false,
    example: [
      { id: 1, url: 'https://example.com/images/classic-t-shirt-front.jpg' },
    ],
    type: () => [ProductImage],
  })
  images?: ProductImage[]; //relationship in db

  @ManyToOne('User', (user: User) => user.products, { eager: true })
  user: User;

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }
    this.slug = this.slug
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replaceAll("'", '');
  }
}
