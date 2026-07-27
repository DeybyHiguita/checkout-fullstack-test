import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { ProductsModule } from '../products/products.module';
import { StockModule } from '../stock/stock.module';
import { CreatePendingTransactionUseCase } from './application/create-pending-transaction.use-case';
import { GetAcceptanceTokenUseCase } from './application/get-acceptance-token.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';
import { ProcessPaymentUseCase } from './application/process-payment.use-case';
import { FEE_POLICY } from './domain/fee-policy.port';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { EnvFeePolicyAdapter } from './infrastructure/fee-policy/env-fee-policy.adapter';
import { PaymentsController } from './infrastructure/http/payments.controller';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { paymentGatewayProvider } from './infrastructure/payment-gateway/payment-gateway.provider';
import { TransactionOrmEntity } from './infrastructure/persistence/transaction.orm-entity';
import { TypeOrmTransactionRepository } from './infrastructure/persistence/typeorm-transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionOrmEntity]),
    ProductsModule,
    StockModule,
    DeliveriesModule,
    CustomersModule,
  ],
  controllers: [TransactionsController, PaymentsController],
  providers: [
    { provide: TRANSACTION_REPOSITORY, useClass: TypeOrmTransactionRepository },
    { provide: FEE_POLICY, useClass: EnvFeePolicyAdapter },
    paymentGatewayProvider,
    CreatePendingTransactionUseCase,
    GetTransactionUseCase,
    ProcessPaymentUseCase,
    GetAcceptanceTokenUseCase,
  ],
  exports: [TRANSACTION_REPOSITORY],
})
export class TransactionsModule {}
