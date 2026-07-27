import { Product } from '../domain/product.entity';

/** Vista de lectura: producto + unidades realmente comprables (disponible - reservado). */
export interface ProductWithStock {
  product: Product;
  availableQuantity: number;
}

export type GetProductError = { type: 'PRODUCT_NOT_FOUND'; productId: string };
