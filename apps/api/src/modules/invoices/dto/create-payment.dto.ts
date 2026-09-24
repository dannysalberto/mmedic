import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Método de pago', default: PaymentMethod.CASH })
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  @IsEnum(PaymentMethod, { message: 'Método de pago no válido' })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Monto a abonar', example: 50.0 })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'El monto debe ser numérico' })
  @Min(0.001, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiPropertyOptional({ description: 'Monto entregado por el cliente (para cálculo de vuelto en efectivo)', example: 100.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  receivedAmount?: number;

  @ApiPropertyOptional({ description: 'Referencia bancaria, hash o comprobante' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class VoidInvoiceDto {
  @ApiProperty({ description: 'Motivo de la anulación de la factura', example: 'Error en cantidad facturada solicitado por gerencia' })
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio' })
  @IsString()
  reason: string;
}
