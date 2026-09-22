import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { dni: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        appointments: {
          take: 3,
          orderBy: { dateTime: 'desc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { dateTime: 'desc' },
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }

    return patient;
  }

  async create(dto: CreatePatientDto) {
    const existing = await this.prisma.patient.findUnique({
      where: { dni: dto.dni },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un paciente con el DNI ${dto.dni}`);
    }

    const tenantId = (dto as any).tenantId || 'default-clinic';
    return this.prisma.patient.create({
      data: {
        ...dto,
        tenantId,
        birthDate: new Date(dto.birthDate),
      },
    });
  }

  async count() {
    return this.prisma.patient.count();
  }
}
