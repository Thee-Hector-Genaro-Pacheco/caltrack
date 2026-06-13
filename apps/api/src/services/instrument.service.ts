import prisma from '../db/prisma';
import { CreateInstrumentDto, UpdateInstrumentDto, CreateCalibrationRecordDto } from '@caltrack/types';
import { getObjectDiff } from '@caltrack/utils';
import { createAuditEvent } from './audit.service';

export async function getAllInstruments() {
  return await prisma.instrument.findMany({
    orderBy: { tagNumber: 'asc' },
    include: {
      processArea: true,
      controlLoop: true,
    },
  });
}

export async function getInstrumentById(id: string) {
  return await prisma.instrument.findUnique({
    where: { id },
    include: {
      processArea: true,
      controlLoop: true,
      calibrations: {
        orderBy: { calibrationDate: 'desc' },
        include: { testPoints: true }
      },
      workOrders: {
        orderBy: { createdAt: 'desc' }
      }
    },
  });
}

export async function createInstrument(dto: CreateInstrumentDto, changedBy: string) {
  let nextCalibrationDueDate = dto.nextCalibrationDueDate ? new Date(dto.nextCalibrationDueDate) : null;
  const lastCalibrationDate = dto.lastCalibrationDate ? new Date(dto.lastCalibrationDate) : null;
  const interval = dto.calibrationIntervalMonths ?? 12;

  if (!nextCalibrationDueDate && lastCalibrationDate) {
    nextCalibrationDueDate = new Date(lastCalibrationDate);
    nextCalibrationDueDate.setMonth(nextCalibrationDueDate.getMonth() + interval);
  }

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
      maxPermissibleError: dto.maxPermissibleError ?? 0.5,
      processAreaId: dto.processAreaId || null,
      controlLoopId: dto.controlLoopId || null,
      calibrationIntervalMonths: interval,
      lastCalibrationDate,
      nextCalibrationDueDate,
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

  const interval = updateData.calibrationIntervalMonths !== undefined 
    ? updateData.calibrationIntervalMonths 
    : oldInstrument.calibrationIntervalMonths;
  const lastCal = updateData.lastCalibrationDate !== undefined 
    ? updateData.lastCalibrationDate 
    : oldInstrument.lastCalibrationDate;

  let nextCal: Date | null = null;
  if (updateData.nextCalibrationDueDate !== undefined) {
    nextCal = updateData.nextCalibrationDueDate ? new Date(updateData.nextCalibrationDueDate) : null;
  } else if (updateData.calibrationIntervalMonths !== undefined || updateData.lastCalibrationDate !== undefined) {
    if (lastCal) {
      const d = new Date(lastCal);
      d.setMonth(d.getMonth() + interval!);
      nextCal = d;
    }
  }

  const dataToUpdate: any = {
    ...updateData,
  };
  if (updateData.lastCalibrationDate !== undefined) {
    dataToUpdate.lastCalibrationDate = updateData.lastCalibrationDate ? new Date(updateData.lastCalibrationDate) : null;
  }
  if (nextCal !== null || updateData.nextCalibrationDueDate === null) {
    dataToUpdate.nextCalibrationDueDate = nextCal;
  }

  const updatedInstrument = await prisma.instrument.update({
    where: { id },
    data: dataToUpdate,
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

import { getOutputSpan, calculateExpectedOutput, calculateErrorPercent } from '@caltrack/utils';

export async function addCalibrationRecord(dto: CreateCalibrationRecordDto, changedBy: string) {
  const instrument = await prisma.instrument.findUnique({
    where: { id: dto.instrumentId }
  });

  if (!instrument) {
    throw new Error('Instrument not found');
  }

  const outputSpan = getOutputSpan(instrument.rangeMin, instrument.rangeMax, instrument.signalType);
  const maxError = instrument.maxPermissibleError;

  let overallPass = true;

  const pointsData = dto.testPoints.map((pt) => {
    const span = instrument.rangeMax - instrument.rangeMin;
    const percentDecimal = span === 0 ? 0 : (pt.targetInput - instrument.rangeMin) / span;

    const expectedOutput = calculateExpectedOutput(
      instrument.rangeMin,
      instrument.rangeMax,
      instrument.signalType,
      percentDecimal
    );

    const asFoundError = calculateErrorPercent(pt.asFoundOutput, expectedOutput, outputSpan);
    const asLeftError = calculateErrorPercent(pt.asLeftOutput, expectedOutput, outputSpan);

    const pointPass = Math.abs(asLeftError) <= maxError;

    if (!pointPass) {
      overallPass = false;
    }

    return {
      targetInput: pt.targetInput,
      expectedOutput,
      asFoundOutput: pt.asFoundOutput,
      asLeftOutput: pt.asLeftOutput,
      asFoundError,
      asLeftError,
      passFail: pointPass,
    };
  });

  const record = await prisma.calibrationRecord.create({
    data: {
      instrumentId: dto.instrumentId,
      calibrationDate: new Date(dto.calibrationDate),
      technicianName: dto.technicianName,
      passFail: overallPass,
      notes: dto.notes,
      testPoints: {
        create: pointsData,
      },
    },
    include: {
      testPoints: true,
    },
  });

  const nextStatus = overallPass ? 'ACTIVE' : 'CALIBRATION_DUE';
  const calibrationDate = new Date(dto.calibrationDate);
  const nextCalibrationDueDate = new Date(calibrationDate);
  nextCalibrationDueDate.setMonth(nextCalibrationDueDate.getMonth() + (instrument.calibrationIntervalMonths || 12));

  await prisma.instrument.update({
    where: { id: dto.instrumentId },
    data: { 
      status: nextStatus,
      lastCalibrationDate: calibrationDate,
      nextCalibrationDueDate,
    },
  });

  // Auto-complete open or in-progress work orders for this instrument
  const activeWorkOrders = await prisma.workOrder.findMany({
    where: {
      instrumentId: dto.instrumentId,
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
  });

  for (const wo of activeWorkOrders) {
    const updatedWo = await prisma.workOrder.update({
      where: { id: wo.id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
    });

    await createAuditEvent({
      entityType: 'WorkOrder',
      entityId: wo.id,
      action: 'UPDATE',
      oldValue: { status: wo.status, completedDate: wo.completedDate },
      newValue: { status: 'COMPLETED', completedDate: updatedWo.completedDate },
      changedBy,
      reason: 'Automatically completed upon calibration completion',
    });
  }

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
