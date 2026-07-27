import { StockItem } from './stock-item.entity';

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');

export interface StockRepository {
  findByProductId(productId: string): Promise<StockItem | null>;
  save(stockItem: StockItem): Promise<StockItem>;
}
