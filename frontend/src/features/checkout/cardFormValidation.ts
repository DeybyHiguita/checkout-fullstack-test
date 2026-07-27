import { detectCardBrand } from './validators/cardBrand';
import { isValidCvc } from './validators/cvc';
import { isValidExpiry } from './validators/expiry';
import { isValidLuhn } from './validators/luhn';

export interface CheckoutForm {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvc: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export type FormErrors = Partial<Record<keyof CheckoutForm, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida el formulario completo y devuelve un mapa de errores por campo. */
export const validateForm = (form: CheckoutForm, now: Date = new Date()): FormErrors => {
  const errors: FormErrors = {};

  if (!isValidLuhn(form.cardNumber)) errors.cardNumber = 'Número de tarjeta inválido';
  else if (detectCardBrand(form.cardNumber) === 'UNKNOWN')
    errors.cardNumber = 'Solo Visa o MasterCard';

  if (form.cardHolder.trim().length < 3) errors.cardHolder = 'Ingresa el nombre del titular';
  if (!isValidExpiry(form.expiry, now)) errors.expiry = 'Expiración inválida o vencida';
  if (!isValidCvc(form.cvc)) errors.cvc = 'CVC de 3 dígitos';

  if (form.fullName.trim().length < 3) errors.fullName = 'Nombre requerido';
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Correo inválido';
  if (!/^\d{6,15}$/.test(form.documentNumber.trim()))
    errors.documentNumber = 'Documento de 6 a 15 dígitos';
  if (form.phoneNumber.trim().length < 7) errors.phoneNumber = 'Teléfono inválido';

  if (form.addressLine.trim().length === 0) errors.addressLine = 'Dirección requerida';
  if (form.city.trim().length === 0) errors.city = 'Ciudad requerida';
  if (form.region.trim().length === 0) errors.region = 'Departamento requerido';

  return errors;
};
