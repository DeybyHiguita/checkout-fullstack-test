import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../shared/domain/result';
import { Transaction } from '../domain/transaction.entity';
import {
  TRANSACTION_REPOSITORY,
  type TransactionRepository,
} from '../domain/transaction.repository';

export type GetTransactionError = {
  type: 'TRANSACTION_NOT_FOUND';
  reference: string;
};

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactions: TransactionRepository,
  ) {}

  async byId(id: string): Promise<Result<Transaction, GetTransactionError>> {
    const tx = await this.transactions.findById(id);
    return tx ? ok(tx) : err({ type: 'TRANSACTION_NOT_FOUND', reference: id });
  }

  async byNumber(
    transactionNumber: string,
  ): Promise<Result<Transaction, GetTransactionError>> {
    const tx =
      await this.transactions.findByTransactionNumber(transactionNumber);
    return tx
      ? ok(tx)
      : err({ type: 'TRANSACTION_NOT_FOUND', reference: transactionNumber });
  }
}
