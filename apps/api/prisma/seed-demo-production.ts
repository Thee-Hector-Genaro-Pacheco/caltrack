import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('DEMO_USER_PASSWORD environment variable must be set and at least 12 characters long.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: 'demo@caltrack.com' },
    update: {
      firstName: 'Demo',
      lastName: 'Viewer',
      role: 'DEMO_VIEWER' as any,
      isActive: true,
      passwordHash,
    },
    create: {
      email: 'demo@caltrack.com',
      firstName: 'Demo',
      lastName: 'Viewer',
      role: 'DEMO_VIEWER' as any,
      isActive: true,
      passwordHash,
    },
  });

  console.log('Production demo account ready.');
}

main()
  .catch((err) => {
    console.error('Failed to seed production demo account:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
