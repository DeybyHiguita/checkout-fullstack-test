import { Transaction } from './transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByTransactionNumber(
    transactionNumber: string,
  ): Promise<Transaction | null>;
  save(transaction: Transaction): Promise<Transaction>;
  /** Cuenta las transacciones creadas en un día (para el correlativo TXN-YYYYMMDD-000123). */
  countByDatePrefix(datePrefix: string): Promise<number>;
}
