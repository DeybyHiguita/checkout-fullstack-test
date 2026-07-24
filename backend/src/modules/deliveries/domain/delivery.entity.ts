export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'SCHEDULED';

export interface DeliveryAddress {
  addressLine: string;
  city: string;
  region: string;
  postalCode: string | null;
  country: string;
}

export interface DeliveryProps {
  id: string;
  transactionId: string;
  address: DeliveryAddress;
  deliveryFeeInCents: number;
  status: DeliveryStatus;
}

/**
 * Entidad de dominio Delivery. Una entrega no existe sin una transacción asociada.
 * Se marca `ASSIGNED` cuando la transacción queda aprobada.
 */
export class Delivery {
  readonly id: string;
  readonly transactionId: string;
  readonly address: DeliveryAddress;
  readonly deliveryFeeInCents: number;
  readonly status: DeliveryStatus;

  constructor(props: DeliveryProps) {
    this.id = props.id;
    this.transactionId = props.transactionId;
    this.address = props.address;
    this.deliveryFeeInCents = props.deliveryFeeInCents;
    this.status = props.status;
  }

  assign(): Delivery {
    return new Delivery({ ...this.toProps(), status: 'ASSIGNED' });
  }

  private toProps(): DeliveryProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      address: this.address,
      deliveryFeeInCents: this.deliveryFeeInCents,
      status: this.status,
    };
  }
}
