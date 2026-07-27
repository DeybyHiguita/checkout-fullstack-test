/** Formatea el número de tarjeta en grupos de 4 (máx 19 dígitos). */
export const maskCardNumber = (value: string): string =>
  value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

/** Formatea la expiración como MM/YY. */
export const maskExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

/** Últimos 4 dígitos de un número de tarjeta. */
export const lastFour = (cardNumber: string): string => cardNumber.replace(/\D/g, '').slice(-4);
