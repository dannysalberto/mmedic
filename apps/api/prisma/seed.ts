import { PrismaClient, Role, AppointmentStatus, Gender } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MMedic PostgreSQL Database...');

  // 1. Create a default Doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@mmedic.com' },
    update: {},
    create: {
      email: 'doctor@mmedic.com',
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyvr8e7J2.Z3z7i7B3B5f1R0gX5Y6rfe', // hashed default password
      name: 'Dr. Alejandro Morales',
      role: Role.DOCTOR,
    },
  });

  // 2. Create sample Patients
  const patient1 = await prisma.patient.upsert({
    where: { dni: '12345678A' },
    update: {},
    create: {
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

  const patient2 = await prisma.patient.upsert({
    where: { dni: '87654321B' },
    update: {},
    create: {
      dni: '87654321B',
      firstName: 'María',
      lastName: 'Fernández Ruiz',
      birthDate: new Date('1995-11-22'),
      gender: Gender.FEMALE,
      phone: '+34 611 987 654',
      email: 'maria.fernandez@example.com',
      bloodType: 'A+',
      allergies: [],
    },
  });

  // 3. Create sample Appointments
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      dateTime: tomorrow,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Consulta de rutina y revisión de análisis de sangre',
      notes: 'Paciente refiere leve molestia en el hombro derecho.',
      patientId: patient1.id,
      doctorId: doctor.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
