import { ConfigService } from '@nestjs/config';
import { EnvFeePolicyAdapter } from './env-fee-policy.adapter';

const configWith = (values: Record<string, number>): ConfigService =>
  ({
    get: (key: string, fallback: number) => values[key] ?? fallback,
  }) as unknown as ConfigService;

describe('EnvFeePolicyAdapter', () => {
  it('lee los fees desde la configuración', () => {
    const adapter = new EnvFeePolicyAdapter(
      configWith({
        BASE_FEE_IN_CENTS: 500000,
        DEFAULT_DELIVERY_FEE_IN_CENTS: 900000,
      }),
    );
    expect(adapter.getBaseFeeInCents()).toBe(500000);
    expect(adapter.getDeliveryFeeInCents('Bogotá')).toBe(900000);
  });

  it('usa los valores por defecto si no están configurados', () => {
    const adapter = new EnvFeePolicyAdapter(configWith({}));
    expect(adapter.getBaseFeeInCents()).toBe(350000);
    expect(adapter.getDeliveryFeeInCents('Medellín')).toBe(800000);
  });
});
