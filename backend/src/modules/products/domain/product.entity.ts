export interface ProductProps {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  imageUrl: string;
}

/**
 * Entidad de dominio Product. No conoce TypeORM ni NestJS.
 * El precio se maneja en centavos (enteros) para evitar errores de coma flotante.
 */
export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceInCents: number;
  readonly currency: string;
  readonly imageUrl: string;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.priceInCents = props.priceInCents;
    this.currency = props.currency;
    this.imageUrl = props.imageUrl;
  }
}
