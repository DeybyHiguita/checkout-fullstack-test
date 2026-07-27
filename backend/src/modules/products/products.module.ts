import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from '../stock/stock.module';
import { GetProductUseCase } from './application/get-product.use-case';
import { GetProductsUseCase } from './application/get-products.use-case';
import { PRODUCT_REPOSITORY } from './domain/product.repository';
import { ProductsController } from './infrastructure/http/products.controller';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity]), StockModule],
  controllers: [ProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    GetProductsUseCase,
    GetProductUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
