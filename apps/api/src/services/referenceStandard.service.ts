import prisma from '../db/prisma';
import { CreateReferenceStandardDto, UpdateReferenceStandardDto } from '@caltrack/types';
import { getObjectDiff } from '@caltrack/utils';
import { createAuditEvent } from './audit.service';

export async function getAllReferenceStandards() {
  return await prisma.referenceStandard.findMany({
    orderBy: { assetTag: 'asc' },
  });
}

export async function getReferenceStandardById(id: string) {
  return await prisma.referenceStandard.findUnique({
    where: { id },
    include: {
      calibrations: {
        include: {
          calibrationRecord: true,
        },
      },
    },
  });
}

export async function createReferenceStandard(dto: CreateReferenceStandardDto, changedBy: string) {
  const standard = await prisma.referenceStandard.create({
    data: {
      assetTag: dto.assetTag,
      equipmentType: dto.equipmentType,
      manufacturer: dto.manufacturer,
      model: dto.model,
      serialNumber: dto.serialNumber,
      accuracyClass: dto.accuracyClass,
      certificateNumber: dto.certificateNumber,
      lastCalibratedDate: new Date(dto.lastCalibratedDate),
      calibrationDueDate: new Date(dto.calibrationDueDate),
      status: dto.status || 'ACTIVE',
    },
  });

  await createAuditEvent({
    entityType: 'ReferenceStandard',
    entityId: standard.id,
    action: 'CREATE',
    oldValue: null,
    newValue: standard as any,
    changedBy,
    reason: 'Initial Reference Standard Registration',
  });

  return standard;
}

export async function updateReferenceStandard(id: string, dto: UpdateReferenceStandardDto, changedBy: string) {
  const oldStandard = await prisma.referenceStandard.findUnique({
    where: { id },
  });

  if (!oldStandard) {
    throw new Error('Reference standard not found');
  }

  const { reason, ...updateData } = dto;

  const dataToUpdate: any = {
    ...updateData,
  };
  if (updateData.lastCalibratedDate) {
    dataToUpdate.lastCalibratedDate = new Date(updateData.lastCalibratedDate);
  }
  if (updateData.calibrationDueDate) {
    dataToUpdate.calibrationDueDate = new Date(updateData.calibrationDueDate);
  }

  const updatedStandard = await prisma.referenceStandard.update({
    where: { id },
    data: dataToUpdate,
  });

  const { oldValue, newValue } = getObjectDiff(oldStandard, updatedStandard);

  if (oldValue || newValue) {
    await createAuditEvent({
      entityType: 'ReferenceStandard',
      entityId: id,
      action: 'UPDATE',
      oldValue,
      newValue,
      changedBy,
      reason: reason || 'Reference standard details modified',
    });
  }

  return updatedStandard;
}

export async function checkReferenceStandardsValidity(ids: string[]) {
  if (!ids || ids.length === 0) return;

  const standards = await prisma.referenceStandard.findMany({
    where: {
      id: { in: ids },
    },
  });

  const now = new Date();

  for (const std of standards) {
    const isPastDue = new Date(std.calibrationDueDate) < now;
    if (std.status === 'EXPIRED' || std.status === 'OUT_OF_SERVICE' || isPastDue) {
      const reason = std.status === 'OUT_OF_SERVICE' ? 'is out of service' : 'is expired';
      throw new Error(
        `Metrology Traceability Violation: Reference standard '${std.manufacturer} ${std.model}' (Tag: ${std.assetTag}) ${reason} and cannot be used for compliance calibrations.`
      );
    }
  }
}
