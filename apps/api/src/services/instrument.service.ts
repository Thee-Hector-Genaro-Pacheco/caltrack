import prisma from '../db/prisma';
import { CreateInstrumentDto, UpdateInstrumentDto, CreateCalibrationRecordDto } from '@caltrack/types';
import { getObjectDiff } from '@caltrack/utils';
import { createAuditEvent } from './audit.service';

export async function getAllInstruments() {
  return await prisma.instrument.findMany({
    orderBy: { tagNumber: 'asc' },
  });
}

export async function getInstrumentById(id: string) {
  return await prisma.instrument.findUnique({
    where: { id },
    include: { calibrations: { orderBy: { calibrationDate: 'desc' } } },
  });
}

export async function createInstrument(dto: CreateInstrumentDto, changedBy: string) {
  const instrument = await prisma.instrument.create({
    data: {
      tagNumber: dto.tagNumber,
      instrumentType: dto.instrumentType,
      manufacturer: dto.manufacturer,
      model: dto.model,
      rangeMin: dto.rangeMin,
      rangeMax: dto.rangeMax,
      engineeringUnits: dto.engineeringUnits,
      signalType: dto.signalType,
      location: dto.location,
      status: dto.status || 'ACTIVE',
    },
  });

  await createAuditEvent({
    entityType: 'Instrument',
    entityId: instrument.id,
    action: 'CREATE',
    oldValue: null,
    newValue: instrument,
    changedBy,
    reason: 'Initial Instrument Registration',
  });

  return instrument;
}

export async function updateInstrument(id: string, dto: UpdateInstrumentDto, changedBy: string) {
  const oldInstrument = await prisma.instrument.findUnique({
    where: { id },
  });

  if (!oldInstrument) {
    throw new Error('Instrument not found');
  }

  const { reason, ...updateData } = dto;

  const updatedInstrument = await prisma.instrument.update({
    where: { id },
    data: updateData,
  });

  const { oldValue, newValue } = getObjectDiff(oldInstrument, updatedInstrument);

  if (oldValue || newValue) {
    await createAuditEvent({
      entityType: 'Instrument',
      entityId: id,
      action: 'UPDATE',
      oldValue,
      newValue,
      changedBy,
      reason: reason || 'Instrument details modified',
    });
  }

  return updatedInstrument;
}

export async function deleteInstrument(id: string, changedBy: string, reason: string) {
  const instrument = await prisma.instrument.findUnique({
    where: { id },
  });

  if (!instrument) {
    throw new Error('Instrument not found');
  }

  await prisma.instrument.delete({
    where: { id },
  });

  await createAuditEvent({
    entityType: 'Instrument',
    entityId: id,
    action: 'DELETE',
    oldValue: instrument,
    newValue: null,
    changedBy,
    reason: reason || 'Instrument decommissioned',
  });

  return instrument;
}

export async function addCalibrationRecord(dto: CreateCalibrationRecordDto, changedBy: string) {
  const record = await prisma.calibrationRecord.create({
    data: {
      instrumentId: dto.instrumentId,
      calibrationDate: new Date(dto.calibrationDate),
      technicianName: dto.technicianName,
      asFound: dto.asFound,
      asLeft: dto.asLeft,
      passFail: dto.passFail,
      notes: dto.notes,
    },
  });

  const nextStatus = dto.passFail ? 'ACTIVE' : 'CALIBRATION_DUE';
  await prisma.instrument.update({
    where: { id: dto.instrumentId },
    data: { status: nextStatus },
  });

  await createAuditEvent({
    entityType: 'CalibrationRecord',
    entityId: record.id,
    action: 'CREATE',
    oldValue: null,
    newValue: record,
    changedBy,
    reason: 'Calibration Record Created',
  });

  return record;
}
