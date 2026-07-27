import { err, ok, Result } from '../../../shared/domain/result';

export type CustomerError =
  | { type: 'INVALID_EMAIL'; value: string }
  | { type: 'INVALID_DOCUMENT'; value: string }
  | { type: 'INVALID_NAME'; value: string };

export interface CustomerProps {
  id: string;
  fullName: string;
  email: string;
  documentType: string;
  documentNumber: string;
  phoneNumber: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOCUMENT_RE = /^\d{6,15}$/;

/**
 * Entidad de dominio Customer. La validación de formato vive aquí (regla de negocio),
 * independiente de los DTOs de HTTP. `create` devuelve un Result con error tipado.
 */
export class Customer {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly phoneNumber: string;

  private constructor(props: CustomerProps) {
    this.id = props.id;
    this.fullName = props.fullName;
    this.email = props.email;
    this.documentType = props.documentType;
    this.documentNumber = props.documentNumber;
    this.phoneNumber = props.phoneNumber;
  }

  static create(props: CustomerProps): Result<Customer, CustomerError> {
    const fullName = props.fullName.trim();
    if (fullName.length < 3) {
      return err({ type: 'INVALID_NAME', value: props.fullName });
    }
    const email = props.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return err({ type: 'INVALID_EMAIL', value: props.email });
    }
    if (!DOCUMENT_RE.test(props.documentNumber)) {
      return err({ type: 'INVALID_DOCUMENT', value: props.documentNumber });
    }
    return ok(new Customer({ ...props, fullName, email }));
  }

  /** Rehidrata desde persistencia sin re-validar (los datos ya fueron validados al crearse). */
  static fromPersistence(props: CustomerProps): Customer {
    return new Customer(props);
  }
}
