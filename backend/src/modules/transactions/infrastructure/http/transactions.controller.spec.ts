import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../shared/http/domain.exception';
import { ok, Result } from '../../../../shared/domain/result';
import { Delivery } from '../../../deliveries/domain/delivery.entity';
import {
  CreatePendingTransactionResult,
  CreatePendingTransactionUseCase,
  CreateTransactionError,
} from '../../application/create-pending-transaction.use-case';
import { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionsController } from './transactions.controller';

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

const delivery = new Delivery({
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
});

const dto = {
  productId: 'p1',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '1234567890',
    phoneNumber: '3001234567',
  },
  delivery: { addressLine: 'x', city: 'y', region: 'z' },
} as never;

const controllerWith = (
  createResult: Result<CreatePendingTransactionResult, CreateTransactionError>,
) => {
  const create = {
    execute: jest.fn().mockResolvedValue(createResult),
  } as unknown as CreatePendingTransactionUseCase;
  const get = {
    byId: jest.fn(),
    byNumber: jest.fn(),
  } as unknown as GetTransactionUseCase;
  return { controller: new TransactionsController(create, get), get };
};

/** Ejecuta fn esperando que lance una DomainException y la devuelve. */
const expectThrows = async (
  fn: () => Promise<unknown>,
): Promise<DomainException> => {
  try {
    await fn();
  } catch (e) {
    return e as DomainException;
  }
  throw new Error('se esperaba una DomainException');
};

describe('TransactionsController', () => {
  it('POST devuelve la respuesta mapeada en éxito', async () => {
    const { controller } = controllerWith(ok({ transaction: tx, delivery }));
    const res = await controller.create(dto);
    expect(res.transactionId).toBe('t1');
    expect(res.status).toBe('PENDING');
    expect(res.amounts.totalAmountInCents).toBe(46150000);
  });

  it('POST mapea OUT_OF_STOCK a 409', async () => {
    const { controller } = controllerWith({
      ok: false,
      error: { type: 'OUT_OF_STOCK', productId: 'p1' },
    });
    const e = await expectThrows(() => controller.create(dto));
    expect(e).toBeInstanceOf(DomainException);
    expect(e.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('POST mapea PRODUCT_NOT_FOUND a 404', async () => {
    const { controller } = controllerWith({
      ok: false,
      error: { type: 'PRODUCT_NOT_FOUND', productId: 'p1' },
    });
    const e = await expectThrows(() => controller.create(dto));
    expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('POST mapea CUSTOMER_VALIDATION a 422', async () => {
    const { controller } = controllerWith({
      ok: false,
      error: {
        type: 'CUSTOMER_VALIDATION',
        detail: { type: 'INVALID_EMAIL', value: 'x' },
      },
    });
    const e = await expectThrows(() => controller.create(dto));
    expect(e.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('GET :id devuelve 404 si no existe', async () => {
    const { controller, get } = controllerWith(
      ok({ transaction: tx, delivery }),
    );
    (get.byId as jest.Mock).mockResolvedValue({
      ok: false,
      error: { type: 'TRANSACTION_NOT_FOUND', reference: 't9' },
    });
    const e = await expectThrows(() => controller.detail('t9'));
    expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('GET :id devuelve la transacción si existe', async () => {
    const { controller, get } = controllerWith(
      ok({ transaction: tx, delivery }),
    );
    (get.byId as jest.Mock).mockResolvedValue(ok(tx));
    const res = await controller.detail('t1');
    expect(res.transactionNumber).toBe('TXN-20260724-000001');
  });
});
