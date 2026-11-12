import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorator.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';
import { User } from '../auth/entities/user.entity.js';
import { PaginationDto } from '../common/dtos/pagination.dto.js';
import { ValidRoles } from '../auth/interfaces/valid-roles.interface.js';
import { AdminPurchaseQueryDto } from './dto/admin-purchase-query.dto.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import {
  PayPalCaptureResponseDto,
  PayPalOrderResponseDto,
} from './dto/paypal.dto.js';
import { ShopService } from './shop.service.js';
import { PayPalService } from './paypal.service.js';

@Controller('shop')
@Auth()
@ApiTags('Shop')
@ApiBearerAuth('access-token')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly paypalService: PayPalService,
  ) {}

  @Get('paypal/config')
  getPayPalConfig() {
    return { clientId: this.paypalService.clientId, currency: this.paypalService.currency };
  }

  @Post('paypal/order')
  @ApiOperation({
    summary: 'Crear una orden de PayPal',
    description:
      'Valida los productos y el stock desde el backend, crea una compra pendiente y devuelve el order ID de PayPal.',
  })
  @ApiResponse({ status: 201, type: PayPalOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de compra inválidos.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o ausente.' })
  @ApiResponse({ status: 409, description: 'Stock insuficiente.' })
  async createPayPalOrder(
    @Body() dto: CreatePurchaseDto,
    @GetUser() user: User,
  ) {
    const purchase = await this.shopService.createPendingPurchase(dto, user);
    let paypalOrder;

    try {
      paypalOrder = await this.paypalService.createOrder(
        purchase.total,
        purchase.id,
      );
    } catch (error) {
      await this.shopService.cancelPurchase(purchase.id);
      throw error;
    }

    await this.shopService.attachPayPalOrder(purchase.id, paypalOrder.id);

    return { id: paypalOrder.id };
  }

  @Post('paypal/order/:orderId/capture')
  @ApiOperation({
    summary: 'Capturar una orden aprobada de PayPal',
    description:
      'Captura el pago en PayPal, valida el importe y marca la compra local como PAID.',
  })
  @ApiParam({ name: 'orderId', example: '5O190127TN364715T' })
  @ApiResponse({ status: 201, type: PayPalCaptureResponseDto })
  @ApiResponse({ status: 400, description: 'El pago no fue validado.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o ausente.' })
  @ApiResponse({ status: 404, description: 'Orden pendiente no encontrada.' })
  async capturePayPalOrder(
    @Param('orderId') orderId: string,
    @GetUser() user: User,
  ) {
    return this.shopService.capturePayPalPurchase(orderId, user, async (purchase) => {
      const paypalOrder = await this.paypalService.captureOrder(orderId);
      const capture = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];

      if (
        paypalOrder.status !== 'COMPLETED' ||
        capture?.status !== 'COMPLETED' ||
        typeof capture.id !== 'string' ||
        capture.amount?.currency_code !== this.paypalService.currency ||
        capture.amount?.value !== purchase.total.toFixed(2)
      ) {
        throw new BadRequestException('El pago de PayPal no fue validado');
      }

      return capture.id;
    });
  }

  @Post('paypal/order/:orderId/cancel')
  @ApiOperation({
    summary: 'Cancelar una orden pendiente de PayPal',
    description: 'Cancela la compra local y devuelve el stock reservado.',
  })
  @ApiParam({ name: 'orderId', example: '5O190127TN364715T' })
  @ApiResponse({ status: 201, description: 'Orden cancelada correctamente.' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido o ausente.' })
  @ApiResponse({ status: 404, description: 'Orden pendiente no encontrada.' })
  cancelPayPalOrder(
    @Param('orderId') orderId: string,
    @GetUser() user: User,
  ) {
    return this.shopService.cancelPendingPurchase(orderId, user);
  }

  @Post('purchases')
  createPurchase(
    @Body() createPurchaseDto: CreatePurchaseDto,
    @GetUser() user: User,
  ) {
    return this.shopService.createPurchase(createPurchaseDto, user);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Obtener mis compras paginadas' })
  @ApiResponse({
    status: 200,
    description: 'Compras del usuario con metadatos de paginación.',
  })
  getMyPurchases(
    @GetUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.shopService.findMyPurchases(user, pagination);
  }

  @Get('admin/purchases')
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: 'Obtener todas las compras paginadas' })
  @ApiResponse({
    status: 200,
    description: 'Compras filtradas con metadatos de paginación.',
  })
  getAllPurchases(@Query() query: AdminPurchaseQueryDto) {
    return this.shopService.findAllPurchases(query);
  }
}
