import { err, ok, Result } from '../../../shared/domain/result';

export type TransactionStatus =
  'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export type TransactionError = {
  type: 'ALREADY_RESOLVED';
  status: TransactionStatus;
};

export interface TransactionAmounts {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  currency: string;
}

export interface ResolutionData {
  gatewayTransactionId: string;
  cardBrand: string | null;
  cardLastFour: string | null;
  gatewayStatusRaw: Record<string, unknown> | null;
  now: Date;
}

export interface TransactionProps {
  id: string;
  transactionNumber: string;
  productId: string;
  customerId: string;
  amounts: TransactionAmounts;
  status: TransactionStatus;
  gatewayTransactionId: string | null;
  gatewayStatusRaw: Record<string, unknown> | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad de dominio Transaction. Modela la máquina de estados:
 *
 *   PENDING ──► APPROVED | DECLINED | ERROR
 *
 * Una transacción ya resuelta es inmutable: intentar re-resolverla devuelve
 * `ALREADY_RESOLVED` (evita doble cobro por doble click / reintento).
 * El total se calcula: producto + fee base + fee de envío.
 */
export class Transaction {
  readonly id: string;
  readonly transactionNumber: string;
  readonly productId: string;
  readonly customerId: string;
  readonly amounts: TransactionAmounts;
  readonly status: TransactionStatus;
  readonly gatewayTransactionId: string | null;
  readonly gatewayStatusRaw: Record<string, unknown> | null;
  readonly cardBrand: string | null;
  readonly cardLastFour: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: TransactionProps) {
    this.id = props.id;
    this.transactionNumber = props.transactionNumber;
    this.productId = props.productId;
    this.customerId = props.customerId;
    this.amounts = props.amounts;
    this.status = props.status;
    this.gatewayTransactionId = props.gatewayTransactionId;
    this.gatewayStatusRaw = props.gatewayStatusRaw;
    this.cardBrand = props.cardBrand;
    this.cardLastFour = props.cardLastFour;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get totalAmountInCents(): number {
    return (
      this.amounts.productAmountInCents +
      this.amounts.baseFeeInCents +
      this.amounts.deliveryFeeInCents
    );
  }

  get isResolved(): boolean {
    return this.status !== 'PENDING';
  }

  static createPending(input: {
    id: string;
    transactionNumber: string;
    productId: string;
    customerId: string;
    amounts: TransactionAmounts;
    now: Date;
  }): Transaction {
    return new Transaction({
      id: input.id,
      transactionNumber: input.transactionNumber,
      productId: input.productId,
      customerId: input.customerId,
      amounts: input.amounts,
      status: 'PENDING',
      gatewayTransactionId: null,
      gatewayStatusRaw: null,
      cardBrand: null,
      cardLastFour: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  markApproved(data: ResolutionData): Result<Transaction, TransactionError> {
    return this.resolve('APPROVED', data);
  }

  markDeclined(data: ResolutionData): Result<Transaction, TransactionError> {
    return this.resolve('DECLINED', data);
  }

  markError(data: ResolutionData): Result<Transaction, TransactionError> {
    return this.resolve('ERROR', data);
  }

  private resolve(
    status: TransactionStatus,
    data: ResolutionData,
  ): Result<Transaction, TransactionError> {
    if (this.isResolved) {
      return err({ type: 'ALREADY_RESOLVED', status: this.status });
    }
    return ok(
      new Transaction({
        ...this.toProps(),
        status,
        gatewayTransactionId: data.gatewayTransactionId,
        cardBrand: data.cardBrand,
        cardLastFour: data.cardLastFour,
        gatewayStatusRaw: data.gatewayStatusRaw,
        updatedAt: data.now,
      }),
    );
  }

  private toProps(): TransactionProps {
    return {
      id: this.id,
      transactionNumber: this.transactionNumber,
      productId: this.productId,
      customerId: this.customerId,
      amounts: this.amounts,
      status: this.status,
      gatewayTransactionId: this.gatewayTransactionId,
      gatewayStatusRaw: this.gatewayStatusRaw,
      cardBrand: this.cardBrand,
      cardLastFour: this.cardLastFour,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
