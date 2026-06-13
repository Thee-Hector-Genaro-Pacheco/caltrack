import prisma from '../db/prisma';
import { CreateAuditEventDto } from '@caltrack/types';

export async function createAuditEvent(dto: CreateAuditEventDto) {
  return await prisma.auditEvent.create({
    data: {
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      oldValue: dto.oldValue || null,
      newValue: dto.newValue || null,
      changedBy: dto.changedBy,
      reason: dto.reason || null,
    },
  });
}
