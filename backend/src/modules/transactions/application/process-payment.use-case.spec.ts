import { err, ok } from '../../../shared/domain/result';
import {
  FakeClock,
  FakeCustomerRepository,
  FakeDeliveryRepository,
  FakePaymentGateway,
  FakeStockRepository,
  FakeTransactionRepository,
  FakeGatewayConfig,
} from '../../../shared/testing/fakes';
import { Customer } from '../../customers/domain/customer.entity';
import { Delivery } from '../../deliveries/domain/delivery.entity';
import { StockItem } from '../../stock/domain/stock-item.entity';
import { GatewayPaymentResult } from '../domain/payment-gateway.port';
import { Transaction } from '../domain/transaction.entity';
import { ProcessPaymentUseCase } from './process-payment.use-case';

const customer = Customer.fromPersistence({
  id: 'c1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  documentType: 'CC',
  documentNumber: '1234567890',
  phoneNumber: '3001234567',
});

const makePendingTx = () =>
  Transaction.createPending({
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

const declined: GatewayPaymentResult = {
  gatewayTransactionId: 'gw-9',
  status: 'DECLINED',
  cardBrand: 'MASTERCARD',
  cardLastFour: '0002',
  raw: { status: 'DECLINED' },
};

const build = (opts?: {
  tx?: Transaction | null;
  gateway?: FakeGatewayConfig;
  reserved?: number;
}) => {
  const tx = opts?.tx === undefined ? makePendingTx() : opts.tx;
  const transactions = new FakeTransactionRepository();
  if (tx) void transactions.save(tx);
  const stock = new FakeStockRepository([
    new StockItem({
      id: 's1',
      productId: 'p1',
      availableQuantity: 5,
      reservedQuantity: opts?.reserved ?? 1,
    }),
  ]);
  const deliveries = new FakeDeliveryRepository();
  void deliveries.save(
    new Delivery({
      id: 'd1',
      transactionId: 't1',
      address: {
        addressLine: 'x',
        city: 'y',
        region: 'z',
        postalCode: null,
        country: 'CO',
      },
      deliveryFeeInCents: 800000,
      status: 'PENDING',
    }),
  );
  const customers = new FakeCustomerRepository([customer]);
  const gateway = new FakePaymentGateway(opts?.gateway);
  const useCase = new ProcessPaymentUseCase(
    transactions,
    stock,
    deliveries,
    customers,
    gateway,
    new FakeClock(new Date('2026-07-24T15:30:00Z')),
  );
  return { useCase, transactions, stock, deliveries, gateway };
};

const payInput = {
  transactionId: 't1',
  cardToken: 'tok_1',
  installments: 1,
  acceptanceToken: 'acc',
};

describe('ProcessPaymentUseCase', () => {
  it('aprueba: marca APPROVED, decrementa stock y asigna la entrega', async () => {
    const { useCase, stock, deliveries } = build();
    const result = await useCase.execute(payInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('APPROVED');
    expect(result.value.cardBrand).toBe('VISA');
    expect(result.value.cardLastFour).toBe('4242');

    const item = await stock.findByProductId('p1');
    expect(item?.availableQuantity).toBe(4);
    expect(item?.reservedQuantity).toBe(0);
    expect(deliveries.saved.at(-1)?.status).toBe('ASSIGNED');
  });

  it('declinada: marca DECLINED y libera el stock (no decrementa disponible)', async () => {
    const { useCase, stock, deliveries } = build({
      gateway: { createResult: ok(declined) },
    });
    const result = await useCase.execute(payInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('DECLINED');

    const item = await stock.findByProductId('p1');
    expect(item?.availableQuantity).toBe(5);
    expect(item?.reservedQuantity).toBe(0);
    // La entrega no se asigna en declinada.
    expect(deliveries.saved.every((d) => d.status === 'PENDING')).toBe(true);
  });

  it('error de la pasarela (respuesta): marca ERROR y libera stock', async () => {
    const errorResult: GatewayPaymentResult = {
      gatewayTransactionId: 'gw-err',
      status: 'ERROR',
      cardBrand: null,
      cardLastFour: null,
      raw: { status: 'ERROR' },
    };
    const { useCase, stock } = build({
      gateway: { createResult: ok(errorResult) },
    });
    const result = await useCase.execute(payInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('ERROR');
    const item = await stock.findByProductId('p1');
    expect(item?.availableQuantity).toBe(5);
    expect(item?.reservedQuantity).toBe(0);
  });

  it('pasarela caída: deja la tx PENDING y devuelve GATEWAY_UNAVAILABLE', async () => {
    const { useCase, transactions } = build({
      gateway: { createResult: err({ type: 'GATEWAY_UNAVAILABLE' }) },
    });
    const result = await useCase.execute(payInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('GATEWAY_UNAVAILABLE');
    const tx = await transactions.findById('t1');
    expect(tx?.status).toBe('PENDING');
  });

  it('transacción ya resuelta: devuelve ALREADY_RESOLVED sin volver a cobrar', async () => {
    const approvedTx = makePendingTx().markApproved({
      gatewayTransactionId: 'gw-prev',
      cardBrand: 'VISA',
      cardLastFour: '4242',
      gatewayStatusRaw: null,
      now: new Date('2026-07-24T13:00:00Z'),
    });
    if (!approvedTx.ok) throw new Error('setup');
    const { useCase, gateway } = build({ tx: approvedTx.value });
    const result = await useCase.execute(payInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('ALREADY_RESOLVED');
    expect(gateway.createCalls).toBe(0);
  });

  it('transacción inexistente: devuelve TRANSACTION_NOT_FOUND', async () => {
    const { useCase } = build({ tx: null });
    const result = await useCase.execute(payInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('TRANSACTION_NOT_FOUND');
  });

  it('hace polling: PENDING inicial y luego APPROVED', async () => {
    const pending: GatewayPaymentResult = {
      gatewayTransactionId: 'gw-p',
      status: 'PENDING',
      cardBrand: null,
      cardLastFour: null,
      raw: { status: 'PENDING' },
    };
    const approved: GatewayPaymentResult = {
      gatewayTransactionId: 'gw-p',
      status: 'APPROVED',
      cardBrand: 'VISA',
      cardLastFour: '4242',
      raw: { status: 'APPROVED' },
    };
    const { useCase } = build({
      gateway: { createResult: ok(pending), statusResult: ok(approved) },
    });
    const result = await useCase.execute(payInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('APPROVED');
  }, 10000);

  it('lanza error inesperado si la tx PENDING no tiene cliente (estado inconsistente)', async () => {
    const transactions = new FakeTransactionRepository();
    void transactions.save(makePendingTx());
    const useCase = new ProcessPaymentUseCase(
      transactions,
      new FakeStockRepository([]),
      new FakeDeliveryRepository(),
      new FakeCustomerRepository([]),
      new FakePaymentGateway(),
      new FakeClock(),
    );
    await expect(useCase.execute(payInput)).rejects.toThrow(/Cliente/);
  });
});
