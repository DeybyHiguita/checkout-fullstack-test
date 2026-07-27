import { Inject, Injectable } from '@nestjs/common';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from '../../stock/domain/stock.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../domain/product.repository';
import { ProductWithStock } from './product-with-stock';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(STOCK_REPOSITORY) private readonly stock: StockRepository,
  ) {}

  async execute(): Promise<ProductWithStock[]> {
    const products = await this.products.findAll();
    const result: ProductWithStock[] = [];
    for (const product of products) {
      const stockItem = await this.stock.findByProductId(product.id);
      result.push({
        product,
        availableQuantity: stockItem ? stockItem.sellableQuantity : 0,
      });
    }
    return result;
  }
}
