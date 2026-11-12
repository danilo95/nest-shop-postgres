import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Purchase } from './purchase.entity.js';

@Entity({ name: 'purchase_items' })
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('Purchase', (purchase: Purchase) => purchase.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column('uuid')
  productId: string;

  @Column('text')
  productTitle: string;

  @Column('text')
  size: string;

  @Column('int')
  quantity: number;

  @Column('float')
  unitPrice: number;

  @Column('float')
  total: number;
}
