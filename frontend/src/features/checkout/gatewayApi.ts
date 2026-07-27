import { apiClient } from '../../shared/api/client';
import { GATEWAY_BASE_URL, GATEWAY_PUBLIC_KEY } from './gatewayEnv';

export interface TokenizeCardInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  holder: string;
}

interface TokenizeResponse {
  status?: string;
  data?: { id?: string };
}

/**
 * Token simulado (sin llaves reales). El prefijo hace que el backend en modo
 * simulado apruebe o decline: una tarjeta que termina en 0002 se declina.
 */
function simulateToken(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.endsWith('0002')) return 'tok_decline_sim';
  if (digits.endsWith('0119')) return 'tok_error_sim';
  return `tok_test_${digits.slice(-4)}`;
}

export const gatewayApi = {
  /** Acceptance token vía nuestro backend (funciona en modo real y simulado). */
  getAcceptanceToken: (): Promise<string> =>
    apiClient
      .get<{ acceptanceToken: string }>('/payments/acceptance-token')
      .then((r) => r.acceptanceToken),

  /**
   * Tokeniza la tarjeta. Con llaves reales, llama directamente a la pasarela con
   * la llave pública (el PAN/CVC nunca pasan por nuestro backend). Sin llaves,
   * genera un token simulado para poder probar el flujo completo en local.
   */
  tokenizeCard: async (input: TokenizeCardInput): Promise<string> => {
    if (!GATEWAY_PUBLIC_KEY || !GATEWAY_BASE_URL) {
      return simulateToken(input.number);
    }

    const response = await fetch(`${GATEWAY_BASE_URL}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GATEWAY_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        number: input.number.replace(/\D/g, ''),
        cvc: input.cvc,
        exp_month: input.expMonth,
        exp_year: input.expYear,
        card_holder: input.holder,
      }),
    });

    const json = (await response.json().catch(() => ({}))) as TokenizeResponse;
    if (!response.ok || json.status !== 'CREATED' || !json.data?.id) {
      throw new Error('No se pudo tokenizar la tarjeta. Verifica los datos.');
    }
    return json.data.id;
  },
};
