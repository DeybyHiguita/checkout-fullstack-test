import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../shared/domain/result';
import { Delivery } from '../domain/delivery.entity';
import {
  DELIVERY_REPOSITORY,
  type DeliveryRepository,
} from '../domain/delivery.repository';

export type GetDeliveryError = {
  type: 'DELIVERY_NOT_FOUND';
  deliveryId: string;
};

@Injectable()
export class GetDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
  ) {}

  async execute(
    deliveryId: string,
  ): Promise<Result<Delivery, GetDeliveryError>> {
    const delivery = await this.deliveries.findById(deliveryId);
    return delivery
      ? ok(delivery)
      : err({ type: 'DELIVERY_NOT_FOUND', deliveryId });
  }
}
