import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DomainException } from '../../../../shared/http/domain.exception';
import { GetDeliveryUseCase } from '../../application/get-delivery.use-case';

interface DeliveryResponseDto {
  id: string;
  transactionId: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string | null;
  country: string;
  deliveryFeeInCents: number;
  status: string;
}

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly getDelivery: GetDeliveryUseCase) {}

  @Get(':id')
  async detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DeliveryResponseDto> {
    const result = await this.getDelivery.execute(id);
    if (!result.ok) {
      throw new DomainException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'DELIVERY_NOT_FOUND',
        message: 'La entrega no existe',
        details: { deliveryId: result.error.deliveryId },
      });
    }
    const d = result.value;
    return {
      id: d.id,
      transactionId: d.transactionId,
      addressLine: d.address.addressLine,
      city: d.address.city,
      region: d.address.region,
      postalCode: d.address.postalCode,
      country: d.address.country,
      deliveryFeeInCents: d.deliveryFeeInCents,
      status: d.status,
    };
  }
}
