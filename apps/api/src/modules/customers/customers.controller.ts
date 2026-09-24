import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar y buscar clientes fiscales' })
  async findAll(@Request() req: any, @Query('search') search?: string): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.customersService.findAll(tenantId, search);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('by-tax-id/:taxId')
  @ApiOperation({ summary: 'Buscar cliente fiscal por RIF / identificación' })
  async findByTaxId(@Param('taxId') taxId: string, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.customersService.findByTaxId(taxId, tenantId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.customersService.findById(id, tenantId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo cliente fiscal' })
  async create(@Body() dto: CreateCustomerDto, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.customersService.create(dto, tenantId);
    return {
      success: true,
      data,
      message: 'Cliente fiscal registrado exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un cliente fiscal' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Request() req: any,
  ): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.customersService.update(id, dto, tenantId);
    return {
      success: true,
      data,
      message: 'Cliente fiscal actualizado exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente fiscal (si no posee facturas)' })
  async delete(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.customersService.delete(id, tenantId);
    return {
      success: true,
      data,
      message: 'Cliente eliminado exitosamente',
      timestamp: new Date().toISOString(),
    };
  }
}
