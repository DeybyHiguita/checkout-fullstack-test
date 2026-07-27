import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { STOCK_REPOSITORY } from './domain/stock.repository';
import { StockItemOrmEntity } from './infrastructure/persistence/stock-item.orm-entity';
import { TypeOrmStockRepository } from './infrastructure/persistence/typeorm-stock.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StockItemOrmEntity])],
  providers: [{ provide: STOCK_REPOSITORY, useClass: TypeOrmStockRepository }],
  exports: [STOCK_REPOSITORY],
})
export class StockModule {}
