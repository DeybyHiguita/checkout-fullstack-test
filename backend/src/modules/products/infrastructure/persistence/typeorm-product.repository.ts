import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/product.entity';
import { ProductRepository } from '../../domain/product.repository';
import { ProductOrmEntity } from './product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repo.find({ order: { createdAt: 'ASC' } });
    return rows.map(TypeOrmProductRepository.toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? TypeOrmProductRepository.toDomain(row) : null;
  }

  private static toDomain(row: ProductOrmEntity): Product {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      priceInCents: row.priceInCents,
      currency: row.currency,
      imageUrl: row.imageUrl,
    });
  }
}
