import { IsOptional, IsUUID } from 'class-validator';

export class AdminPurchaseQueryDto {
  @IsOptional()
  @IsUUID()
  search?: string;
}
