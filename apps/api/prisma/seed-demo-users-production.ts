import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const accountsConfig = [
  {
    email: 'admin.demo@caltrack.com',
    firstName: 'Demo',
    lastName: 'Administrator',
    role: 'ADMINISTRATOR' as const,
    envVar: 'DEMO_ADMIN_PASSWORD',
  },
  {
    email: 'supervisor.demo@caltrack.com',
    firstName: 'Demo',
    lastName: 'Supervisor',
    role: 'SUPERVISOR' as const,
    envVar: 'DEMO_SUPERVISOR_PASSWORD',
  },
  {
    email: 'qa.demo@caltrack.com',
    firstName: 'Demo',
    lastName: 'QA Reviewer',
    role: 'QA_REVIEWER' as const,
    envVar: 'DEMO_QA_PASSWORD',
  },
  {
    email: 'technician.demo@caltrack.com',
    firstName: 'Demo',
    lastName: 'Technician',
    role: 'TECHNICIAN' as const,
    envVar: 'DEMO_TECHNICIAN_PASSWORD',
  },
  {
    email: 'manager.demo@caltrack.com',
    firstName: 'Demo',
    lastName: 'Metrology Manager',
    role: 'METROLOGY_MANAGER' as const,
    envVar: 'DEMO_MANAGER_PASSWORD',
  },
];

async function main() {
  console.log('Seeding production demo role accounts...');

  for (const config of accountsConfig) {
    const password = process.env[config.envVar];
    if (!password || password.length < 12) {
      throw new Error(`Environment variable ${config.envVar} must be set and at least 12 characters long.`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email: config.email },
      update: {
        firstName: config.firstName,
        lastName: config.lastName,
        role: config.role as any,
        isActive: true,
        passwordHash,
      },
      create: {
        email: config.email,
        firstName: config.firstName,
        lastName: config.lastName,
        role: config.role as any,
        isActive: true,
        passwordHash,
      },
    });

    console.log(`Demo user account configured: ${config.email} (${config.role})`);
  }

  console.log('Production demo role accounts successfully configured.');
}

main()
  .catch((err) => {
    console.error('Failed to seed production demo role accounts:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
