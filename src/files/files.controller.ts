import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from './helpers/fileFilter.js';
import { diskStorage } from 'multer';
import { fileNamer } from './helpers/fileNamer.js';
import express from 'express';
import { ConfigService } from '@nestjs/config';

const maxProductImageBytes = 10 * 1024 * 1024;

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: express.Response, //manually return
    @Param('imageName') imageName: string,
  ) {
    const path = this.filesService.getStaticProductImage(imageName);
    res.sendFile(path);
  }

  @Post('product')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter,
      // Busboy signals the limit when the stream reaches it.
      limits: { fileSize: maxProductImageBytes + 1 },
      storage: diskStorage({
        destination: './static/products',
        filename: fileNamer,
      }),
    }),
  )
  uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is empty');
    }

    const host = this.configService.get<string>('HOST_API')?.trim().replace(/\/+$/, '') || '/api';
    const secureUrl = `${host}/files/product/${file.filename}`;

    return {
      fileName: secureUrl,
    };
  }
}
