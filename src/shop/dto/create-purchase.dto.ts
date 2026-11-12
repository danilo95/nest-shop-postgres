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

export class CreatePurchaseItemDto {
  @IsUUID()
  productId: string;

  @IsString()
  size: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePurchaseDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
