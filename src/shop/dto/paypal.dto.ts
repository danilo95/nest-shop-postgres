import { ApiProperty } from '@nestjs/swagger';

export class PayPalOrderResponseDto {
  @ApiProperty({ example: '5O190127TN364715T' })
  id: string;
}

export class PayPalCaptureResponseDto {
  @ApiProperty({
    example: 'c7b3f2a1-8d4e-4f6a-9b2c-1e5d7a8f0b3c',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ example: 'PAID', enum: ['PENDING', 'PAID', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: 59.98 })
  total: number;

  @ApiProperty({ example: '8A726011TU1234567' })
  paypalCaptureId: string;
}
