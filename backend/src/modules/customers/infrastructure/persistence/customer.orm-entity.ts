import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'customers' })
@Index('idx_customer_email_document', ['email', 'documentNumber'])
export class CustomerOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 10 })
  documentType!: string;

  @Column({ name: 'document_number', type: 'varchar', length: 30 })
  documentNumber!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phoneNumber!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
