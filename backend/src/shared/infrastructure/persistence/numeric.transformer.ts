import { ValueTransformer } from 'typeorm';

/**
 * TypeORM devuelve las columnas `bigint` como string (para no perder precisión).
 * Nuestros montos en centavos caben en el rango seguro de JS, así que los
 * convertimos a number en el dominio con este transformer.
 */
export const bigintToNumberTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
};
