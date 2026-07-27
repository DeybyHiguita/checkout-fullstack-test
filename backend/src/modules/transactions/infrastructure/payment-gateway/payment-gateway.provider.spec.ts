import { ConfigService } from '@nestjs/config';
import { paymentGatewayProvider } from './payment-gateway.provider';
import { PaymentGatewayAdapter } from './payment-gateway.adapter';
import { SimulatedPaymentGatewayAdapter } from './simulated-payment-gateway.adapter';

const configWith = (
  values: Record<string, string | undefined>,
): ConfigService =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

// El provider define useFactory con inject: [ConfigService].
const factory = paymentGatewayProvider as {
  useFactory: (config: ConfigService) => unknown;
};

describe('paymentGatewayProvider', () => {
  it('usa el adaptador SIMULADO cuando el modo es simulated', () => {
    const gw = factory.useFactory(
      configWith({ PAYMENT_GATEWAY_MODE: 'simulated' }),
    );
    expect(gw).toBeInstanceOf(SimulatedPaymentGatewayAdapter);
  });

  it('usa el adaptador SIMULADO cuando no hay modo ni base URL', () => {
    const gw = factory.useFactory(configWith({}));
    expect(gw).toBeInstanceOf(SimulatedPaymentGatewayAdapter);
  });

  it('usa el adaptador REAL cuando el modo es real', () => {
    const gw = factory.useFactory(configWith({ PAYMENT_GATEWAY_MODE: 'real' }));
    expect(gw).toBeInstanceOf(PaymentGatewayAdapter);
  });

  it('usa el adaptador REAL cuando hay GATEWAY_BASE_URL sin modo explícito', () => {
    const gw = factory.useFactory(
      configWith({ GATEWAY_BASE_URL: 'https://x/v1' }),
    );
    expect(gw).toBeInstanceOf(PaymentGatewayAdapter);
  });
});
