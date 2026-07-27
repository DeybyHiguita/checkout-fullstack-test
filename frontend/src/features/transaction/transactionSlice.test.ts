import { ApiError } from '../../shared/api/client';
import reducer, {
  createTransaction,
  fetchTransaction,
  payTransaction,
  resetTransaction,
  type TransactionState,
} from './transactionSlice';
import { transactionApi, type TransactionResponse } from './transactionApi';

jest.mock('./transactionApi');
const mocked = transactionApi as jest.Mocked<typeof transactionApi>;

const response = (over: Partial<TransactionResponse> = {}): TransactionResponse => ({
  transactionId: 't1',
  transactionNumber: 'TXN-1',
  status: 'PENDING',
  amounts: {
    productAmountInCents: 45000000,
    baseFeeInCents: 350000,
    deliveryFeeInCents: 800000,
    totalAmountInCents: 46150000,
    currency: 'COP',
  },
  cardBrand: null,
  cardLastFour: null,
  createdAt: '2026-07-24T12:00:00Z',
  updatedAt: '2026-07-24T12:00:00Z',
  ...over,
});

const initial = (): TransactionState => reducer(undefined, { type: '@@INIT' });

describe('transactionSlice reducer', () => {
  it('createTransaction.fulfilled guarda id, número y montos con estado PENDING', () => {
    const state = reducer(initial(), {
      type: createTransaction.fulfilled.type,
      payload: response(),
    });
    expect(state.transactionId).toBe('t1');
    expect(state.status).toBe('PENDING');
    expect(state.amounts?.totalAmountInCents).toBe(46150000);
    expect(state.loading).toBe(false);
  });

  it('payTransaction.fulfilled con APPROVED', () => {
    const state = reducer(initial(), {
      type: payTransaction.fulfilled.type,
      payload: response({ status: 'APPROVED', cardBrand: 'VISA', cardLastFour: '4242' }),
    });
    expect(state.status).toBe('APPROVED');
    expect(state.cardLastFour).toBe('4242');
  });

  it('payTransaction.rejected guarda el error (p. ej. gateway 502)', () => {
    const state = reducer(
      { ...initial(), loading: true },
      { type: payTransaction.rejected.type, payload: 'gateway caído' },
    );
    expect(state.status).toBe('IDLE');
    expect(state.error).toBe('gateway caído');
  });

  it('VOIDED se normaliza a DECLINED', () => {
    const state = reducer(initial(), {
      type: fetchTransaction.fulfilled.type,
      payload: response({ status: 'VOIDED' }),
    });
    expect(state.status).toBe('DECLINED');
  });

  it('resetTransaction limpia el estado', () => {
    const dirty = { ...initial(), transactionId: 't1', status: 'APPROVED' as const };
    expect(reducer(dirty, resetTransaction()).transactionId).toBeNull();
    expect(reducer(dirty, resetTransaction()).status).toBe('IDLE');
  });
});

describe('transaction thunks', () => {
  afterEach(() => jest.clearAllMocks());

  it('createTransaction resuelve con la respuesta', async () => {
    mocked.create.mockResolvedValue(response());
    const result = await createTransaction({
      productId: 'p1',
      customer: {
        fullName: 'Jane',
        email: 'j@e.co',
        documentType: 'CC',
        documentNumber: '1234567890',
        phoneNumber: '3001234567',
      },
      delivery: { addressLine: 'x', city: 'y', region: 'z' },
    })(jest.fn(), () => ({}), undefined);
    expect(result.type).toBe(createTransaction.fulfilled.type);
  });

  it('payTransaction rechaza con el mensaje del ApiError', async () => {
    mocked.pay.mockRejectedValue(
      new ApiError({ statusCode: 502, error: 'GATEWAY_UNAVAILABLE', message: 'caído' }),
    );
    const result = await payTransaction({
      id: 't1',
      body: { cardToken: 'tok', acceptanceToken: 'acc', installments: 1 },
    })(jest.fn(), () => ({}), undefined);
    expect(result.type).toBe(payTransaction.rejected.type);
    expect(result.payload).toBe('caído');
  });
});
