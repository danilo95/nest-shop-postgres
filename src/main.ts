import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('bootstrap');
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const documentConfig = new DocumentBuilder()
    .setTitle('Shop Restful API')
    .setDescription('Shop description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api', app, documentFactory);

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);
  logger.log(`App Running on port ${port}`);
}
await bootstrap();
