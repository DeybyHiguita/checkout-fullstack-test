import { Product } from './product.entity';

/** Puerto (interface) del repositorio de productos. Implementado por un adaptador en infrastructure. */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
}
