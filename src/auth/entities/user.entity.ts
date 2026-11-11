import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { Product } from '../../products/entities/product.entity.js';
import type { RefreshToken } from './refresh-token.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c' })
  id: string;

  @Column('text', {
    unique: true,
  })
  @ApiProperty({ example: 'customer@example.com' })
  email: string;

  @Column('text', { select: false })
  @ApiProperty({ example: 'StrongPassword123!', writeOnly: true })
  password: string;

  @Column('text')
  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @Column('bool', {
    default: true,
  })
  @ApiProperty({ example: true })
  isActive: boolean;

  @Column('text', {
    array: true,
    default: ['user'],
  })
  @ApiProperty({ example: ['user'], type: [String] })
  roles: string[];

  @OneToMany('Product', (product: Product) => product.user)
  products: Product[];

  @OneToMany('RefreshToken', (refreshToken: RefreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];
}
