/** Formatea un monto en centavos (COP) a un string de moneda legible. */
export const formatCurrency = (amountInCents: number, currency = 'COP'): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};
