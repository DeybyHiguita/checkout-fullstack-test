export type CardBrand = 'VISA' | 'MASTERCARD' | 'UNKNOWN';

/**
 * Detecta la marca por rango de BIN:
 *  - Visa: empieza en 4
 *  - MasterCard: 51–55 o 2221–2720
 */
export const detectCardBrand = (cardNumber: string): CardBrand => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length === 0) return 'UNKNOWN';

  if (digits.startsWith('4')) return 'VISA';

  const firstTwo = Number(digits.slice(0, 2));
  if (firstTwo >= 51 && firstTwo <= 55) return 'MASTERCARD';

  const firstFour = Number(digits.slice(0, 4));
  if (digits.length >= 4 && firstFour >= 2221 && firstFour <= 2720) return 'MASTERCARD';

  return 'UNKNOWN';
};
