import 'reflect-metadata';

// Se ejecuta ANTES de importar los módulos de la app (incluido AppModule),
// garantizando que ConfigModule ignore el .env (NODE_ENV=test) y use estos valores:
// BD de test aislada y pasarela simulada (sin red).
process.env.NODE_ENV = 'test';
process.env.PAYMENT_GATEWAY_MODE = 'simulated';
process.env.DB_SYNCHRONIZE = 'true';
process.env.DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/checkout_e2e';
