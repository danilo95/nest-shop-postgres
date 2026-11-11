import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductImage } from './entities/index.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), AuthModule], //ASINGN THE ENTITY TO AUTOGENERATE IN
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
