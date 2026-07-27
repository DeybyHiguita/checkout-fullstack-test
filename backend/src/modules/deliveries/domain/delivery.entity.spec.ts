import { Delivery } from './delivery.entity';

const make = () =>
  new Delivery({
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

describe('Delivery', () => {
  it('arranca en PENDING', () => {
    expect(make().status).toBe('PENDING');
  });

  it('assign la marca como ASSIGNED sin mutar la original', () => {
    const original = make();
    const assigned = original.assign();
    expect(assigned.status).toBe('ASSIGNED');
    expect(original.status).toBe('PENDING');
    expect(assigned.id).toBe('d1');
  });
});
