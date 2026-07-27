import { SimulatedPaymentGatewayAdapter } from './simulated-payment-gateway.adapter';

const input = {
  amountInCents: 46150000,
  currency: 'COP',
  reference: 'TXN-1',
  acceptanceToken: 'acc',
  customerEmail: 'jane@example.com',
  installments: 1,
};

describe('SimulatedPaymentGatewayAdapter', () => {
  const adapter = new SimulatedPaymentGatewayAdapter();

  it('aprueba con un token normal e infiere VISA', async () => {
    const r = await adapter.createPayment({
      ...input,
      cardToken: 'tok_test_4242',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe('APPROVED');
      expect(r.value.cardBrand).toBe('VISA');
      expect(r.value.cardLastFour).toBe('4242');
    }
  });

  it('declina con token tok_decline y detecta MASTERCARD', async () => {
    const r = await adapter.createPayment({
      ...input,
      cardToken: 'tok_decline_master',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe('DECLINED');
      expect(r.value.cardBrand).toBe('MASTERCARD');
    }
  });

  it('falla con token tok_error', async () => {
    const r = await adapter.createPayment({
      ...input,
      cardToken: 'tok_error_x',
    });
    expect(r.ok && r.value.status).toBe('ERROR');
  });

  it('devuelve un acceptance token simulado', async () => {
    const r = await adapter.getAcceptanceToken();
    expect(r.ok && r.value).toBe('simulated_acceptance_token');
  });

  it('getPaymentStatus devuelve APPROVED', async () => {
    const r = await adapter.getPaymentStatus('sim-1');
    expect(r.ok && r.value.status).toBe('APPROVED');
  });
});
