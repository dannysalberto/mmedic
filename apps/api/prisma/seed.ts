import { PrismaClient, Role, AppointmentStatus, Gender } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MMedic PostgreSQL Database (Supabase)...');

  // 1. Inquilino / Tenant Inicial por Defecto
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default-clinic' },
    update: {},
    create: {
      slug: 'default-clinic',
      name: 'Clínica Central MMedic',
      isActive: true,
    },
  });
  console.log(`Tenant listo: ${defaultTenant.name} (${defaultTenant.id})`);

  // 2. Hash de contraseña superadmin: superadmin@123#
  const superadminHash = await bcrypt.hash('superadmin@123#', 10);
  const staffPasswordHash = await bcrypt.hash('Password123#', 10);

  // 3. Crear / Upsert usuario SUPERADMIN
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      passwordHash: superadminHash,
      role: Role.ROL_SUPERADMIN,
      isActive: true,
    },
    create: {
      tenantId: defaultTenant.id,
      username: 'superadmin',
      email: 'superadmin@mmedic.com',
      passwordHash: superadminHash,
      fullName: 'Super Administrador del Sistema',
      role: Role.ROL_SUPERADMIN,
      isActive: true,
    },
  });
  console.log(`Usuario Superadmin listo: ${superadmin.username}`);

  // 4. Crear / Upsert usuarios de ejemplo para otros roles
  const doctor = await prisma.user.upsert({
    where: { username: 'dr_morales' },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      username: 'dr_morales',
      email: 'doctor@mmedic.com',
      passwordHash: staffPasswordHash,
      fullName: 'Dr. Alejandro Morales',
      role: Role.ROL_MEDICO,
      isActive: true,
    },
  });

  const cajero = await prisma.user.upsert({
    where: { username: 'cajero_carlos' },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      username: 'cajero_carlos',
      email: 'cajero@mmedic.com',
      passwordHash: staffPasswordHash,
      fullName: 'Carlos Mendoza (Cajero)',
      role: Role.ROL_CAJERO,
      isActive: true,
    },
  });

  const adminLocal = await prisma.user.upsert({
    where: { username: 'admin_clinica' },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      username: 'admin_clinica',
      email: 'admin@mmedic.com',
      passwordHash: staffPasswordHash,
      fullName: 'Lic. Laura Benítez (Administradora)',
      role: Role.ROL_ADMIN,
      isActive: true,
    },
  });
  console.log('Usuarios base creados (Doctor, Cajero, Admin)');

  // 5. Catálogo de Permisos Especiales Base
  const permFacturaAnular = await prisma.specialPermission.upsert({
    where: { code: 'FACTURA_ANULAR' },
    update: {},
    create: {
      code: 'FACTURA_ANULAR',
      name: 'Anular Factura',
      description: 'Habilita la capacidad de anular comprobantes emitidos en caja',
      module: 'FACTURACION',
      isSystem: true,
    },
  });

  await prisma.specialPermission.upsert({
    where: { code: 'HISTORIA_CLINICA_EXPORTAR' },
    update: {},
    create: {
      code: 'HISTORIA_CLINICA_EXPORTAR',
      name: 'Exportar Historia Clínica',
      description: 'Permite descargar en PDF registros clínicos confidenciales',
      module: 'HISTORIAS_CLINICAS',
      isSystem: true,
    },
  });

  await prisma.specialPermission.upsert({
    where: { code: 'PACIENTE_ELIMINAR' },
    update: {},
    create: {
      code: 'PACIENTE_ELIMINAR',
      name: 'Eliminar Registro de Paciente',
      description: 'Permite dar de baja lógica expedientes de pacientes',
      module: 'PACIENTES',
      isSystem: true,
    },
  });
  console.log('Catálogo de Permisos Especiales cargado');

  // 6. Asignar permiso especial FACTURA_ANULAR a cajero_carlos
  await prisma.userSpecialPermission.upsert({
    where: {
      userId_permissionId: {
        userId: cajero.id,
        permissionId: permFacturaAnular.id,
      },
    },
    update: {},
    create: {
      userId: cajero.id,
      permissionId: permFacturaAnular.id,
      grantedBy: superadmin.id,
    },
  });
  console.log(`Permiso especial ${permFacturaAnular.code} asignado a ${cajero.username}`);

  // 7. Pacientes y Citas de prueba vinculadas al tenant
  const patient = await prisma.patient.upsert({
    where: { dni: '12345678A' },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      dni: '12345678A',
      firstName: 'Carlos',
      lastName: 'Gómez Sánchez',
      birthDate: new Date('1988-04-15'),
      gender: Gender.MALE,
      phone: '+34 600 123 456',
      email: 'carlos.gomez@example.com',
      bloodType: 'O+',
      allergies: ['Penicilina'],
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const existingAppt = await prisma.appointment.findFirst({
    where: { patientId: patient.id, doctorId: doctor.id },
  });

  if (!existingAppt) {
    await prisma.appointment.create({
      data: {
        tenantId: defaultTenant.id,
        dateTime: tomorrow,
        status: AppointmentStatus.CONFIRMED,
        reason: 'Consulta médica general y control preventivo',
        patientId: patient.id,
        doctorId: doctor.id,
      },
    });
  }

  console.log('Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
