import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayPalService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('PAYPAL_BASE_URL');
  }

  get currency() {
    return this.configService.getOrThrow<string>('PAYPAL_CURRENCY');
  }

  get clientId() {
    return this.configService.getOrThrow<string>('PAYPAL_CLIENT_ID');
  }

  private async getAccessToken() {
    const clientId = this.clientId;
    const clientSecret = this.configService.getOrThrow<string>(
      'PAYPAL_CLIENT_SECRET',
    );
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new InternalServerErrorException('No se pudo autenticar con PayPal');
    }

    const data = await response.json();
    return data.access_token as string;
  }

  async createOrder(total: number, purchaseId: string) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `purchase-${purchaseId}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: purchaseId,
            custom_id: purchaseId,
            amount: {
              currency_code: this.currency,
              value: total.toFixed(2),
            },
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new InternalServerErrorException(data);
    }

    return data as { id: string; status: string };
  }

  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `capture-${orderId}`,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new InternalServerErrorException(data);
    }

    return data;
  }
}
