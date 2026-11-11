import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

@Injectable()
export class FilesService {
  getStaticProductImage(imageName: string) {
    const path = join(currentDirectory, '../../static/products', imageName);
    if (!existsSync(path)) {
      throw new BadRequestException(
        `Not product found with image  ${imageName}`,
      );
    }
    return path;
  }
}
