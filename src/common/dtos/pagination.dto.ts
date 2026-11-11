import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 10, minimum: 1, description: 'Number of items to return.' })
  limit?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ example: 0, minimum: 0, description: 'Number of items to skip.' })
  offset?: number;
}
