import {
  ResolutionData,
  Transaction,
  TransactionAmounts,
} from './transaction.entity';

const amounts: TransactionAmounts = {
  productAmountInCents: 15000000,
  baseFeeInCents: 350000,
  deliveryFeeInCents: 800000,
  currency: 'COP',
};

const now = new Date('2026-07-24T15:30:00Z');

const pending = () =>
  Transaction.createPending({
    id: 't1',
    transactionNumber: 'TXN-20260724-000001',
    productId: 'p1',
    customerId: 'c1',
    amounts,
    now: new Date('2026-07-24T15:00:00Z'),
  });

const resolution: ResolutionData = {
  gatewayTransactionId: 'gw-123',
  cardBrand: 'VISA',
  cardLastFour: '4242',
  gatewayStatusRaw: { status: 'APPROVED' },
  now,
};

describe('Transaction', () => {
  it('createPending arranca en PENDING con total calculado', () => {
    const tx = pending();
    expect(tx.status).toBe('PENDING');
    expect(tx.isResolved).toBe(false);
    expect(tx.totalAmountInCents).toBe(16150000);
    expect(tx.gatewayTransactionId).toBeNull();
  });

  describe('markApproved', () => {
    it('transiciona a APPROVED con datos de la pasarela', () => {
      const r = pending().markApproved(resolution);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.value.status).toBe('APPROVED');
        expect(r.value.isResolved).toBe(true);
        expect(r.value.cardBrand).toBe('VISA');
        expect(r.value.cardLastFour).toBe('4242');
        expect(r.value.gatewayTransactionId).toBe('gw-123');
        expect(r.value.updatedAt).toEqual(now);
      }
    });
  });

  it('markDeclined transiciona a DECLINED', () => {
    const r = pending().markDeclined(resolution);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('DECLINED');
  });

  it('markError transiciona a ERROR', () => {
    const r = pending().markError(resolution);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('ERROR');
  });

  describe('re-resolución', () => {
    it('una transacción aprobada no se puede volver a resolver', () => {
      const approved = pending().markApproved(resolution);
      expect(approved.ok).toBe(true);
      if (!approved.ok) return;
      const again = approved.value.markDeclined(resolution);
      expect(again.ok).toBe(false);
      if (!again.ok) {
        expect(again.error).toEqual({
          type: 'ALREADY_RESOLVED',
          status: 'APPROVED',
        });
      }
    });
  });

  it('no muta la transacción original al resolver', () => {
    const tx = pending();
    tx.markApproved(resolution);
    expect(tx.status).toBe('PENDING');
  });
});
