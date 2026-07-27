import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepository } from '../../domain/transaction.repository';
import { TransactionOrmEntity } from './transaction.orm-entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? TypeOrmTransactionRepository.toDomain(row) : null;
  }

  async findByTransactionNumber(
    transactionNumber: string,
  ): Promise<Transaction | null> {
    const row = await this.repo.findOne({ where: { transactionNumber } });
    return row ? TypeOrmTransactionRepository.toDomain(row) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    await this.repo.save({
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      productId: transaction.productId,
      customerId: transaction.customerId,
      productAmountInCents: transaction.amounts.productAmountInCents,
      baseFeeInCents: transaction.amounts.baseFeeInCents,
      deliveryFeeInCents: transaction.amounts.deliveryFeeInCents,
      totalAmountInCents: transaction.totalAmountInCents,
      currency: transaction.amounts.currency,
      status: transaction.status,
      gatewayTransactionId: transaction.gatewayTransactionId,
      gatewayStatusRaw: transaction.gatewayStatusRaw,
      cardBrand: transaction.cardBrand,
      cardLastFour: transaction.cardLastFour,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
    return transaction;
  }

  async countByDatePrefix(datePrefix: string): Promise<number> {
    return this.repo.count({
      where: { transactionNumber: Like(`TXN-${datePrefix}-%`) },
    });
  }

  private static toDomain(row: TransactionOrmEntity): Transaction {
    return new Transaction({
      id: row.id,
      transactionNumber: row.transactionNumber,
      productId: row.productId,
      customerId: row.customerId,
      amounts: {
        productAmountInCents: row.productAmountInCents,
        baseFeeInCents: row.baseFeeInCents,
        deliveryFeeInCents: row.deliveryFeeInCents,
        currency: row.currency,
      },
      status: row.status,
      gatewayTransactionId: row.gatewayTransactionId,
      gatewayStatusRaw: row.gatewayStatusRaw,
      cardBrand: row.cardBrand,
      cardLastFour: row.cardLastFour,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
