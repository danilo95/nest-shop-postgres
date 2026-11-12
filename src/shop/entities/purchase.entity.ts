import {
  CreateDateColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { User } from '../../auth/entities/user.entity.js';
import type { PurchaseItem } from './purchase-item.entity.js';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'purchases' })
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('User', (user: User) => user.purchases, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany('PurchaseItem', (item: PurchaseItem) => item.purchase, {
    cascade: true,
    eager: true,
  })
  items: PurchaseItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column('float')
  total: number;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PAID,
  })
  status: PurchaseStatus;

  @Column({ nullable: true, unique: true })
  paypalOrderId?: string;

  @Column({ nullable: true })
  paypalCaptureId?: string;
}
