/** Valida un número de tarjeta con el algoritmo de Luhn (ignora espacios). */
export const isValidLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
};
