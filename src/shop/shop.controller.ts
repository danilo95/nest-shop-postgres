import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Auth } from '../auth/auth.decorator.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { User } from '../auth/entities/user.entity.js';
import { ValidRoles } from '../auth/interfaces/valid-roles.interface.js';
import { AdminPurchaseQueryDto } from './dto/admin-purchase-query.dto.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { ShopService } from './shop.service.js';

@Controller('shop')
@Auth()
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('purchases')
  createPurchase(
    @Body() createPurchaseDto: CreatePurchaseDto,
    @GetUser() user: User,
  ) {
    return this.shopService.createPurchase(createPurchaseDto, user);
  }

  @Get('purchases')
  getMyPurchases(@GetUser() user: User) {
    return this.shopService.findMyPurchases(user);
  }

  @Get('admin/purchases')
  @Auth(ValidRoles.admin)
  getAllPurchases(@Query() query: AdminPurchaseQueryDto) {
    return this.shopService.findAllPurchases(query.search);
  }
}
