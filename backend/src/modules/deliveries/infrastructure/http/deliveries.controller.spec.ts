import { HttpStatus } from '@nestjs/common';
import { err, ok } from '../../../../shared/domain/result';
import { DomainException } from '../../../../shared/http/domain.exception';
import { Delivery } from '../../domain/delivery.entity';
import { GetDeliveryUseCase } from '../../application/get-delivery.use-case';
import { DeliveriesController } from './deliveries.controller';

const delivery = new Delivery({
  id: 'd1',
  transactionId: 't1',
  address: {
    addressLine: 'Cra 1',
    city: 'Bogotá',
    region: 'Cund',
    postalCode: null,
    country: 'CO',
  },
  deliveryFeeInCents: 800000,
  status: 'PENDING',
});

describe('DeliveriesController', () => {
  it('devuelve la entrega si existe', async () => {
    const useCase = {
      execute: jest.fn().mockResolvedValue(ok(delivery)),
    } as unknown as GetDeliveryUseCase;
    const res = await new DeliveriesController(useCase).detail('d1');
    expect(res.city).toBe('Bogotá');
    expect(res.status).toBe('PENDING');
  });

  it('lanza 404 si no existe', async () => {
    const useCase = {
      execute: jest
        .fn()
        .mockResolvedValue(
          err({ type: 'DELIVERY_NOT_FOUND', deliveryId: 'x' }),
        ),
    } as unknown as GetDeliveryUseCase;
    await expect(
      new DeliveriesController(useCase).detail('x'),
    ).rejects.toBeInstanceOf(DomainException);
    await new DeliveriesController(useCase)
      .detail('x')
      .catch((e: DomainException) => {
        expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
      });
  });
});
