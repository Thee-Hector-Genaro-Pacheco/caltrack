import prisma from '../db/prisma';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from '@caltrack/types';
import { getObjectDiff } from '@caltrack/utils';
import { createAuditEvent } from './audit.service';

export async function getAllWorkOrders() {
  return await prisma.workOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      instrument: true,
    },
  });
}

export async function getWorkOrderById(id: string) {
  return await prisma.workOrder.findUnique({
    where: { id },
    include: {
      instrument: true,
    },
  });
}

export async function createWorkOrder(dto: CreateWorkOrderDto, changedBy: string) {
  // Determine next sequential work order number
  const lastWo = await prisma.workOrder.findFirst({
    orderBy: { workOrderNumber: 'desc' },
  });
  let nextNum = 1001;
  if (lastWo) {
    const match = lastWo.workOrderNumber.match(/WO-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1]) + 1;
    }
  }
  const workOrderNumber = `WO-${nextNum}`;

  const wo = await prisma.workOrder.create({
    data: {
      workOrderNumber,
      instrumentId: dto.instrumentId,
      status: dto.status || 'OPEN',
      priority: dto.priority || 'MEDIUM',
      assignedTechnician: dto.assignedTechnician || null,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
      description: dto.description || null,
    },
    include: {
      instrument: true,
    },
  });

  await createAuditEvent({
    entityType: 'WorkOrder',
    entityId: wo.id,
    action: 'CREATE',
    oldValue: null,
    newValue: wo,
    changedBy,
    reason: 'Work Order Created',
  });

  return wo;
}

export async function updateWorkOrder(id: string, dto: UpdateWorkOrderDto, changedBy: string) {
  const oldWo = await prisma.workOrder.findUnique({
    where: { id },
  });

  if (!oldWo) {
    throw new Error('Work Order not found');
  }

  const { reason, ...updateData } = dto;

  const dataToUpdate: any = {
    ...updateData,
  };

  if (updateData.scheduledDate !== undefined) {
    dataToUpdate.scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : null;
  }
  if (updateData.completedDate !== undefined) {
    dataToUpdate.completedDate = updateData.completedDate ? new Date(updateData.completedDate) : null;
  }

  const updatedWo = await prisma.workOrder.update({
    where: { id },
    data: dataToUpdate,
    include: {
      instrument: true,
    },
  });

  const { oldValue, newValue } = getObjectDiff(oldWo, updatedWo);

  if (oldValue || newValue) {
    await createAuditEvent({
      entityType: 'WorkOrder',
      entityId: id,
      action: 'UPDATE',
      oldValue,
      newValue,
      changedBy,
      reason: reason || 'Work order parameters modified',
    });
  }

  return updatedWo;
}

export async function generateWorkOrdersForDueInstruments(changedBy: string) {
  const instruments = await prisma.instrument.findMany({
    where: {
      status: { in: ['CALIBRATION_DUE', 'OVERDUE'] },
    },
    include: {
      workOrders: {
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      },
    },
  });

  let generatedCount = 0;

  for (const inst of instruments) {
    // Only generate if no active work orders exist for this instrument
    if (inst.workOrders.length === 0) {
      const lastWo = await prisma.workOrder.findFirst({
        orderBy: { workOrderNumber: 'desc' },
      });
      let nextNum = 1001;
      if (lastWo) {
        const match = lastWo.workOrderNumber.match(/WO-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      const workOrderNumber = `WO-${nextNum}`;
      const priority = inst.status === 'OVERDUE' ? 'HIGH' : 'MEDIUM';

      const wo = await prisma.workOrder.create({
        data: {
          workOrderNumber,
          instrumentId: inst.id,
          status: 'OPEN',
          priority,
          description: `Automated maintenance work order generated due to compliance status: ${inst.status.replace('_', ' ')}`,
        },
      });

      await createAuditEvent({
        entityType: 'WorkOrder',
        entityId: wo.id,
        action: 'CREATE',
        oldValue: null,
        newValue: wo,
        changedBy,
        reason: `System auto-generated for compliance matching`,
      });

      generatedCount++;
    }
  }

  return { generatedCount };
}
