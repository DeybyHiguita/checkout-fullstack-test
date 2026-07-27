import { FakeTransactionRepository } from '../../../shared/testing/fakes';
import { Transaction } from '../domain/transaction.entity';
import { GetTransactionUseCase } from './get-transaction.use-case';

const tx = Transaction.createPending({
  id: 't1',
  transactionNumber: 'TXN-20260724-000001',
  productId: 'p1',
  customerId: 'c1',
  amounts: {
    productAmountInCents: 45000000,
    baseFeeInCents: 350000,
    deliveryFeeInCents: 800000,
    currency: 'COP',
  },
  now: new Date('2026-07-24T12:00:00Z'),
});

describe('GetTransactionUseCase', () => {
  const repo = new FakeTransactionRepository();
  beforeAll(() => repo.save(tx));

  it('byId devuelve la transacción', async () => {
    const result = await new GetTransactionUseCase(repo).byId('t1');
    expect(result.ok).toBe(true);
  });

  it('byId falla con TRANSACTION_NOT_FOUND', async () => {
    const result = await new GetTransactionUseCase(repo).byId('nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('TRANSACTION_NOT_FOUND');
  });

  it('byNumber devuelve la transacción', async () => {
    const result = await new GetTransactionUseCase(repo).byNumber(
      'TXN-20260724-000001',
    );
    expect(result.ok).toBe(true);
  });

  it('byNumber falla con TRANSACTION_NOT_FOUND', async () => {
    const result = await new GetTransactionUseCase(repo).byNumber('TXN-nope');
    expect(result.ok).toBe(false);
  });
});
