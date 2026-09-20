import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar citas médicas' })
  @ApiQuery({ name: 'status', enum: AppointmentStatus, required: false, description: 'Filtrar por estado' })
  @ApiResponse({ status: 200, description: 'Lista de citas' })
  async findAll(@Query('status') status?: AppointmentStatus) {
    return this.appointmentsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una cita médica' })
  @ApiResponse({ status: 200, description: 'Detalle de la cita' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agendar una nueva cita médica' })
  @ApiResponse({ status: 201, description: 'Cita agendada exitosamente' })
  async create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de una cita médica' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
    return this.appointmentsService.updateStatus(id, status);
  }
}
