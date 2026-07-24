import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.CONFIRM_REMOVE_DEMO_DATA !== 'true') {
    throw new Error('Refusing to remove demo data. Environment variable CONFIRM_REMOVE_DEMO_DATA=true must be explicitly set.');
  }

  console.log('Removing production demo records (safe targeted removal)...');

  // Delete in correct foreign-key order
  await prisma.calibrationTestPoint.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { calibrationRecordId: { startsWith: 'demo-' } },
      ],
    },
  });

  await prisma.calibrationReferenceStandard.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { calibrationRecordId: { startsWith: 'demo-' } },
        { referenceStandardId: { startsWith: 'demo-' } },
      ],
    },
  });

  await prisma.signature.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { calibrationRecordId: { startsWith: 'demo-' } },
      ],
    },
  });

  await prisma.calibrationRecord.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { technicianName: { contains: 'demo@caltrack.com' } },
      ],
    },
  });

  await prisma.workOrder.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { workOrderNumber: { startsWith: 'DEMO-' } },
      ],
    },
  });

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { changedBy: { contains: 'demo@caltrack.com' } },
      ],
    },
  });

  await prisma.instrument.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { tagNumber: { startsWith: 'DEMO-' } },
      ],
    },
  });

  await prisma.referenceStandard.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { assetTag: { startsWith: 'DEMO-' } },
      ],
    },
  });

  await prisma.controlLoop.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { loopTag: { startsWith: 'DEMO-' } },
      ],
    },
  });

  await prisma.processArea.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo-' } },
        { areaCode: { startsWith: 'DEMO-' } },
      ],
    },
  });

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'demo@caltrack.com' },
        { email: { endsWith: '.demo@caltrack.com' } },
      ],
    },
  });

  console.log('Production demo dataset safely removed.');
}

main()
  .catch((err) => {
    console.error('Failed to remove demo data:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
