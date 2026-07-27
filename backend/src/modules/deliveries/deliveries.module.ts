import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetDeliveryUseCase } from './application/get-delivery.use-case';
import { DELIVERY_REPOSITORY } from './domain/delivery.repository';
import { DeliveriesController } from './infrastructure/http/deliveries.controller';
import { DeliveryOrmEntity } from './infrastructure/persistence/delivery.orm-entity';
import { TypeOrmDeliveryRepository } from './infrastructure/persistence/typeorm-delivery.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity])],
  controllers: [DeliveriesController],
  providers: [
    { provide: DELIVERY_REPOSITORY, useClass: TypeOrmDeliveryRepository },
    GetDeliveryUseCase,
  ],
  exports: [DELIVERY_REPOSITORY],
})
export class DeliveriesModule {}
