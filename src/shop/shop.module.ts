import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Product } from '../products/entities/product.entity.js';
import { Purchase } from './entities/purchase.entity.js';
import { PurchaseItem } from './entities/purchase-item.entity.js';
import { ShopController } from './shop.controller.js';
import { ShopService } from './shop.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Product, Purchase, PurchaseItem]),
  ],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
