import { Product } from '../../products/domain/product.entity';
import { StockItem } from '../../stock/domain/stock-item.entity';
import {
  FakeClock,
  FakeCustomerRepository,
  FakeDeliveryRepository,
  FakeFeePolicy,
  FakeIdGenerator,
  FakeProductRepository,
  FakeStockRepository,
  FakeTransactionRepository,
} from '../../../shared/testing/fakes';
import { CreateOrGetCustomerUseCase } from '../../customers/application/create-or-get-customer.use-case';
import { CreatePendingTransactionUseCase } from './create-pending-transaction.use-case';

const product = new Product({
  id: 'p1',
  name: 'Audífonos',
  description: '...',
  priceInCents: 45000000,
  currency: 'COP',
  imageUrl: 'https://img',
});

const validInput = {
  productId: 'p1',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    documentType: 'CC',
    documentNumber: '1234567890',
    phoneNumber: '3001234567',
  },
  delivery: {
    addressLine: 'Cra 1 # 2-3',
    city: 'Bogotá',
    region: 'Cundinamarca',
  },
};

const build = (opts?: {
  available?: number;
  reserved?: number;
  txCount?: number;
}) => {
  const products = new FakeProductRepository([product]);
  const stock = new FakeStockRepository([
    new StockItem({
      id: 's1',
      productId: 'p1',
      availableQuantity: opts?.available ?? 5,
      reservedQuantity: opts?.reserved ?? 0,
    }),
  ]);
  const customers = new FakeCustomerRepository();
  const transactions = new FakeTransactionRepository(opts?.txCount ?? 0);
  const deliveries = new FakeDeliveryRepository();
  const createOrGet = new CreateOrGetCustomerUseCase(
    customers,
    new FakeIdGenerator('cust'),
  );
  const useCase = new CreatePendingTransactionUseCase(
    products,
    stock,
    transactions,
    deliveries,
    new FakeFeePolicy(350000, 800000),
    new FakeClock(new Date('2026-07-24T12:00:00Z')),
    new FakeIdGenerator('gen'),
    createOrGet,
  );
  return { useCase, stock, customers, transactions, deliveries };
};

describe('CreatePendingTransactionUseCase', () => {
  it('crea la transacción PENDING con montos y correlativo correctos', async () => {
    const { useCase, transactions, deliveries } = build({ txCount: 122 });
    const result = await useCase.execute(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const tx = result.value.transaction;
    expect(tx.status).toBe('PENDING');
    expect(tx.transactionNumber).toBe('TXN-20260724-000123');
    expect(tx.amounts.productAmountInCents).toBe(45000000);
    expect(tx.amounts.baseFeeInCents).toBe(350000);
    expect(tx.amounts.deliveryFeeInCents).toBe(800000);
    expect(tx.totalAmountInCents).toBe(46150000);
    expect(transactions.saved).toHaveLength(1);
    expect(deliveries.saved).toHaveLength(1);
    expect(deliveries.saved[0].status).toBe('PENDING');
  });

  it('reserva una unidad de stock', async () => {
    const { useCase, stock } = build({ available: 5, reserved: 0 });
    await useCase.execute(validInput);
    const item = await stock.findByProductId('p1');
    expect(item?.reservedQuantity).toBe(1);
    expect(item?.availableQuantity).toBe(5);
    expect(item?.sellableQuantity).toBe(4);
  });

  it('crea el cliente cuando no existe', async () => {
    const { useCase, customers } = build();
    await useCase.execute(validInput);
    expect(customers.saved).toHaveLength(1);
    expect(customers.saved[0].email).toBe('jane@example.com');
  });

  it('falla con PRODUCT_NOT_FOUND si el producto no existe', async () => {
    const { useCase } = build();
    const result = await useCase.execute({ ...validInput, productId: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('PRODUCT_NOT_FOUND');
  });

  it('falla con OUT_OF_STOCK si no hay unidades comprables', async () => {
    const { useCase, transactions } = build({ available: 3, reserved: 3 });
    const result = await useCase.execute(validInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('OUT_OF_STOCK');
    // No debe haberse creado transacción.
    expect(transactions.saved).toHaveLength(0);
  });

  it('falla con CUSTOMER_VALIDATION si el email es inválido', async () => {
    const { useCase } = build();
    const result = await useCase.execute({
      ...validInput,
      customer: { ...validInput.customer, email: 'no-es-email' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('CUSTOMER_VALIDATION');
  });
});
