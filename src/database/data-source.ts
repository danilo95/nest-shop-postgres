import 'dotenv/config';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { User } from '../auth/entities/user.entity.js';
import { ProductImage } from '../products/entities/product-image.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { PurchaseItem } from '../shop/entities/purchase-item.entity.js';
import { Purchase } from '../shop/entities/purchase.entity.js';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false,
  entities: [
    User,
    RefreshToken,
    Product,
    ProductImage,
    Purchase,
    PurchaseItem,
  ],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
});
