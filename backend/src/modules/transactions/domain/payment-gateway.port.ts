import { Result } from '../../../shared/domain/result';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export type GatewayError =
  | { type: 'GATEWAY_UNAVAILABLE'; detail?: string }
  | { type: 'GATEWAY_TIMEOUT' }
  | { type: 'INVALID_RESPONSE'; detail?: string };

export type GatewayPaymentStatus =
  'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING';

export interface GatewayPaymentResult {
  gatewayTransactionId: string;
  status: GatewayPaymentStatus;
  cardBrand: string | null;
  cardLastFour: string | null;
  raw: Record<string, unknown>;
}

export interface CreatePaymentInput {
  amountInCents: number;
  currency: string;
  reference: string;
  cardToken: string;
  acceptanceToken: string;
  customerEmail: string;
  installments: number;
}

/**
 * Puerto de la pasarela de pagos. El dominio depende de esta interface, no de la
 * implementación HTTP concreta. En tests se usa un FakePaymentGateway.
 */
export interface PaymentGatewayPort {
  getAcceptanceToken(): Promise<Result<string, GatewayError>>;
  createPayment(
    input: CreatePaymentInput,
  ): Promise<Result<GatewayPaymentResult, GatewayError>>;
  getPaymentStatus(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayPaymentResult, GatewayError>>;
}
