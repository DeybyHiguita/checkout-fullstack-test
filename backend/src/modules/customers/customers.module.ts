import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateOrGetCustomerUseCase } from './application/create-or-get-customer.use-case';
import { GetCustomerUseCase } from './application/get-customer.use-case';
import { CUSTOMER_REPOSITORY } from './domain/customer.repository';
import { CustomersController } from './infrastructure/http/customers.controller';
import { CustomerOrmEntity } from './infrastructure/persistence/customer.orm-entity';
import { TypeOrmCustomerRepository } from './infrastructure/persistence/typeorm-customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrmEntity])],
  controllers: [CustomersController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: TypeOrmCustomerRepository },
    GetCustomerUseCase,
    CreateOrGetCustomerUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY, CreateOrGetCustomerUseCase],
})
export class CustomersModule {}
