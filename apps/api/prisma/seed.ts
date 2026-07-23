/// <reference path="../../../node_modules/.prisma/client/index.d.ts" />
import { PrismaClient, InstrumentStatus } from '@prisma/client';
import { getOutputSpan, calculateExpectedOutput, calculateErrorPercent, calculateTargetInput } from '@caltrack/utils';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  await prisma.user.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.calibrationReferenceStandard.deleteMany({});
  await prisma.calibrationTestPoint.deleteMany({});
  await prisma.calibrationRecord.deleteMany({});
  await prisma.referenceStandard.deleteMany({});
  await prisma.instrument.deleteMany({});
  await prisma.controlLoop.deleteMany({});
  await prisma.processArea.deleteMany({});

  console.log('Seeding enterprise users with idempotent upsert...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);
  const demoPasswordHash = await bcrypt.hash('DemoOnly123!', salt);

  const usersToSeed = [
    {
      email: 'demo@caltrack.com',
      firstName: 'Demo',
      lastName: 'Viewer',
      passwordHash: demoPasswordHash,
      role: 'DEMO_VIEWER' as const,
    },
    {
      email: 'admin@caltrack.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      role: 'ADMINISTRATOR' as const,
    },
    {
      email: 'supervisor@caltrack.com',
      firstName: 'Marcus',
      lastName: 'Supervisor',
      passwordHash,
      role: 'SUPERVISOR' as const,
    },
    {
      email: 'qa@caltrack.com',
      firstName: 'Elena',
      lastName: 'QA',
      passwordHash,
      role: 'QA_REVIEWER' as const,
    },
    {
      email: 'technician@caltrack.com',
      firstName: 'John',
      lastName: 'Technician',
      passwordHash,
      role: 'TECHNICIAN' as const,
    },
    {
      email: 'manager@caltrack.com',
      firstName: 'Sarah',
      lastName: 'Manager',
      passwordHash,
      role: 'METROLOGY_MANAGER' as const,
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as any,
        isActive: true,
      },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash: u.passwordHash,
        role: u.role as any,
        isActive: true,
      },
    });
  }

  console.log('Database cleared. Seeding plant hierarchy...');

  // 1. Create Process Areas
  const area10 = await prisma.processArea.create({
    data: {
      areaCode: '10',
      name: 'Feedwater System',
      description: 'Main boiler feedwater storage, treatment, and pumping facility.',
    },
  });
  const area12 = await prisma.processArea.create({
    data: {
      areaCode: '12',
      name: 'Cooling Water System',
      description: 'Closed-loop non-contact cooling water cooling towers and pumps.',
    },
  });
  
  const area15 = await prisma.processArea.create({
    data: {
      areaCode: '15',
      name: 'Process Water System',
      description: 'Demineralized water purification, storage, and utility loops.',
    },
  });

  // Create Audit Events for Process Areas
  for (const area of [area10, area12, area15]) {
    await prisma.auditEvent.create({
      data: {
        entityType: 'ProcessArea',
        entityId: area.id,
        action: 'CREATE',
        newValue: area as any,
        changedBy: 'system@caltrack.com',
        reason: 'Process Area Created',
      },
    });
  }

  // 2. Create Control Loops
  const loop101 = await prisma.controlLoop.create({
    data: {
      loopNumber: '101',
      loopTag: 'PT-101 Control Loop',
      description: 'Boiler 1 Header Pressure Master Control Loop',
      pidReference: 'PID-10-FW-101',
      processAreaId: area10.id,
    },
  });
  const loop215 = await prisma.controlLoop.create({
    data: {
      loopNumber: '215',
      loopTag: 'Flow Control Loop',
      description: 'Cooling Tower Recycle Return Flow Loop',
      pidReference: 'PID-12-CW-215',
      processAreaId: area12.id,
    },
  });
  const loop301 = await prisma.controlLoop.create({
    data: {
      loopNumber: '301',
      loopTag: 'Level Control Loop',
      description: 'Deaerator Storage Tank Level Control Loop',
      pidReference: 'PID-15-PW-301',
      processAreaId: area15.id,
    },
  });

  // Create Audit Events for Control Loops
  for (const loop of [loop101, loop215, loop301]) {
    await prisma.auditEvent.create({
      data: {
        entityType: 'ControlLoop',
        entityId: loop.id,
        action: 'CREATE',
        newValue: loop as any,
        changedBy: 'system@caltrack.com',
        reason: 'Control Loop Created',
      },
    });
  }

  console.log('Seeding Reference Standards...');
  const stdFl754 = await prisma.referenceStandard.create({
    data: {
      assetTag: 'REF-FL754',
      equipmentType: 'Documenting Process Calibrator',
      manufacturer: 'Fluke',
      model: '754 Documenting Process Calibrator',
      serialNumber: 'FL754-893012',
      accuracyClass: '±0.01% span',
      certificateNumber: 'CERT-2025-9988',
      lastCalibratedDate: new Date(Date.now() - 180 * 24 * 3600000), // 6 months ago
      calibrationDueDate: new Date(Date.now() + 180 * 24 * 3600000), // 6 months from now
      status: 'ACTIVE',
    }
  });

  const stdFl725 = await prisma.referenceStandard.create({
    data: {
      assetTag: 'REF-FL725',
      equipmentType: 'Multifunction Process Calibrator',
      manufacturer: 'Fluke',
      model: '725 Multifunction Process Calibrator',
      serialNumber: 'FL725-774431',
      accuracyClass: '±0.02% span',
      certificateNumber: 'CERT-2026-1024',
      lastCalibratedDate: new Date(Date.now() - 350 * 24 * 3600000), // 11 months ago
      calibrationDueDate: new Date(Date.now() + 15 * 24 * 3600000),  // 15 days from now
      status: 'DUE_SOON',
    }
  });

  const stdBxMc6 = await prisma.referenceStandard.create({
    data: {
      assetTag: 'REF-BXMC6',
      equipmentType: 'Advanced Field Calibrator',
      manufacturer: 'Beamex',
      model: 'MC6 Advanced Field Calibrator',
      serialNumber: 'BXMC6-554129',
      accuracyClass: '±0.005% RDG',
      certificateNumber: 'CERT-2026-4433',
      lastCalibratedDate: new Date(Date.now() - 90 * 24 * 3600000), // 3 months ago
      calibrationDueDate: new Date(Date.now() + 270 * 24 * 3600000), // 9 months from now
      status: 'ACTIVE',
    }
  });

  const stdDr620 = await prisma.referenceStandard.create({
    data: {
      assetTag: 'REF-DR620',
      equipmentType: 'Pressure Calibrator',
      manufacturer: 'Druck',
      model: 'DPI620 Pressure Calibrator',
      serialNumber: 'DR620-112233',
      accuracyClass: '±0.025% FS',
      certificateNumber: 'CERT-2025-4859',
      lastCalibratedDate: new Date(Date.now() - 395 * 24 * 3600000), // 13 months ago
      calibrationDueDate: new Date(Date.now() - 30 * 24 * 3600000),  // 1 month ago
      status: 'EXPIRED',
    }
  });

  const stdWk7000 = await prisma.referenceStandard.create({
    data: {
      assetTag: 'REF-WK7000',
      equipmentType: 'Pressure Indicator',
      manufacturer: 'WIKA',
      model: 'CPH7000 Pressure Indicator',
      serialNumber: 'WK7000-482910',
      accuracyClass: '±0.05% FS',
      certificateNumber: 'CERT-2026-7788',
      lastCalibratedDate: new Date(Date.now() - 240 * 24 * 3600000), // 8 months ago
      calibrationDueDate: new Date(Date.now() + 120 * 24 * 3600000), // 4 months from now
      status: 'OUT_OF_SERVICE',
    }
  });

  const stdKs344 = await prisma.referenceStandard.create({
    data: {
      assetTag: 'REF-KS344',
      equipmentType: 'Digital Multimeter',
      manufacturer: 'Keysight',
      model: '34465A Digital Multimeter',
      serialNumber: 'KS344-992200',
      accuracyClass: '±0.0035% span',
      certificateNumber: 'CERT-2026-5511',
      lastCalibratedDate: new Date(Date.now() - 150 * 24 * 3600000), // 5 months ago
      calibrationDueDate: new Date(Date.now() + 210 * 24 * 3600000), // 7 months from now
      status: 'ACTIVE',
    }
  });

  // Create Audit Events for Reference Standards
  for (const std of [stdFl754, stdFl725, stdBxMc6, stdDr620, stdWk7000, stdKs344]) {
    await prisma.auditEvent.create({
      data: {
        entityType: 'ReferenceStandard',
        entityId: std.id,
        action: 'CREATE',
        newValue: std as any,
        changedBy: 'system@caltrack.com',
        reason: 'Reference Standard Seeded',
      },
    });
  }

  function generateSignatureHash(
    calibrationRecordId: string,
    signerName: string,
    signerRole: string,
    timestamp: string,
    status: string
  ): string {
    const input = `${calibrationRecordId}:${signerName}:${signerRole}:${timestamp}:${status}`;
    return createHash('sha256').update(input).digest('hex');
  }

  // Seeding logic for instruments
  async function seedInstrument(data: {
    tagNumber: string;
    instrumentType: string;
    manufacturer: string;
    model: string;
    rangeMin: number;
    rangeMax: number;
    engineeringUnits: string;
    signalType: string;
    location: string;
    maxPermissibleError: number;
    status: InstrumentStatus;
    calibrationIntervalMonths?: number;
    calibrations: any[];
  }) {
    console.log(`Seeding instrument: ${data.tagNumber}`);

    // Assign area and loop IDs based on area codes
    let processAreaId = area15.id;
    let controlLoopId = loop301.id;

    if (data.tagNumber.startsWith('10-')) {
      processAreaId = area10.id;
      controlLoopId = loop101.id;
    } else if (data.tagNumber.startsWith('12-')) {
      processAreaId = area12.id;
      controlLoopId = loop215.id;
    }

    // Auto-calculate calibration scheduling dates
    const sortedCals = [...data.calibrations].sort((a, b) => b.calibrationDate.getTime() - a.calibrationDate.getTime());
    const lastCalibrationDate = sortedCals.length > 0 ? sortedCals[0].calibrationDate : null;
    const interval = data.calibrationIntervalMonths ?? 12;
    let nextCalibrationDueDate = null;
    if (lastCalibrationDate) {
      nextCalibrationDueDate = new Date(lastCalibrationDate);
      nextCalibrationDueDate.setMonth(nextCalibrationDueDate.getMonth() + interval);
    }
    
    // 1. Create Instrument
    const instrument = await prisma.instrument.create({
      data: {
        tagNumber: data.tagNumber,
        instrumentType: data.instrumentType,
        manufacturer: data.manufacturer,
        model: data.model,
        rangeMin: data.rangeMin,
        rangeMax: data.rangeMax,
        engineeringUnits: data.engineeringUnits,
        signalType: data.signalType,
        location: data.location,
        maxPermissibleError: data.maxPermissibleError,
        status: data.status,
        processAreaId,
        controlLoopId,
        calibrationIntervalMonths: interval,
        lastCalibrationDate,
        nextCalibrationDueDate,
      }
    });

    // Create Audit Event for Instrument Creation
    await prisma.auditEvent.create({
      data: {
        entityType: 'Instrument',
        entityId: instrument.id,
        action: 'CREATE',
        newValue: instrument as any,
        changedBy: 'system@caltrack.com',
        reason: 'Initial Instrument Registration',
      }
    });

    const outputSpan = getOutputSpan(instrument.rangeMin, instrument.rangeMax, instrument.signalType);
    const mpe = instrument.maxPermissibleError;

    // 2. Create Calibrations
    for (const cal of data.calibrations) {
      const status = cal.status || 'APPROVED';
      const submittedAt = cal.submittedAt || (status !== 'DRAFT' ? cal.calibrationDate : null);
      const approvedAt = cal.approvedAt || (status === 'APPROVED' ? cal.calibrationDate : null);
      const rejectedAt = cal.rejectedAt || (status === 'REJECTED' ? cal.calibrationDate : null);

      if (cal.isLegacy) {
        // Legacy calibration (single-point, no testPoints)
        const record = await prisma.calibrationRecord.create({
          data: {
            instrumentId: instrument.id,
            calibrationDate: cal.calibrationDate,
            technicianName: cal.technicianName,
            asFound: instrument.rangeMin + (instrument.rangeMax - instrument.rangeMin) * 0.52, // slight offset
            asLeft: instrument.rangeMin + (instrument.rangeMax - instrument.rangeMin) * 0.50,  // calibrated exactly
            passFail: cal.pass,
            notes: cal.notes,
            status: status as any,
            submittedAt,
            approvedAt,
            rejectedAt,
          }
        });

        // Link reference standard
        let legacyStdId = stdBxMc6.id;
        if (instrument.instrumentType.toLowerCase().includes('pressure') || instrument.instrumentType.toLowerCase().includes('valve') || instrument.instrumentType.toLowerCase().includes('switch')) {
          legacyStdId = stdFl754.id;
        } else if (instrument.instrumentType.toLowerCase().includes('temperature')) {
          legacyStdId = stdKs344.id;
        }
        await prisma.calibrationReferenceStandard.create({
          data: {
            calibrationRecordId: record.id,
            referenceStandardId: legacyStdId,
            usageNotes: 'Legacy trace reference standard check.',
          }
        });

        // Audit Event
        await prisma.auditEvent.create({
          data: {
            entityType: 'CalibrationRecord',
            entityId: record.id,
            action: 'CREATE',
            newValue: record as any,
            changedBy: 'system@caltrack.com',
            reason: 'Legacy Calibration Record Seeding',
          }
        });

        // Seed Signatures
        const signaturesData = [];
        if (status === 'PENDING_REVIEW' || status === 'APPROVED' || status === 'REJECTED') {
          const submittedAtStr = submittedAt.toISOString();
          const submittedHash = generateSignatureHash(record.id, cal.technicianName, 'TECHNICIAN', submittedAtStr, 'PENDING_REVIEW');
          signaturesData.push({
            signerName: cal.technicianName,
            signerRole: 'TECHNICIAN',
            meaning: 'SUBMITTED',
            signatureHash: submittedHash,
            signedAt: submittedAt,
          });
        }
        if (status === 'APPROVED') {
          const approvedAtStr = approvedAt.toISOString();
          const approverRole = cal.approverRole || 'SUPERVISOR';
          const approverName = cal.approverName || 'Marcus Supervisor';
          const approvedHash = generateSignatureHash(record.id, approverName, approverRole, approvedAtStr, 'APPROVED');
          signaturesData.push({
            signerName: approverName,
            signerRole: approverRole,
            meaning: 'APPROVED',
            signatureHash: approvedHash,
            signedAt: approvedAt,
          });
        }
        if (status === 'REJECTED') {
          const rejectedAtStr = rejectedAt.toISOString();
          const rejecterRole = cal.rejecterRole || 'QA';
          const rejecterName = cal.rejecterName || 'Elena QA';
          const rejectedHash = generateSignatureHash(record.id, rejecterName, rejecterRole, rejectedAtStr, 'REJECTED');
          signaturesData.push({
            signerName: rejecterName,
            signerRole: rejecterRole,
            meaning: 'REJECTED',
            signatureHash: rejectedHash,
            signedAt: rejectedAt,
          });
        }

        for (const sig of signaturesData) {
          await prisma.signature.create({
            data: {
              calibrationRecordId: record.id,
              signerName: sig.signerName,
              signerRole: sig.signerRole as any,
              meaning: sig.meaning as any,
              signatureHash: sig.signatureHash,
              signedAt: sig.signedAt,
            }
          });
        }
      } else {
        // 5-Point Calibration
        const percentages = [0, 0.25, 0.50, 0.75, 1.00];
        let overallPass = true;

        const pointsData = percentages.map((p, idx) => {
          const targetInput = calculateTargetInput(instrument.rangeMin, instrument.rangeMax, p);
          const expectedOutput = calculateExpectedOutput(
            instrument.rangeMin,
            instrument.rangeMax,
            instrument.signalType,
            p
          );

          let asFoundOutput = expectedOutput;
          let asLeftOutput = expectedOutput;

          if (cal.pass) {
            // Slight deviation within MPE
            const foundDev = (idx % 2 === 0 ? 0.3 : -0.2) * (mpe / 100) * outputSpan;
            const leftDev = (idx % 2 === 0 ? 0.05 : -0.04) * (mpe / 100) * outputSpan;
            asFoundOutput = expectedOutput + foundDev;
            asLeftOutput = expectedOutput + leftDev;
          } else {
            // Fail on the last two points
            if (idx >= 3) {
              const foundDev = 1.8 * (mpe / 100) * outputSpan; // Exceeds MPE
              const leftDev = 1.35 * (mpe / 100) * outputSpan; // Exceeds MPE (fails calibration)
              asFoundOutput = expectedOutput + foundDev;
              asLeftOutput = expectedOutput + leftDev;
              overallPass = false;
            } else {
              const foundDev = 0.2 * (mpe / 100) * outputSpan;
              const leftDev = 0.02 * (mpe / 100) * outputSpan;
              asFoundOutput = expectedOutput + foundDev;
              asLeftOutput = expectedOutput + leftDev;
            }
          }

          const asFoundError = calculateErrorPercent(asFoundOutput, expectedOutput, outputSpan);
          const asLeftError = calculateErrorPercent(asLeftOutput, expectedOutput, outputSpan);
          const pointPass = Math.abs(asLeftError) <= mpe;

          return {
            targetInput,
            expectedOutput,
            asFoundOutput,
            asLeftOutput,
            asFoundError,
            asLeftError,
            passFail: pointPass,
          };
        });

        const record = await prisma.calibrationRecord.create({
          data: {
            instrumentId: instrument.id,
            calibrationDate: cal.calibrationDate,
            technicianName: cal.technicianName,
            passFail: overallPass,
            notes: cal.notes,
            status: status as any,
            submittedAt,
            approvedAt,
            rejectedAt,
            testPoints: {
              create: pointsData,
            }
          },
          include: {
            testPoints: true
          }
        });

        // Link reference standard
        let multiStdId = stdBxMc6.id;
        if (instrument.instrumentType.toLowerCase().includes('pressure') || instrument.instrumentType.toLowerCase().includes('valve') || instrument.instrumentType.toLowerCase().includes('switch')) {
          multiStdId = stdFl754.id;
        } else if (instrument.instrumentType.toLowerCase().includes('temperature')) {
          multiStdId = stdKs344.id;
        }
        await prisma.calibrationReferenceStandard.create({
          data: {
            calibrationRecordId: record.id,
            referenceStandardId: multiStdId,
            usageNotes: 'Trace reference standard verification.',
          }
        });

        // Audit Event
        await prisma.auditEvent.create({
          data: {
            entityType: 'CalibrationRecord',
            entityId: record.id,
            action: 'CREATE',
            newValue: record as any,
            changedBy: 'system@caltrack.com',
            reason: 'Multi-Point Calibration Record Seeding',
          }
        });

        // Seed Signatures
        const signaturesData = [];
        if (status === 'PENDING_REVIEW' || status === 'APPROVED' || status === 'REJECTED') {
          const submittedAtStr = submittedAt.toISOString();
          const submittedHash = generateSignatureHash(record.id, cal.technicianName, 'TECHNICIAN', submittedAtStr, 'PENDING_REVIEW');
          signaturesData.push({
            signerName: cal.technicianName,
            signerRole: 'TECHNICIAN',
            meaning: 'SUBMITTED',
            signatureHash: submittedHash,
            signedAt: submittedAt,
          });
        }
        if (status === 'APPROVED') {
          const approvedAtStr = approvedAt.toISOString();
          const approverRole = cal.approverRole || 'SUPERVISOR';
          const approverName = cal.approverName || 'Marcus Supervisor';
          const approvedHash = generateSignatureHash(record.id, approverName, approverRole, approvedAtStr, 'APPROVED');
          signaturesData.push({
            signerName: approverName,
            signerRole: approverRole,
            meaning: 'APPROVED',
            signatureHash: approvedHash,
            signedAt: approvedAt,
          });
        }
        if (status === 'REJECTED') {
          const rejectedAtStr = rejectedAt.toISOString();
          const rejecterRole = cal.rejecterRole || 'QA';
          const rejecterName = cal.rejecterName || 'Elena QA';
          const rejectedHash = generateSignatureHash(record.id, rejecterName, rejecterRole, rejectedAtStr, 'REJECTED');
          signaturesData.push({
            signerName: rejecterName,
            signerRole: rejecterRole,
            meaning: 'REJECTED',
            signatureHash: rejectedHash,
            signedAt: rejectedAt,
          });
        }

        for (const sig of signaturesData) {
          await prisma.signature.create({
            data: {
              calibrationRecordId: record.id,
              signerName: sig.signerName,
              signerRole: sig.signerRole as any,
              meaning: sig.meaning as any,
              signatureHash: sig.signatureHash,
              signedAt: sig.signedAt,
            }
          });
        }
      }
    }
  }

  // Seeding realistic industrial devices
  await seedInstrument({
    tagNumber: '10-PT-101A',
    instrumentType: 'Pressure Transmitter',
    manufacturer: 'ABB',
    model: '266MST Differential Pressure',
    rangeMin: 0,
    rangeMax: 150,
    engineeringUnits: 'PSI',
    signalType: '4-20 mA',
    location: 'Utilities Boiler House Main Steam Header',
    maxPermissibleError: 0.25,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 30 * 24 * 3600000), // 30 days ago
        technicianName: 'Marcus Vance',
        notes: 'Pre-startup check. Minor zero drift calibrated out.',
        pass: true,
      },
      {
        calibrationDate: new Date(Date.now() - 365 * 24 * 3600000), // 1 year ago
        technicianName: 'Elena Rostova',
        notes: 'Annual inspection. Met specifications.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '10-PT-101B',
    instrumentType: 'Pressure Transmitter',
    manufacturer: 'ABB',
    model: '266GST Gauge Pressure',
    rangeMin: 0,
    rangeMax: 150,
    engineeringUnits: 'PSI',
    signalType: '4-20 mA',
    location: 'Utilities Boiler House Redundant Header B',
    maxPermissibleError: 0.25,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 15 * 24 * 3600000), // 15 days ago
        technicianName: 'Marcus Vance',
        notes: 'As found within limits. No adjustments required.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '10-LT-201',
    instrumentType: 'Level Transmitter',
    manufacturer: 'ABB',
    model: 'LMT100 Magnetostrictive',
    rangeMin: 0,
    rangeMax: 120,
    engineeringUnits: 'inches',
    signalType: '4-20 mA',
    location: 'Condensate Flash Vessel V-204 Level Control',
    maxPermissibleError: 0.50,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 45 * 24 * 3600000),
        technicianName: 'Elena Rostova',
        notes: 'Float inspected and cleaned. Recalibrated successfully.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '12-TE-301A',
    instrumentType: 'Temperature Element',
    manufacturer: 'Rosemount',
    model: '0065 RTD Sensor',
    rangeMin: 0,
    rangeMax: 200,
    engineeringUnits: '°C',
    signalType: 'Direct Display',
    location: 'Hydrotreater Reactor RX-302 Middle Bed Thermowell',
    maxPermissibleError: 0.75,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 1 * 24 * 3600000), // 1 day ago
        technicianName: 'John Doe',
        notes: 'Annual recalibration. Awaiting supervisor review.',
        pass: true,
        status: 'PENDING_REVIEW',
        submittedAt: new Date(Date.now() - 1 * 24 * 3600000),
      },
      {
        calibrationDate: new Date(Date.now() - 60 * 24 * 3600000),
        technicianName: 'John Doe',
        notes: 'Simulated RTD input. Display calibrated with dry block calibrator.',
        pass: true,
        status: 'APPROVED',
      }
    ]
  });

  await seedInstrument({
    tagNumber: '12-TT-301',
    instrumentType: 'Temperature Transmitter',
    manufacturer: 'Honeywell',
    model: 'STT700Smart',
    rangeMin: 32,
    rangeMax: 350,
    engineeringUnits: '°F',
    signalType: '4-20 mA',
    location: 'Hydrotreater Reactor RX-302 Bed Overhead Vent',
    maxPermissibleError: 0.50,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 2 * 24 * 3600000), // 2 days ago
        technicianName: 'Marcus Vance',
        notes: 'Failed due to massive drift on the upper span limits.',
        pass: false,
        status: 'REJECTED',
        submittedAt: new Date(Date.now() - 2 * 24 * 3600000),
        rejectedAt: new Date(Date.now() - 2 * 24 * 3600000),
        rejecterName: 'Elena QA',
        rejecterRole: 'QA',
      },
      {
        calibrationDate: new Date(Date.now() - 200 * 24 * 3600000),
        technicianName: 'Marcus Vance',
        notes: 'Seeded legacy calibration record to test backward-compatibility rendering.',
        pass: true,
        isLegacy: true,
        status: 'APPROVED',
      }
    ]
  });

  await seedInstrument({
    tagNumber: '20-FT-402',
    instrumentType: 'Flow Transmitter',
    manufacturer: 'Endress+Hauser',
    model: 'Promass F 300 Coriolis',
    rangeMin: 0,
    rangeMax: 5000,
    engineeringUnits: 'kg/h',
    signalType: '4-20 mA',
    location: 'Separation Unit Crude Feed Pump Discharge',
    maxPermissibleError: 0.15,
    status: 'CALIBRATION_DUE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 3 * 3600000), // 3 hours ago
        technicianName: 'Marcus Vance',
        notes: 'In-progress check. Initial testing points recorded in DRAFT.',
        pass: true,
        status: 'DRAFT',
      },
      {
        calibrationDate: new Date(Date.now() - 360 * 24 * 3600000), // 360 days ago
        technicianName: 'Elena Rostova',
        notes: 'Pre-run verification check. Output within tolerance.',
        pass: true,
        status: 'APPROVED',
      },
      {
        calibrationDate: new Date(Date.now() - 5 * 24 * 3600000), // 5 days ago (Failed!)
        technicianName: 'Marcus Vance',
        notes: 'Coriolis tube drift observed at 75% and 100% test scale. Needs maintenance.',
        pass: false,
        status: 'APPROVED',
      }
    ]
  });

  await seedInstrument({
    tagNumber: '20-FV-401',
    instrumentType: 'Control Valve',
    manufacturer: 'Samson',
    model: 'Type 3241 Valve with 3730 Positioner',
    rangeMin: 0,
    rangeMax: 100,
    engineeringUnits: '%',
    signalType: '4-20 mA',
    location: 'Crude Tower Fractionator Level Control Valve',
    maxPermissibleError: 1.50,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 90 * 24 * 3600000),
        technicianName: 'Elena Rostova',
        notes: 'Inspected packing and actuator diaphragm. Travel calibrated 0-100%.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '20-FV-402',
    instrumentType: 'Control Valve',
    manufacturer: 'Fisher',
    model: 'easy-Drive DVC2000 Positioner',
    rangeMin: 0,
    rangeMax: 100,
    engineeringUnits: '%',
    signalType: '4-20 mA',
    location: 'Separation Vessel V-102 Overhead Gas Bypass Valve',
    maxPermissibleError: 1.00,
    status: 'INACTIVE',
    calibrations: []
  });

  await seedInstrument({
    tagNumber: '12-PI-203',
    instrumentType: 'Pressure Indicator',
    manufacturer: 'Ashcroft',
    model: 'Duragauge 1279 Process Gauge',
    rangeMin: 0,
    rangeMax: 600,
    engineeringUnits: 'PSI',
    signalType: 'Direct Display',
    location: 'Recycle Gas Compressor Discharge Gas Feed Line',
    maxPermissibleError: 1.00,
    status: 'OVERDUE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 400 * 24 * 3600000), // Overdue!
        technicianName: 'John Doe',
        notes: 'Mechanical dial gauge calibrated using deadweight tester.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '12-TS-304',
    instrumentType: 'Temperature Switch',
    manufacturer: 'Honeywell',
    model: 'TS-90 Mechanical Switch',
    rangeMin: 0,
    rangeMax: 150,
    engineeringUnits: '°C',
    signalType: 'Direct Display',
    location: 'Lube Oil Supply Console Outlet Temperature Trip',
    maxPermissibleError: 2.00,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 120 * 24 * 3600000),
        technicianName: 'Marcus Vance',
        notes: 'Setpoint trip threshold verified at 95°C and reset.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '30-AIT-501',
    instrumentType: 'Analytical Transmitter',
    manufacturer: 'Yokogawa',
    model: 'FLXA202 pH Analyzer',
    rangeMin: 0,
    rangeMax: 14,
    engineeringUnits: 'pH',
    signalType: '4-20 mA',
    location: 'Wastewater Neutralization Basin discharge channel',
    maxPermissibleError: 0.50,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 4 * 24 * 3600000),
        technicianName: 'Elena Rostova',
        notes: 'Glass probe buffered with pH 4.01, 7.00, and 10.01 standard solution.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '15-LT-212',
    instrumentType: 'Level Radar',
    manufacturer: 'Vega',
    model: 'VEGAPULS 6X Radar',
    rangeMin: 0,
    rangeMax: 45,
    engineeringUnits: 'FT',
    signalType: '4-20 mA',
    location: 'Crude Storage Tank T-102 Level Radar Receiver',
    maxPermissibleError: 0.25,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 100 * 24 * 3600000),
        technicianName: 'John Doe',
        notes: 'Eco-cardiogram mapped. False echoes ignored. Calibrated.',
        pass: true,
      }
    ]
  });

  await seedInstrument({
    tagNumber: '15-FT-215',
    instrumentType: 'Flow Transmitter',
    manufacturer: 'Siemens',
    model: 'SITRANS F M MAG 5100 W Electromagnetic',
    rangeMin: 0,
    rangeMax: 1000,
    engineeringUnits: 'GPM',
    signalType: '4-20 mA',
    location: 'Cooling Water Supply Loop Intake Main Pipe',
    maxPermissibleError: 0.50,
    status: 'ACTIVE',
    calibrations: [
      {
        calibrationDate: new Date(Date.now() - 150 * 24 * 3600000),
        technicianName: 'Elena Rostova',
        notes: 'Coil signal and insulation resistance validated. Output calibrated.',
        pass: true,
      }
    ]
  });

  console.log('Seeding Work Orders...');
  
  const pt101a = await prisma.instrument.findUnique({ where: { tagNumber: '10-PT-101A' } });
  const ft402 = await prisma.instrument.findUnique({ where: { tagNumber: '20-FT-402' } });
  const pi203 = await prisma.instrument.findUnique({ where: { tagNumber: '12-PI-203' } });

  if (pt101a) {
    const wo1 = await prisma.workOrder.create({
      data: {
        workOrderNumber: 'WO-1001',
        instrumentId: pt101a.id,
        status: 'COMPLETED',
        priority: 'MEDIUM',
        assignedTechnician: 'Marcus Vance',
        scheduledDate: new Date(Date.now() - 32 * 24 * 3600000),
        completedDate: new Date(Date.now() - 30 * 24 * 3600000),
        description: 'Routine annual calibration check.',
      },
    });
    await prisma.auditEvent.create({
      data: {
        entityType: 'WorkOrder',
        entityId: wo1.id,
        action: 'CREATE',
        newValue: wo1 as any,
        changedBy: 'system@caltrack.com',
        reason: 'Work Order Seeding',
      },
    });
  }

  if (ft402) {
    const wo2 = await prisma.workOrder.create({
      data: {
        workOrderNumber: 'WO-1002',
        instrumentId: ft402.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedTechnician: 'Elena Rostova',
        scheduledDate: new Date(Date.now() - 2 * 24 * 3600000),
        description: 'Drift detected on Coriolis sensor. Calibrate and adjust.',
      },
    });
    await prisma.auditEvent.create({
      data: {
        entityType: 'WorkOrder',
        entityId: wo2.id,
        action: 'CREATE',
        newValue: wo2 as any,
        changedBy: 'system@caltrack.com',
        reason: 'Work Order Seeding',
      },
    });
  }

  if (pi203) {
    const wo3 = await prisma.workOrder.create({
      data: {
        workOrderNumber: 'WO-1003',
        instrumentId: pi203.id,
        status: 'OPEN',
        priority: 'CRITICAL',
        description: 'Calibration overdue by >30 days. High priority scheduling.',
      },
    });
    await prisma.auditEvent.create({
      data: {
        entityType: 'WorkOrder',
        entityId: wo3.id,
        action: 'CREATE',
        newValue: wo3 as any,
        changedBy: 'system@caltrack.com',
        reason: 'Work Order Seeding',
      },
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
