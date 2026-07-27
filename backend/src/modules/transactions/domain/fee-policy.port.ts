/**
 * Puerto para la política de cobros adicionales del checkout:
 * fee base fijo y fee de envío (que en este alcance puede depender de la ciudad).
 * El caso de uso depende de esta interface, no de ConfigService.
 */
export const FEE_POLICY = Symbol('FEE_POLICY');

export interface FeePolicyPort {
  getBaseFeeInCents(): number;
  getDeliveryFeeInCents(city: string): number;
}
