import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dtos/pagination.dto.js';

export class AdminPurchaseQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c',
    description: 'ID de la compra o del usuario que se desea buscar.',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
