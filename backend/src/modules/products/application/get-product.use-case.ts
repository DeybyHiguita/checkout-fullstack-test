import { Inject, Injectable } from '@nestjs/common';
import { err, ok, Result } from '../../../shared/domain/result';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from '../../stock/domain/stock.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../domain/product.repository';
import { GetProductError, ProductWithStock } from './product-with-stock';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepository,
  ) {}

  async execute(
    productId: string,
  ): Promise<Result<ProductWithStock, GetProductError>> {
    const product = await this.products.findById(productId);
    if (!product) {
      return err({ type: 'PRODUCT_NOT_FOUND', productId });
    }
    const stockItem = await this.stock.findByProductId(productId);
    return ok({
      product,
      availableQuantity: stockItem ? stockItem.sellableQuantity : 0,
    });
  }
}
