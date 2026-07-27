import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, type ClockPort } from '../../../shared/domain/ports/clock.port';
import { err, ok, Result } from '../../../shared/domain/result';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../customers/domain/customer.repository';
import {
  DELIVERY_REPOSITORY,
  type DeliveryRepository,
} from '../../deliveries/domain/delivery.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from '../../stock/domain/stock.repository';
import {
  PAYMENT_GATEWAY,
  type GatewayPaymentResult,
  type PaymentGatewayPort,
} from '../domain/payment-gateway.port';
import {
  ResolutionData,
  Transaction,
  TransactionStatus,
} from '../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../domain/transaction.repository';

export interface ProcessPaymentInput {
  transactionId: string;
  cardToken: string;
  installments: number;
  acceptanceToken: string;
}

export type ProcessPaymentError =
  | { type: 'TRANSACTION_NOT_FOUND'; transactionId: string }
  | { type: 'ALREADY_RESOLVED'; status: TransactionStatus }
  | { type: 'GATEWAY_UNAVAILABLE'; detail?: string };

/**
 * Ejecuta el pago contra la pasarela y resuelve la transacción siguiendo el
 * "riel" de ROP. Si la pasarela no responde, la transacción se deja en PENDING
 * (nunca se asume éxito) y se devuelve GATEWAY_UNAVAILABLE para reintento.
 *
 *   tx PENDING → gateway.createPayment (+ polling hasta estado terminal)
 *     ├─ APPROVED → markApproved + confirmSale (stock) + assign (delivery)
 *     └─ DECLINED/ERROR → markDeclined/markError + release (stock)
 */
@Injectable()
export class ProcessPaymentUseCase {
  private readonly logger = new Logger(ProcessPaymentUseCase.name);
  private readonly maxPollAttempts = 3;
  private readonly pollDelayMs = 1500;

  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepository,
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customers: CustomerRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
    @Inject(CLOCK) private readonly clock: ClockPort,
  ) {}

  async execute(
    input: ProcessPaymentInput,
  ): Promise<Result<Transaction, ProcessPaymentError>> {
    const transaction = await this.transactions.findById(input.transactionId);
    if (!transaction) {
      return err({
        type: 'TRANSACTION_NOT_FOUND',
        transactionId: input.transactionId,
      });
    }
    if (transaction.isResolved) {
      return err({ type: 'ALREADY_RESOLVED', status: transaction.status });
    }

    const customer = await this.customers.findById(transaction.customerId);
    if (!customer) {
      // Estado inconsistente (una tx PENDING siempre tiene cliente): error inesperado.
      throw new Error(
        `Cliente ${transaction.customerId} no encontrado para la transacción`,
      );
    }

    const created = await this.gateway.createPayment({
      amountInCents: transaction.totalAmountInCents,
      currency: transaction.amounts.currency,
      reference: transaction.transactionNumber,
      cardToken: input.cardToken,
      acceptanceToken: input.acceptanceToken,
      customerEmail: customer.email,
      installments: input.installments,
    });
    if (!created.ok) {
      this.logger.warn(
        `Pasarela no disponible para ${transaction.transactionNumber}: ${created.error.type}`,
      );
      return err({ type: 'GATEWAY_UNAVAILABLE', detail: created.error.type });
    }

    const settled = await this.resolveGatewayStatus(created.value);
    const resolved = await this.applyResult(transaction, settled);
    if (!resolved.ok) {
      return err({ type: 'ALREADY_RESOLVED', status: transaction.status });
    }
    return ok(resolved.value);
  }

  /** Hace polling hasta obtener un estado terminal o agotar los reintentos. */
  private async resolveGatewayStatus(
    initial: GatewayPaymentResult,
  ): Promise<GatewayPaymentResult> {
    let current = initial;
    let attempts = 0;
    while (current.status === 'PENDING' && attempts < this.maxPollAttempts) {
      await this.sleep(this.pollDelayMs);
      const next = await this.gateway.getPaymentStatus(
        current.gatewayTransactionId,
      );
      if (!next.ok) break;
      current = next.value;
      attempts += 1;
    }
    return current;
  }

  /** Aplica el resultado terminal a la transacción, stock y entrega. */
  private async applyResult(
    transaction: Transaction,
    result: GatewayPaymentResult,
  ): Promise<Result<Transaction, unknown>> {
    const data: ResolutionData = {
      gatewayTransactionId: result.gatewayTransactionId,
      cardBrand: result.cardBrand,
      cardLastFour: result.cardLastFour,
      gatewayStatusRaw: {
        status: result.status,
        gatewayTransactionId: result.gatewayTransactionId,
      },
      now: this.clock.now(),
    };

    if (result.status === 'APPROVED') {
      const resolved = transaction.markApproved(data);
      if (!resolved.ok) return resolved;
      await this.transactions.save(resolved.value);
      await this.confirmStock(transaction.productId);
      await this.assignDelivery(transaction.id);
      return ok(resolved.value);
    }

    // DECLINED, ERROR o PENDING agotado => resolución no aprobada, se libera stock.
    const resolved =
      result.status === 'DECLINED'
        ? transaction.markDeclined(data)
        : transaction.markError(data);
    if (!resolved.ok) return resolved;
    await this.transactions.save(resolved.value);
    await this.releaseStock(transaction.productId);
    return ok(resolved.value);
  }

  private async confirmStock(productId: string): Promise<void> {
    const stockItem = await this.stock.findByProductId(productId);
    if (!stockItem) return;
    const confirmed = stockItem.confirmSale();
    if (confirmed.ok) await this.stock.save(confirmed.value);
  }

  private async releaseStock(productId: string): Promise<void> {
    const stockItem = await this.stock.findByProductId(productId);
    if (!stockItem) return;
    const released = stockItem.release();
    if (released.ok) await this.stock.save(released.value);
  }

  private async assignDelivery(transactionId: string): Promise<void> {
    const delivery = await this.deliveries.findByTransactionId(transactionId);
    if (!delivery) return;
    await this.deliveries.save(delivery.assign());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
