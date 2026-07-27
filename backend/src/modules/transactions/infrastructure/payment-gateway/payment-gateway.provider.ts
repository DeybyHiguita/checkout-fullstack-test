import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_GATEWAY } from '../../domain/payment-gateway.port';
import { PaymentGatewayAdapter } from './payment-gateway.adapter';
import { SimulatedPaymentGatewayAdapter } from './simulated-payment-gateway.adapter';

/**
 * Elige la implementación de la pasarela según configuración:
 *   - PAYMENT_GATEWAY_MODE=real       -> adaptador HTTP real (requiere llaves).
 *   - PAYMENT_GATEWAY_MODE=simulated  -> adaptador simulado (demo local, sin red).
 *   - sin valor: real si hay GATEWAY_BASE_URL, simulado en caso contrario.
 */
export const paymentGatewayProvider: Provider = {
  provide: PAYMENT_GATEWAY,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const mode = config.get<string>('PAYMENT_GATEWAY_MODE');
    const hasBaseUrl = Boolean(config.get<string>('GATEWAY_BASE_URL'));
    const useReal = mode === 'real' || (mode !== 'simulated' && hasBaseUrl);
    return useReal
      ? new PaymentGatewayAdapter(config)
      : new SimulatedPaymentGatewayAdapter();
  },
};
