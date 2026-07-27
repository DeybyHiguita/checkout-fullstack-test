import { Customer } from '../../modules/customers/domain/customer.entity';
import { CustomerRepository } from '../../modules/customers/domain/customer.repository';
import { Delivery } from '../../modules/deliveries/domain/delivery.entity';
import { DeliveryRepository } from '../../modules/deliveries/domain/delivery.repository';
import { Product } from '../../modules/products/domain/product.entity';
import { ProductRepository } from '../../modules/products/domain/product.repository';
import { StockItem } from '../../modules/stock/domain/stock-item.entity';
import { StockRepository } from '../../modules/stock/domain/stock.repository';
import { FeePolicyPort } from '../../modules/transactions/domain/fee-policy.port';
import { Transaction } from '../../modules/transactions/domain/transaction.entity';
import { TransactionRepository } from '../../modules/transactions/domain/transaction.repository';
import { ClockPort } from '../domain/ports/clock.port';
import { IdGeneratorPort } from '../domain/ports/id-generator.port';

export class FakeProductRepository implements ProductRepository {
  constructor(private readonly items: Product[] = []) {}
  findAll(): Promise<Product[]> {
    return Promise.resolve(this.items);
  }
  findById(id: string): Promise<Product | null> {
    return Promise.resolve(this.items.find((p) => p.id === id) ?? null);
  }
}

export class FakeStockRepository implements StockRepository {
  constructor(private readonly items: StockItem[] = []) {}
  findByProductId(productId: string): Promise<StockItem | null> {
    return Promise.resolve(
      this.items.find((s) => s.productId === productId) ?? null,
    );
  }
  save(stockItem: StockItem): Promise<StockItem> {
    const idx = this.items.findIndex((s) => s.id === stockItem.id);
    if (idx >= 0) this.items[idx] = stockItem;
    else this.items.push(stockItem);
    return Promise.resolve(stockItem);
  }
}

export class FakeCustomerRepository implements CustomerRepository {
  public readonly saved: Customer[] = [];
  constructor(private readonly existing: Customer[] = []) {}
  findById(id: string): Promise<Customer | null> {
    return Promise.resolve(
      [...this.existing, ...this.saved].find((c) => c.id === id) ?? null,
    );
  }
  findByEmailAndDocument(
    email: string,
    documentNumber: string,
  ): Promise<Customer | null> {
    return Promise.resolve(
      [...this.existing, ...this.saved].find(
        (c) => c.email === email && c.documentNumber === documentNumber,
      ) ?? null,
    );
  }
  save(customer: Customer): Promise<Customer> {
    this.saved.push(customer);
    return Promise.resolve(customer);
  }
}

export class FakeTransactionRepository implements TransactionRepository {
  public readonly saved: Transaction[] = [];
  constructor(private countForPrefix = 0) {}
  findById(id: string): Promise<Transaction | null> {
    return Promise.resolve(this.saved.find((t) => t.id === id) ?? null);
  }
  findByTransactionNumber(
    transactionNumber: string,
  ): Promise<Transaction | null> {
    return Promise.resolve(
      this.saved.find((t) => t.transactionNumber === transactionNumber) ?? null,
    );
  }
  save(transaction: Transaction): Promise<Transaction> {
    const idx = this.saved.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) this.saved[idx] = transaction;
    else this.saved.push(transaction);
    return Promise.resolve(transaction);
  }
  countByDatePrefix(_datePrefix: string): Promise<number> {
    return Promise.resolve(this.countForPrefix);
  }
}

export class FakeDeliveryRepository implements DeliveryRepository {
  public readonly saved: Delivery[] = [];
  findById(id: string): Promise<Delivery | null> {
    return Promise.resolve(this.saved.find((d) => d.id === id) ?? null);
  }
  findByTransactionId(transactionId: string): Promise<Delivery | null> {
    return Promise.resolve(
      this.saved.find((d) => d.transactionId === transactionId) ?? null,
    );
  }
  save(delivery: Delivery): Promise<Delivery> {
    this.saved.push(delivery);
    return Promise.resolve(delivery);
  }
}

export class FakeClock implements ClockPort {
  constructor(
    private readonly fixed: Date = new Date('2026-07-24T12:00:00Z'),
  ) {}
  now(): Date {
    return this.fixed;
  }
}

export class FakeIdGenerator implements IdGeneratorPort {
  private counter = 0;
  constructor(private readonly prefix = 'id') {}
  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}

export class FakeFeePolicy implements FeePolicyPort {
  constructor(
    private readonly baseFee = 350000,
    private readonly deliveryFee = 800000,
  ) {}
  getBaseFeeInCents(): number {
    return this.baseFee;
  }
  getDeliveryFeeInCents(_city: string): number {
    return this.deliveryFee;
  }
}
