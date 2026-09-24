import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType, PriceType, PaymentMethod } from '@prisma/client';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';

export class CreateInvoiceItemInputDto {
  @ApiProperty({ description: 'ID del artículo a facturar' })
  @IsNotEmpty({ message: 'El articleId es obligatorio' })
  @IsUUID('all', { message: 'El articleId debe ser un UUID válido' })
  articleId: string;

  @ApiPropertyOptional({ description: 'ID del médico o personal que presta el servicio' })
  @IsOptional()
  @IsUUID('all', { message: 'El contributorId debe ser un UUID válido' })
  contributorId?: string;

  @ApiPropertyOptional({ description: 'ID del médico o entidad colaboradora beneficiaria' })
  @IsOptional()
  @IsUUID('all', { message: 'El entityId debe ser un UUID válido' })
  entityId?: string;

  @ApiProperty({ enum: PriceType, description: 'Tipo de precio seleccionado (PRICE_1 a PRICE_4)', default: PriceType.PRICE_1 })
  @IsNotEmpty({ message: 'El tipo de precio es obligatorio' })
  @IsEnum(PriceType, { message: 'El priceType debe ser PRICE_1, PRICE_2, PRICE_3 o PRICE_4' })
  priceType: PriceType;

  @ApiProperty({ description: 'Cantidad a facturar', example: 1, minimum: 0.001 })
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'La cantidad debe ser un número válido' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

export class CreateInitialPaymentInputDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Método de pago utilizado', default: PaymentMethod.CASH })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  @IsEnum(PaymentMethod, { message: 'Método de pago no válido' })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Monto a abonar a la factura', example: 50.0 })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'El monto debe ser numérico' })
  @Min(0.001, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiPropertyOptional({ description: 'Monto recibido entregado por cliente (para efectivo)', example: 60.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  receivedAmount?: number;

  @ApiPropertyOptional({ description: 'Referencia o lote del pago', example: 'REF-123456' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'ID del cliente fiscal existente' })
  @IsOptional()
  @IsUUID('all', { message: 'customerId debe ser un UUID válido' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'Datos para crear cliente fiscal de forma inline' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  newCustomer?: CreateCustomerDto;

  @ApiProperty({ enum: InvoiceType, description: 'Tipo de factura (CASH o CREDIT)', default: InvoiceType.CASH })
  @IsNotEmpty({ message: 'El tipo de factura es obligatorio' })
  @IsEnum(InvoiceType, { message: 'El tipo debe ser CASH o CREDIT' })
  type: InvoiceType;

  @ApiPropertyOptional({ description: 'Notas u observaciones adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemInputDto], description: 'Renglones del detalle de la factura' })
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemInputDto)
  items: CreateInvoiceItemInputDto[];

  @ApiPropertyOptional({ type: [CreateInitialPaymentInputDto], description: 'Pagos iniciales' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInitialPaymentInputDto)
  payments?: CreateInitialPaymentInputDto[];
}
