import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lista de pacientes' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, apellido o DNI' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  async findAll(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un paciente por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del paciente' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  @ApiResponse({ status: 409, description: 'DNI duplicado' })
  async create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }
}
