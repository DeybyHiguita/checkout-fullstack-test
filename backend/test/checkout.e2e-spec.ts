import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ProductOrmEntity } from '../src/modules/products/infrastructure/persistence/product.orm-entity';
import { StockItemOrmEntity } from '../src/modules/stock/infrastructure/persistence/stock-item.orm-entity';
import { HttpExceptionFilter } from '../src/shared/http/http-exception.filter';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
};
const TEST_DB = 'checkout_e2e';

async function recreateDatabase(): Promise<void> {
  const client = new Client({ ...DB, database: 'postgres' });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${TEST_DB}`);
  await client.end();
}

const customer = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  documentType: 'CC',
  documentNumber: '1234567890',
  phoneNumber: '3001234567',
};
const delivery = {
  addressLine: 'Cra 1 # 2-3',
  city: 'Bogotá',
  region: 'Cundinamarca',
};

describe('Checkout (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productA: string;
  let productB: string;
  let approvedTxId: string;

  const seedProduct = async (quantity: number): Promise<string> => {
    const id = randomUUID();
    await dataSource.getRepository(ProductOrmEntity).save({
      id,
      name: 'Producto E2E',
      description: 'test',
      priceInCents: 45000000,
      currency: 'COP',
      imageUrl: 'https://img',
    });
    await dataSource.getRepository(StockItemOrmEntity).save({
      id: randomUUID(),
      productId: id,
      availableQuantity: quantity,
      reservedQuantity: 0,
    });
    return id;
  };

  const availableOf = async (productId: string): Promise<number> => {
    const res = await request(app.getHttpServer()).get(
      `/api/v1/products/${productId}`,
    );
    return res.body.availableQuantity as number;
  };

  const createPendingTx = async (productId: string) =>
    request(app.getHttpServer())
      .post('/api/v1/transactions')
      .send({ productId, customer, delivery });

  beforeAll(async () => {
    // El entorno (NODE_ENV=test, DATABASE_URL a checkout_e2e, pasarela simulada)
    // lo fija test/e2e-setup.ts antes de importar los módulos.
    await recreateDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    dataSource = app.get(DataSource);
    productA = await seedProduct(3);
    productB = await seedProduct(1);
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('flujo aprobado: crea PENDING, paga, queda APPROVED y decrementa stock', async () => {
    expect(await availableOf(productA)).toBe(3);

    const created = await createPendingTx(productA);
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('PENDING');
    approvedTxId = created.body.transactionId as string;

    const paid = await request(app.getHttpServer())
      .post(`/api/v1/transactions/${approvedTxId}/pay`)
      .send({
        cardToken: 'tok_test_ok',
        acceptanceToken: 'acc',
        installments: 1,
      });
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe('APPROVED');
    expect(paid.body.cardLastFour).toBeTruthy();

    const status = await request(app.getHttpServer()).get(
      `/api/v1/transactions/${approvedTxId}`,
    );
    expect(status.body.status).toBe('APPROVED');
    expect(await availableOf(productA)).toBe(2);
  });

  it('flujo declinado: marca DECLINED y libera el stock reservado', async () => {
    const created = await createPendingTx(productA);
    const txId = created.body.transactionId as string;
    expect(await availableOf(productA)).toBe(1); // reservado

    const paid = await request(app.getHttpServer())
      .post(`/api/v1/transactions/${txId}/pay`)
      .send({
        cardToken: 'tok_decline_x',
        acceptanceToken: 'acc',
        installments: 1,
      });
    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe('DECLINED');

    expect(await availableOf(productA)).toBe(2); // liberado
  });

  it('sin stock: la segunda transacción sobre un producto agotado da 409 OUT_OF_STOCK', async () => {
    const first = await createPendingTx(productB);
    expect(first.status).toBe(201);

    const second = await createPendingTx(productB);
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('OUT_OF_STOCK');
  });

  it('doble pago: pagar una transacción ya resuelta da 409 TRANSACTION_ALREADY_RESOLVED', async () => {
    const again = await request(app.getHttpServer())
      .post(`/api/v1/transactions/${approvedTxId}/pay`)
      .send({
        cardToken: 'tok_test_ok',
        acceptanceToken: 'acc',
        installments: 1,
      });
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('TRANSACTION_ALREADY_RESOLVED');
  });

  it('validación: body inválido en POST /transactions da 400 VALIDATION_ERROR', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .send({ productId: 'not-a-uuid', customer: {}, delivery: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});
