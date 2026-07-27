import { FakeDeliveryRepository } from '../../../shared/testing/fakes';
import { Delivery } from '../domain/delivery.entity';
import { GetDeliveryUseCase } from './get-delivery.use-case';

const delivery = new Delivery({
  id: 'd1',
  transactionId: 't1',
  address: {
    addressLine: 'Cra 1 # 2-3',
    city: 'Bogotá',
    region: 'Cundinamarca',
    postalCode: null,
    country: 'CO',
  },
  deliveryFeeInCents: 800000,
  status: 'PENDING',
});

describe('GetDeliveryUseCase', () => {
  const repo = new FakeDeliveryRepository();
  beforeAll(() => repo.save(delivery));

  it('devuelve la entrega si existe', async () => {
    const result = await new GetDeliveryUseCase(repo).execute('d1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.address.city).toBe('Bogotá');
  });

  it('falla con DELIVERY_NOT_FOUND si no existe', async () => {
    const result = await new GetDeliveryUseCase(repo).execute('nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('DELIVERY_NOT_FOUND');
  });
});
