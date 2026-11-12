import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module.js';
import { CommonModule } from './common/common.module.js';
import { SeedModule } from './seed/seed.module.js';
import { FilesModule } from './files/files.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { AuthModule } from './auth/auth.module.js';
import { MessagesWsModule } from './messages-ws/messages-ws.module.js';
import { validateEnv } from './config/env.schema.js';
import { ShopModule } from './shop/shop.module.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        database: config.getOrThrow<string>('DB_NAME'),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        autoLoadEntities: true,
        synchronize: config.getOrThrow<boolean>('SYNC'),
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ProductsModule,
    CommonModule,
    SeedModule,
    FilesModule,
    AuthModule,
    MessagesWsModule,
    ShopModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
