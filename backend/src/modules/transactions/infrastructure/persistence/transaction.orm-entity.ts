import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { bigintToNumberTransformer } from '../../../../shared/infrastructure/persistence/numeric.transformer';
import type { TransactionStatus } from '../../domain/transaction.entity';

@Entity({ name: 'transactions' })
export class TransactionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index('idx_transaction_number', { unique: true })
  @Column({ name: 'transaction_number', type: 'varchar', length: 30 })
  transactionNumber!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Index('idx_transaction_customer')
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({
    name: 'product_amount_in_cents',
    type: 'bigint',
    transformer: bigintToNumberTransformer,
  })
  productAmountInCents!: number;

  @Column({
    name: 'base_fee_in_cents',
    type: 'bigint',
    transformer: bigintToNumberTransformer,
  })
  baseFeeInCents!: number;

  @Column({
    name: 'delivery_fee_in_cents',
    type: 'bigint',
    transformer: bigintToNumberTransformer,
  })
  deliveryFeeInCents!: number;

  @Column({
    name: 'total_amount_in_cents',
    type: 'bigint',
    transformer: bigintToNumberTransformer,
  })
  totalAmountInCents!: number;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency!: string;

  @Index('idx_transaction_status')
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: TransactionStatus;

  @Index('idx_transaction_gateway_id')
  @Column({
    name: 'gateway_transaction_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  gatewayTransactionId!: string | null;

  @Column({ name: 'gateway_status_raw', type: 'jsonb', nullable: true })
  gatewayStatusRaw!: Record<string, unknown> | null;

  @Column({ name: 'card_brand', type: 'varchar', length: 20, nullable: true })
  cardBrand!: string | null;

  @Column({
    name: 'card_last_four',
    type: 'varchar',
    length: 4,
    nullable: true,
  })
  cardLastFour!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
