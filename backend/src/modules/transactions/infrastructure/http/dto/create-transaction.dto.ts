import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CustomerDto {
  @IsString()
  @Length(3, 150)
  fullName!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @Length(2, 10)
  documentType!: string;

  @Matches(/^\d{6,15}$/, {
    message: 'documentNumber debe tener entre 6 y 15 dígitos',
  })
  documentNumber!: string;

  @IsString()
  @Length(7, 20)
  phoneNumber!: string;
}

export class DeliveryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class CreateTransactionDto {
  @IsUUID()
  productId!: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery!: DeliveryDto;
}
