/** Prefijo de fecha YYYYMMDD (en UTC) para el correlativo de transacción. */
export const formatDatePrefix = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/** Construye un número legible tipo `TXN-20260724-000123`. */
export const buildTransactionNumber = (
  datePrefix: string,
  sequence: number,
): string => `TXN-${datePrefix}-${String(sequence).padStart(6, '0')}`;
