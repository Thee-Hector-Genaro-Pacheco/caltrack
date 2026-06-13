import prisma from '../db/prisma';
import { CreateProcessAreaDto, CreateControlLoopDto } from '@caltrack/types';
import { createAuditEvent } from './audit.service';

export async function getAllProcessAreas() {
  return await prisma.processArea.findMany({
    orderBy: { areaCode: 'asc' },
    include: {
      controlLoops: true,
    },
  });
}

export async function createProcessArea(dto: CreateProcessAreaDto, changedBy: string) {
  const area = await prisma.processArea.create({
    data: {
      areaCode: dto.areaCode,
      name: dto.name,
      description: dto.description || null,
    },
  });

  await createAuditEvent({
    entityType: 'ProcessArea',
    entityId: area.id,
    action: 'CREATE',
    oldValue: null,
    newValue: area,
    changedBy,
    reason: 'Process Area Created',
  });

  return area;
}

export async function getAllControlLoops() {
  return await prisma.controlLoop.findMany({
    orderBy: { loopTag: 'asc' },
    include: {
      processArea: true,
      instruments: true,
    },
  });
}

export async function getControlLoopById(id: string) {
  return await prisma.controlLoop.findUnique({
    where: { id },
    include: {
      processArea: true,
      instruments: true,
    },
  });
}

export async function createControlLoop(dto: CreateControlLoopDto, changedBy: string) {
  const loop = await prisma.controlLoop.create({
    data: {
      loopNumber: dto.loopNumber,
      loopTag: dto.loopTag,
      description: dto.description || null,
      pidReference: dto.pidReference || null,
      processAreaId: dto.processAreaId,
    },
    include: {
      processArea: true,
    },
  });

  await createAuditEvent({
    entityType: 'ControlLoop',
    entityId: loop.id,
    action: 'CREATE',
    oldValue: null,
    newValue: loop,
    changedBy,
    reason: 'Control Loop Created',
  });

  return loop;
}

export async function getInstrumentsByLoopId(loopId: string) {
  return await prisma.instrument.findMany({
    where: { controlLoopId: loopId },
    include: {
      processArea: true,
      controlLoop: true,
      calibrations: {
        orderBy: { calibrationDate: 'desc' },
        include: { testPoints: true },
      },
    },
  });
}
