import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepository } from '../../domain/delivery.repository';
import { DeliveryOrmEntity } from './delivery.orm-entity';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepository {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repo: Repository<DeliveryOrmEntity>,
  ) {}

  async findById(id: string): Promise<Delivery | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? TypeOrmDeliveryRepository.toDomain(row) : null;
  }

  async findByTransactionId(transactionId: string): Promise<Delivery | null> {
    const row = await this.repo.findOne({ where: { transactionId } });
    return row ? TypeOrmDeliveryRepository.toDomain(row) : null;
  }

  async save(delivery: Delivery): Promise<Delivery> {
    await this.repo.save({
      id: delivery.id,
      transactionId: delivery.transactionId,
      addressLine: delivery.address.addressLine,
      city: delivery.address.city,
      region: delivery.address.region,
      postalCode: delivery.address.postalCode,
      country: delivery.address.country,
      deliveryFeeInCents: delivery.deliveryFeeInCents,
      status: delivery.status,
    });
    return delivery;
  }

  private static toDomain(row: DeliveryOrmEntity): Delivery {
    return new Delivery({
      id: row.id,
      transactionId: row.transactionId,
      address: {
        addressLine: row.addressLine,
        city: row.city,
        region: row.region,
        postalCode: row.postalCode,
        country: row.country,
      },
      deliveryFeeInCents: row.deliveryFeeInCents,
      status: row.status,
    });
  }
}
