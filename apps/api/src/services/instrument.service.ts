import prisma from '../db/prisma';
import { CreateInstrumentDto, UpdateInstrumentDto, CreateCalibrationRecordDto } from '@caltrack/types';
import { getObjectDiff } from '@caltrack/utils';
import { createAuditEvent } from './audit.service';
import { checkReferenceStandardsValidity } from './referenceStandard.service';

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
      status: 'DRAFT',
      testPoints: {
        create: pointsData,
      },
      referenceStandards: dto.referenceStandards ? {
        create: dto.referenceStandards.map(rs => ({
          referenceStandardId: rs.referenceStandardId,
          usageNotes: rs.usageNotes || null,
        }))
      } : undefined,
    },
    include: {
      testPoints: true,
      referenceStandards: {
        include: {
          referenceStandard: true
        }
      }
    },
  });

  await createAuditEvent({
    entityType: 'CalibrationRecord',
    entityId: record.id,
    action: 'CREATE',
    oldValue: null,
    newValue: record as any,
    changedBy,
    reason: 'Calibration Record Created (DRAFT)',
  });

  if (dto.referenceStandards && dto.referenceStandards.length > 0) {
    const standards = await prisma.referenceStandard.findMany({
      where: { id: { in: dto.referenceStandards.map(r => r.referenceStandardId) } }
    });
    for (const rs of dto.referenceStandards) {
      const stdObj = standards.find(s => s.id === rs.referenceStandardId);
      await createAuditEvent({
        entityType: 'CalibrationRecord',
        entityId: record.id,
        action: 'LINK_REFERENCE_STANDARD' as any,
        oldValue: null,
        newValue: { referenceStandardId: rs.referenceStandardId, usageNotes: rs.usageNotes, assetTag: stdObj?.assetTag, manufacturer: stdObj?.manufacturer, model: stdObj?.model },
        changedBy,
        reason: `Linked reference standard ${stdObj?.assetTag} to calibration record`,
      });
    }
  }

  return record;
}

import { generateSignatureHash } from '../utils/hash';

export async function submitCalibrationForReview(id: string, signerName: string, signerRole: string, changedBy: string) {
  const record = await prisma.calibrationRecord.findUnique({
    where: { id },
    include: { 
      testPoints: true,
      referenceStandards: {
        include: {
          referenceStandard: true
        }
      }
    }
  });

  if (!record) {
    throw new Error('Calibration record not found');
  }

  if (record.referenceStandards && record.referenceStandards.length > 0) {
    const stdIds = record.referenceStandards.map(rs => rs.referenceStandardId);
    await checkReferenceStandardsValidity(stdIds);
  }

  const signedAt = new Date();
  const signatureHash = generateSignatureHash(id, signerName, signerRole, signedAt, 'PENDING_REVIEW');

  const updatedRecord = await prisma.calibrationRecord.update({
    where: { id },
    data: {
      status: 'PENDING_REVIEW',
      submittedAt: signedAt,
      signatures: {
        create: {
          signerName,
          signerRole: signerRole as any,
          meaning: 'SUBMITTED',
          signatureHash,
          signedAt,
        }
      }
    },
    include: {
      testPoints: true,
      signatures: true,
    }
  });

  await createAuditEvent({
    entityType: 'CalibrationRecord',
    entityId: id,
    action: 'SUBMIT_CALIBRATION',
    oldValue: { status: record.status },
    newValue: { status: 'PENDING_REVIEW', submittedAt: signedAt },
    changedBy,
    reason: `Calibration record submitted for compliance review by ${signerName} (${signerRole})`,
  });

  return updatedRecord;
}

export async function approveCalibration(id: string, signerName: string, signerRole: string, changedBy: string) {
  const record = await prisma.calibrationRecord.findUnique({
    where: { id },
    include: { testPoints: true }
  });

  if (!record) {
    throw new Error('Calibration record not found');
  }

  if (record.status === 'APPROVED') {
    throw new Error('Calibration record is already approved');
  }

  const signedAt = new Date();
  const signatureHash = generateSignatureHash(id, signerName, signerRole, signedAt, 'APPROVED');

  const updatedRecord = await prisma.calibrationRecord.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: signedAt,
      signatures: {
        create: {
          signerName,
          signerRole: signerRole as any,
          meaning: 'APPROVED',
          signatureHash,
          signedAt,
        }
      }
    },
    include: {
      testPoints: true,
      signatures: true,
    }
  });

  // Compliance Action: Update the instrument parameters only when officially APPROVED
  const instrument = await prisma.instrument.findUnique({
    where: { id: record.instrumentId }
  });

  if (instrument) {
    const nextStatus = record.passFail ? 'ACTIVE' : 'CALIBRATION_DUE';
    const calibrationDate = new Date(record.calibrationDate);
    const nextCalibrationDueDate = new Date(calibrationDate);
    nextCalibrationDueDate.setMonth(nextCalibrationDueDate.getMonth() + (instrument.calibrationIntervalMonths || 12));

    await prisma.instrument.update({
      where: { id: record.instrumentId },
      data: {
        status: nextStatus,
        lastCalibrationDate: calibrationDate,
        nextCalibrationDueDate,
      },
    });

    // Auto-complete open or in-progress work orders for this instrument
    const activeWorkOrders = await prisma.workOrder.findMany({
      where: {
        instrumentId: record.instrumentId,
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
        reason: 'Automatically completed upon calibration compliance approval',
      });
    }
  }

  await createAuditEvent({
    entityType: 'CalibrationRecord',
    entityId: id,
    action: 'APPROVE_CALIBRATION',
    oldValue: { status: record.status },
    newValue: { status: 'APPROVED', approvedAt: signedAt },
    changedBy,
    reason: `Calibration record approved by ${signerName} (${signerRole})`,
  });

  return updatedRecord;
}

export async function rejectCalibration(id: string, signerName: string, signerRole: string, reason: string, changedBy: string) {
  const record = await prisma.calibrationRecord.findUnique({
    where: { id },
    include: { testPoints: true }
  });

  if (!record) {
    throw new Error('Calibration record not found');
  }

  if (record.status === 'APPROVED') {
    throw new Error('Approved compliance records cannot be rejected');
  }

  const signedAt = new Date();
  const signatureHash = generateSignatureHash(id, signerName, signerRole, signedAt, 'REJECTED');

  const updatedRecord = await prisma.calibrationRecord.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: signedAt,
      signatures: {
        create: {
          signerName,
          signerRole: signerRole as any,
          meaning: 'REJECTED',
          signatureHash,
          signedAt,
        }
      }
    },
    include: {
      testPoints: true,
      signatures: true,
    }
  });

  await createAuditEvent({
    entityType: 'CalibrationRecord',
    entityId: id,
    action: 'REJECT_CALIBRATION',
    oldValue: { status: record.status },
    newValue: { status: 'REJECTED', rejectedAt: signedAt },
    changedBy,
    reason: `Calibration record rejected by ${signerName} (${signerRole}). Reason: ${reason}`,
  });

  return updatedRecord;
}
