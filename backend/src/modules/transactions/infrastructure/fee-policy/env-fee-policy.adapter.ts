import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeePolicyPort } from '../../domain/fee-policy.port';

/**
 * Adaptador de FeePolicyPort que lee los fees de las variables de entorno.
 * El fee de envío es fijo por ahora (mismo valor para todas las ciudades),
 * pero la firma recibe `city` para poder evolucionar a tarifas por zona.
 */
@Injectable()
export class EnvFeePolicyAdapter implements FeePolicyPort {
  constructor(private readonly config: ConfigService) {}

  getBaseFeeInCents(): number {
    return this.config.get<number>('BASE_FEE_IN_CENTS', 350000);
  }

  getDeliveryFeeInCents(_city: string): number {
    return this.config.get<number>('DEFAULT_DELIVERY_FEE_IN_CENTS', 800000);
  }
}
