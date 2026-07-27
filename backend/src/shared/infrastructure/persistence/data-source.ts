import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { ProductOrmEntity } from '../../../modules/products/infrastructure/persistence/product.orm-entity';
import { StockItemOrmEntity } from '../../../modules/stock/infrastructure/persistence/stock-item.orm-entity';
import { CustomerOrmEntity } from '../../../modules/customers/infrastructure/persistence/customer.orm-entity';
import { DeliveryOrmEntity } from '../../../modules/deliveries/infrastructure/persistence/delivery.orm-entity';
import { TransactionOrmEntity } from '../../../modules/transactions/infrastructure/persistence/transaction.orm-entity';

loadEnv();

export const ormEntities = [
  ProductOrmEntity,
  StockItemOrmEntity,
  CustomerOrmEntity,
  DeliveryOrmEntity,
  TransactionOrmEntity,
];

const useUrl = Boolean(process.env.DATABASE_URL);

/**
 * DataSource usado por el CLI de TypeORM (migraciones). La app en runtime usa
 * TypeOrmModule.forRootAsync (ver database.module.ts) con la misma config.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(useUrl
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'checkout',
      }),
  entities: ormEntities,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});
