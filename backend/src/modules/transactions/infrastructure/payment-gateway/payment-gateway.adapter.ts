import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { err, ok, Result } from '../../../../shared/domain/result';
import {
  CreatePaymentInput,
  GatewayError,
  GatewayPaymentResult,
  GatewayPaymentStatus,
  PaymentGatewayPort,
} from '../../domain/payment-gateway.port';

/**
 * Adaptador HTTP de la pasarela de pagos (Sandbox). Implementa PaymentGatewayPort.
 *
 * El nombre es neutro a propósito (el enunciado prohíbe usar la marca en el repo).
 * Toda la configuración (URL base y llaves) viene de variables de entorno; el
 * código nunca contiene credenciales. Sigue el flujo estándar documentado:
 *   1. GET  /merchants/{public_key}            -> acceptance_token
 *   2. POST /transactions (Bearer private_key) -> crea el pago con firma de integridad
 *   3. GET  /transactions/{id}                 -> consulta el estado (polling del caso de uso)
 *
 * El PAN/CVC NUNCA pasan por aquí: el frontend tokeniza con la llave pública y
 * este adaptador solo maneja el token de tarjeta.
 */
@Injectable()
export class PaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(PaymentGatewayAdapter.name);
  private readonly timeoutMs = 10000;

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return (this.config.get<string>('GATEWAY_BASE_URL') ?? '').replace(
      /\/$/,
      '',
    );
  }
  private get publicKey(): string {
    return this.config.get<string>('GATEWAY_PUBLIC_KEY') ?? '';
  }
  private get privateKey(): string {
    return this.config.get<string>('GATEWAY_PRIVATE_KEY') ?? '';
  }
  private get integritySecret(): string {
    return this.config.get<string>('GATEWAY_INTEGRITY_SECRET') ?? '';
  }

  async getAcceptanceToken(): Promise<Result<string, GatewayError>> {
    const response = await this.request(
      `${this.baseUrl}/merchants/${this.publicKey}`,
      {
        method: 'GET',
      },
    );
    if (!response.ok) return response;

    const token = this.readPath(response.value, [
      'data',
      'presigned_acceptance',
      'acceptance_token',
    ]);
    if (typeof token !== 'string') {
      return err({
        type: 'INVALID_RESPONSE',
        detail: 'acceptance_token ausente',
      });
    }
    return ok(token);
  }

  async createPayment(
    input: CreatePaymentInput,
  ): Promise<Result<GatewayPaymentResult, GatewayError>> {
    const signature = this.buildIntegritySignature(
      input.reference,
      input.amountInCents,
      input.currency,
    );

    const body = {
      amount_in_cents: input.amountInCents,
      currency: input.currency,
      customer_email: input.customerEmail,
      reference: input.reference,
      acceptance_token: input.acceptanceToken,
      signature,
      payment_method: {
        type: 'CARD',
        installments: input.installments,
        token: input.cardToken,
      },
    };

    const response = await this.request(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.privateKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) return response;

    return this.parsePaymentResult(response.value);
  }

  async getPaymentStatus(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayPaymentResult, GatewayError>> {
    const response = await this.request(
      `${this.baseUrl}/transactions/${gatewayTransactionId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.privateKey}` },
      },
    );
    if (!response.ok) return response;

    return this.parsePaymentResult(response.value);
  }

  /** Firma de integridad: sha256(reference + amount + currency + secret). */
  private buildIntegritySignature(
    reference: string,
    amount: number,
    currency: string,
  ): string {
    return createHash('sha256')
      .update(`${reference}${amount}${currency}${this.integritySecret}`)
      .digest('hex');
  }

  private parsePaymentResult(
    payload: unknown,
  ): Result<GatewayPaymentResult, GatewayError> {
    const data = this.readPath(payload, ['data']);
    if (typeof data !== 'object' || data === null) {
      return err({ type: 'INVALID_RESPONSE', detail: 'data ausente' });
    }
    const record = data as Record<string, unknown>;
    const id = record.id;
    const rawStatus = record.status;
    if (typeof id !== 'string' && typeof id !== 'number') {
      return err({
        type: 'INVALID_RESPONSE',
        detail: 'id de transacción ausente',
      });
    }

    const extra = this.readPath(record, ['payment_method', 'extra']) as
      Record<string, unknown> | undefined;

    return ok({
      gatewayTransactionId: String(id),
      status: this.mapStatus(rawStatus),
      cardBrand: this.readString(extra?.brand),
      cardLastFour: this.readString(extra?.last_four),
      raw: record,
    });
  }

  private mapStatus(status: unknown): GatewayPaymentStatus {
    switch (status) {
      case 'APPROVED':
        return 'APPROVED';
      case 'DECLINED':
      case 'VOIDED':
        return 'DECLINED';
      case 'PENDING':
        return 'PENDING';
      default:
        return 'ERROR';
    }
  }

  /** Wrapper de fetch con timeout que traduce fallos de red a GatewayError. */
  private async request(
    url: string,
    init: RequestInit,
  ): Promise<Result<unknown, GatewayError>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const json: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.logger.warn(
          `Gateway respondió ${res.status} en ${init.method} ${url}`,
        );
        return err({
          type: 'GATEWAY_UNAVAILABLE',
          detail: `HTTP ${res.status}`,
        });
      }
      return ok(json);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return err({ type: 'GATEWAY_TIMEOUT' });
      }
      return err({ type: 'GATEWAY_UNAVAILABLE', detail: (e as Error).message });
    } finally {
      clearTimeout(timer);
    }
  }

  private readPath(obj: unknown, path: string[]): unknown {
    let current: unknown = obj;
    for (const key of path) {
      if (typeof current !== 'object' || current === null) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}
