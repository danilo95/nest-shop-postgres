import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @ApiProperty({ example: 'Classic T-Shirt' })
  title: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @ApiPropertyOptional({ example: 29.99, minimum: 0 })
  price?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Comfortable cotton t-shirt for everyday wear.' })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'classic_t-shirt' })
  slug?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @ApiPropertyOptional({ example: 25, minimum: 1 })
  stock?: number;

  @IsString({ each: true })
  @IsArray()
  @ApiProperty({ example: ['S', 'M', 'L', 'XL'], type: [String] })
  sizes: string[];

  @IsIn(['men', 'women', 'kid', 'unisex'])
  @ApiProperty({ example: 'men', enum: ['men', 'women', 'kid', 'unisex'] })
  gender: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ example: ['cotton', 'casual', 'summer'], type: [String] })
  tags: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({
    example: ['https://example.com/images/classic-t-shirt-front.jpg'],
    type: [String],
  })
  images?: string[];
}
