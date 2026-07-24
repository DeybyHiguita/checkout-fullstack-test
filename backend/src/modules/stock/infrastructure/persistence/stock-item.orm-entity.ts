import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'stock_items' })
export class StockItemOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid', unique: true })
  productId!: string;

  @Column({ name: 'available_quantity', type: 'int' })
  availableQuantity!: number;

  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
