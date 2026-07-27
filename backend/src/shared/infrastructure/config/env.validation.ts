import * as Joi from 'joi';

/**
 * Validación de variables de entorno al arranque. Si falta algo crítico
 * (o tiene un formato inválido), la app no levanta — fail fast.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  DATABASE_URL: Joi.string().optional(),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_NAME: Joi.string().default('checkout'),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),

  // real | simulated. Sin valor: real si hay GATEWAY_BASE_URL, simulado si no.
  PAYMENT_GATEWAY_MODE: Joi.string().valid('real', 'simulated').optional(),

  // Llaves de la pasarela: requeridas en producción, opcionales en dev/test.
  GATEWAY_BASE_URL: Joi.string().uri().allow('').optional(),
  GATEWAY_PUBLIC_KEY: Joi.string().allow('').optional(),
  GATEWAY_PRIVATE_KEY: Joi.string().allow('').optional(),
  GATEWAY_EVENTS_KEY: Joi.string().allow('').optional(),
  GATEWAY_INTEGRITY_SECRET: Joi.string().allow('').optional(),

  BASE_FEE_IN_CENTS: Joi.number().default(350000),
  DEFAULT_DELIVERY_FEE_IN_CENTS: Joi.number().default(800000),
});
