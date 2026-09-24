import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto, VoidInvoiceDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';
import { InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  private checkAdmin(req: any) {
    const role = req.user?.role;
    if (role !== 'ROL_ADMIN' && role !== 'ROL_SUPERADMIN') {
      throw new ForbiddenException('Operación restringida exclusivamente a usuarios administradores');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas emitidas' })
  async findAll(@Request() req: any, @Query('status') status?: InvoiceStatus, @Query('search') search?: string): Promise<ApiResponse<any>> {
    const data = await this.invoicesService.findAll(req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic', status, search);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de factura' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.invoicesService.findOne(id, req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Emitir nueva factura con clientes y detalle' })
  async create(@Body() dto: CreateInvoiceDto, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.invoicesService.create(dto, tenantId, req.user?.id);
    return { success: true, data, message: 'Factura emitida exitosamente', timestamp: new Date().toISOString() };
  }

  @Patch(':id/void')
  @ApiOperation({ summary: 'Anular factura emitida (Solo Administrador)' })
  async voidInvoice(@Param('id') id: string, @Body() dto: VoidInvoiceDto, @Request() req: any): Promise<ApiResponse<any>> {
    this.checkAdmin(req);
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.invoicesService.voidInvoice(id, dto.reason, tenantId);
    return { success: true, data, message: 'Factura anulada exitosamente', timestamp: new Date().toISOString() };
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Registrar cobro/pago a factura' })
  async addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.invoicesService.addPayment(id, dto, tenantId, req.user?.id);
    return { success: true, data, message: 'Pago registrado exitosamente', timestamp: new Date().toISOString() };
  }

  @Delete(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Eliminar pago de factura (Solo Administrador)' })
  async deletePayment(@Param('id') id: string, @Param('paymentId') paymentId: string, @Request() req: any): Promise<ApiResponse<any>> {
    this.checkAdmin(req);
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.invoicesService.deletePayment(id, paymentId, tenantId);
    return { success: true, data, message: 'Pago eliminado y saldo recalculado', timestamp: new Date().toISOString() };
  }

  @Post(':id/send-email')
  @ApiOperation({ summary: 'Enviar factura por correo al cliente' })
  async sendEmail(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.invoicesService.sendInvoiceEmail(id, tenantId);
    return { success: true, data, message: 'Factura enviada por correo', timestamp: new Date().toISOString() };
  }
}
