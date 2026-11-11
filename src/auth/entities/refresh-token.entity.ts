import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { User } from './user.entity.js';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c' })
  id: string;

  @Column({ unique: true, length: 64 })
  @ApiProperty({
    example: '8f14e45fceea167a5a36dedd4bea2543',
    writeOnly: true,
  })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  @ApiProperty({ example: '2026-12-31T23:59:59.000Z' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  @ApiProperty({
    example: '2026-12-15T12:00:00.000Z',
    nullable: true,
  })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ example: '2026-12-01T10:30:00.000Z' })
  createdAt: Date;

  @ManyToOne('User', (user: User) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: User;
}
