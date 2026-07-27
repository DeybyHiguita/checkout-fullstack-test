import { Injectable, Logger } from '@nestjs/common';
import { ok, Result } from '../../../../shared/domain/result';
import {
  CreatePaymentInput,
  GatewayError,
  GatewayPaymentResult,
  GatewayPaymentStatus,
  PaymentGatewayPort,
} from '../../domain/payment-gateway.port';

/**
 * Pasarela SIMULADA para desarrollo/demo local, cuando no hay llaves reales de Sandbox.
 * NO hace ninguna llamada de red. El resultado se decide por el prefijo del token:
 *   - token que empieza con "tok_decline" -> DECLINED
 *   - token que empieza con "tok_error"   -> ERROR
 *   - cualquier otro                       -> APPROVED
 *
 * La marca se infiere del token ("...master..." -> MASTERCARD, si no VISA) y los
 * últimos 4 dígitos de su cola. Solo se activa vía factory cuando el modo es
 * "simulated" (o no hay GATEWAY_BASE_URL configurada).
 */
@Injectable()
export class SimulatedPaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(SimulatedPaymentGatewayAdapter.name);

  getAcceptanceToken(): Promise<Result<string, GatewayError>> {
    this.logger.warn('Usando pasarela SIMULADA (sin llaves reales)');
    return Promise.resolve(ok('simulated_acceptance_token'));
  }

  createPayment(
    input: CreatePaymentInput,
  ): Promise<Result<GatewayPaymentResult, GatewayError>> {
    const status = this.statusFromToken(input.cardToken);
    const brand = input.cardToken.toLowerCase().includes('master')
      ? 'MASTERCARD'
      : 'VISA';
    const lastFour = (input.cardToken.replace(/\D/g, '') + '4242').slice(-4);

    return Promise.resolve(
      ok({
        gatewayTransactionId: `sim-${Date.now()}`,
        status,
        cardBrand: brand,
        cardLastFour: lastFour,
        raw: { simulated: true, status, reference: input.reference },
      }),
    );
  }

  getPaymentStatus(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayPaymentResult, GatewayError>> {
    return Promise.resolve(
      ok({
        gatewayTransactionId,
        status: 'APPROVED',
        cardBrand: 'VISA',
        cardLastFour: '4242',
        raw: { simulated: true },
      }),
    );
  }

  private statusFromToken(token: string): GatewayPaymentStatus {
    if (token.startsWith('tok_decline')) return 'DECLINED';
    if (token.startsWith('tok_error')) return 'ERROR';
    return 'APPROVED';
  }
}
