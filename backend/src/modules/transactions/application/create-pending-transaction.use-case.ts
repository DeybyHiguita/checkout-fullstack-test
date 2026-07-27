import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type ClockPort } from '../../../shared/domain/ports/clock.port';
import {
  ID_GENERATOR,
  type IdGeneratorPort,
} from '../../../shared/domain/ports/id-generator.port';
import { err, ok, Result } from '../../../shared/domain/result';
import {
  CreateOrGetCustomerUseCase,
  type CustomerInput,
} from '../../customers/application/create-or-get-customer.use-case';
import { type CustomerError } from '../../customers/domain/customer.entity';
import { Delivery } from '../../deliveries/domain/delivery.entity';
import {
  DELIVERY_REPOSITORY,
  type DeliveryRepository,
} from '../../deliveries/domain/delivery.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../products/domain/product.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from '../../stock/domain/stock.repository';
import { FEE_POLICY, type FeePolicyPort } from '../domain/fee-policy.port';
import { Transaction } from '../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../domain/transaction.repository';
import {
  buildTransactionNumber,
  formatDatePrefix,
} from '../domain/transaction-number';

export interface DeliveryInput {
  addressLine: string;
  city: string;
  region: string;
  postalCode?: string | null;
  country?: string;
}

export interface CreatePendingTransactionInput {
  productId: string;
  customer: CustomerInput;
  delivery: DeliveryInput;
}

export type CreateTransactionError =
  | { type: 'PRODUCT_NOT_FOUND'; productId: string }
  | { type: 'OUT_OF_STOCK'; productId: string }
  | { type: 'CUSTOMER_VALIDATION'; detail: CustomerError };

export interface CreatePendingTransactionResult {
  transaction: Transaction;
  delivery: Delivery;
}

/**
 * Crea una transacción PENDING siguiendo el "riel" de ROP: cada paso puede
 * cortar el pipeline con un error tipado sin ejecutar los siguientes.
 *
 *   producto existe → hay stock (reservar) → cliente válido → crear tx PENDING
 *   → persistir (cliente, tx, delivery, reserva de stock)
 *
 * NO llama a la pasarela de pagos: eso ocurre en ProcessPayment (Día 3).
 */
@Injectable()
export class CreatePendingTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
    @Inject(FEE_POLICY) private readonly fees: FeePolicyPort,
    @Inject(CLOCK) private readonly clock: ClockPort,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
    private readonly createOrGetCustomer: CreateOrGetCustomerUseCase,
  ) {}

  async execute(
    input: CreatePendingTransactionInput,
  ): Promise<Result<CreatePendingTransactionResult, CreateTransactionError>> {
    const product = await this.products.findById(input.productId);
    if (!product) {
      return err({ type: 'PRODUCT_NOT_FOUND', productId: input.productId });
    }

    const stockItem = await this.stock.findByProductId(input.productId);
    if (!stockItem) {
      return err({ type: 'OUT_OF_STOCK', productId: input.productId });
    }

    const reserved = stockItem.reserve();
    if (!reserved.ok) {
      return err({ type: 'OUT_OF_STOCK', productId: input.productId });
    }

    const customerResult = await this.createOrGetCustomer.execute(
      input.customer,
    );
    if (!customerResult.ok) {
      return err({ type: 'CUSTOMER_VALIDATION', detail: customerResult.error });
    }
    const customer = customerResult.value;

    const now = this.clock.now();
    const datePrefix = formatDatePrefix(now);
    const sequence =
      (await this.transactions.countByDatePrefix(datePrefix)) + 1;
    const transactionNumber = buildTransactionNumber(datePrefix, sequence);

    const deliveryFeeInCents = this.fees.getDeliveryFeeInCents(
      input.delivery.city,
    );

    const transaction = Transaction.createPending({
      id: this.idGenerator.generate(),
      transactionNumber,
      productId: product.id,
      customerId: customer.id,
      amounts: {
        productAmountInCents: product.priceInCents,
        baseFeeInCents: this.fees.getBaseFeeInCents(),
        deliveryFeeInCents,
        currency: product.currency,
      },
      now,
    });

    const delivery = new Delivery({
      id: this.idGenerator.generate(),
      transactionId: transaction.id,
      address: {
        addressLine: input.delivery.addressLine,
        city: input.delivery.city,
        region: input.delivery.region,
        postalCode: input.delivery.postalCode ?? null,
        country: input.delivery.country ?? 'CO',
      },
      deliveryFeeInCents,
      status: 'PENDING',
    });

    // Persistencia. El orden respeta las FKs: la transacción referencia al
    // cliente (ya guardado) y la entrega referencia a la transacción.
    const savedTransaction = await this.transactions.save(transaction);
    const savedDelivery = await this.deliveries.save(delivery);
    await this.stock.save(reserved.value);

    return ok({ transaction: savedTransaction, delivery: savedDelivery });
  }
}
