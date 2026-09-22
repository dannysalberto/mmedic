import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: AppointmentStatus) {
    return this.prisma.appointment.findMany({
      where: status ? { status } : undefined,
      orderBy: { dateTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            dni: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    return appointment;
  }

  async create(dto: CreateAppointmentDto) {
    const tenantId = (dto as any).tenantId || 'default-clinic';
    return this.prisma.appointment.create({
      data: {
        ...dto,
        tenantId,
        dateTime: new Date(dto.dateTime),
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }
}
