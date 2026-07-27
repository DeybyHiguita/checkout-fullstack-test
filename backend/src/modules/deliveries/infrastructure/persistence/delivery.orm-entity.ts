import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { bigintToNumberTransformer } from '../../../../shared/infrastructure/persistence/numeric.transformer';
import type { DeliveryStatus } from '../../domain/delivery.entity';

@Entity({ name: 'deliveries' })
export class DeliveryOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'transaction_id', type: 'uuid', unique: true })
  transactionId!: string;

  @Column({ name: 'address_line', type: 'varchar', length: 200 })
  addressLine!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  region!: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar', length: 2, default: 'CO' })
  country!: string;

  @Column({
    name: 'delivery_fee_in_cents',
    type: 'bigint',
    transformer: bigintToNumberTransformer,
  })
  deliveryFeeInCents!: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: DeliveryStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
