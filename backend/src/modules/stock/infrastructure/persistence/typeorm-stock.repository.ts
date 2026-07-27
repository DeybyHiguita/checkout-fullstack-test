import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockItem } from '../../domain/stock-item.entity';
import { StockRepository } from '../../domain/stock.repository';
import { StockItemOrmEntity } from './stock-item.orm-entity';

@Injectable()
export class TypeOrmStockRepository implements StockRepository {
  constructor(
    @InjectRepository(StockItemOrmEntity)
    private readonly repo: Repository<StockItemOrmEntity>,
  ) {}

  async findByProductId(productId: string): Promise<StockItem | null> {
    const row = await this.repo.findOne({ where: { productId } });
    return row ? TypeOrmStockRepository.toDomain(row) : null;
  }

  async save(stockItem: StockItem): Promise<StockItem> {
    await this.repo.save({
      id: stockItem.id,
      productId: stockItem.productId,
      availableQuantity: stockItem.availableQuantity,
      reservedQuantity: stockItem.reservedQuantity,
    });
    return stockItem;
  }

  private static toDomain(row: StockItemOrmEntity): StockItem {
    return new StockItem({
      id: row.id,
      productId: row.productId,
      availableQuantity: row.availableQuantity,
      reservedQuantity: row.reservedQuantity,
    });
  }
}
