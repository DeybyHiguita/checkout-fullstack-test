/** Valida una expiración en formato MM/YY y que no esté vencida. */
export const isValidExpiry = (value: string, now: Date = new Date()): boolean => {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  // Último instante del mes de expiración.
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  return endOfMonth.getTime() >= now.getTime();
};
