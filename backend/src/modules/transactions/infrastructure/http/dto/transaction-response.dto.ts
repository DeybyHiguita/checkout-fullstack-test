import { Transaction } from '../../../domain/transaction.entity';

export interface AmountsDto {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalAmountInCents: number;
  currency: string;
}

export interface TransactionResponseDto {
  transactionId: string;
  transactionNumber: string;
  status: string;
  amounts: AmountsDto;
  cardBrand: string | null;
  cardLastFour: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toTransactionResponse = (
  tx: Transaction,
): TransactionResponseDto => ({
  transactionId: tx.id,
  transactionNumber: tx.transactionNumber,
  status: tx.status,
  amounts: {
    productAmountInCents: tx.amounts.productAmountInCents,
    baseFeeInCents: tx.amounts.baseFeeInCents,
    deliveryFeeInCents: tx.amounts.deliveryFeeInCents,
    totalAmountInCents: tx.totalAmountInCents,
    currency: tx.amounts.currency,
  },
  cardBrand: tx.cardBrand,
  cardLastFour: tx.cardLastFour,
  createdAt: tx.createdAt.toISOString(),
  updatedAt: tx.updatedAt.toISOString(),
});
