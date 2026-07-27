import type { CheckoutState } from '../features/checkout/checkoutSlice';

const KEY = 'checkout-state-v1';

/**
 * Persiste el slice `checkout` en localStorage para recuperar el progreso ante un
 * refresh. Solo contiene datos no sensibles (token/marca/últimos 4), nunca PAN/CVC.
 */
export const loadCheckoutState = (): CheckoutState | undefined => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CheckoutState) : undefined;
  } catch {
    return undefined;
  }
};

export const saveCheckoutState = (state: CheckoutState): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
};

export const clearCheckoutState = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* se ignora */
  }
};
