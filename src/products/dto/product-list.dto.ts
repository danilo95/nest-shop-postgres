import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dtos/pagination.dto.js';

export class ProductListDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({ description: 'Search products by title or slug.' })
  search?: string;

  @IsOptional()
  @IsIn(['catalog', 'admin'])
  @ApiPropertyOptional({ enum: ['catalog', 'admin'], default: 'catalog' })
  searchBy?: 'catalog' | 'admin';
}
