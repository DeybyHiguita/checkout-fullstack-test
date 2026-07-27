import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PayTransactionDto {
  @IsString()
  @IsNotEmpty()
  cardToken!: string;

  @IsString()
  @IsNotEmpty()
  acceptanceToken!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(36)
  installments?: number;
}
