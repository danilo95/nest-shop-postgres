import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseItemDto {
  @ApiProperty({
    example: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c',
    format: 'uuid',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  size: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePurchaseDto {
  @ApiProperty({
    type: () => [CreatePurchaseItemDto],
    minItems: 1,
    example: [
      {
        productId: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c',
        size: 'M',
        quantity: 2,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
