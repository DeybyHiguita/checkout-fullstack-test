import { ProductWithStock } from '../../../application/product-with-stock';

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  imageUrl: string;
  availableQuantity: number;
}

export const toProductResponse = (
  pws: ProductWithStock,
): ProductResponseDto => ({
  id: pws.product.id,
  name: pws.product.name,
  description: pws.product.description,
  priceInCents: pws.product.priceInCents,
  currency: pws.product.currency,
  imageUrl: pws.product.imageUrl,
  availableQuantity: pws.availableQuantity,
});
