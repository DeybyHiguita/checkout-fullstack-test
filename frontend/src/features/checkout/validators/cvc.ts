/** CVC de 3 dígitos (Visa/MasterCard). */
export const isValidCvc = (value: string): boolean => /^\d{3}$/.test(value.trim());
