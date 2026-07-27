import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../shared/domain/result';
import {
  PAYMENT_GATEWAY,
  type GatewayError,
  type PaymentGatewayPort,
} from '../domain/payment-gateway.port';

/**
 * Obtiene el acceptance_token (términos y tratamiento de datos) desde la pasarela.
 * El frontend lo necesita para tokenizar/pagar.
 */
@Injectable()
export class GetAcceptanceTokenUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
  ) {}

  execute(): Promise<Result<string, GatewayError>> {
    return this.gateway.getAcceptanceToken();
  }
}
