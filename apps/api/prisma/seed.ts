import { PrismaClient, InstrumentStatus } from '@prisma/client';
import { getOutputSpan, calculateExpectedOutput, calculateErrorPercent, calculateTargetInput } from '@caltrack/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  await prisma.auditEvent.deleteMany({});
  await prisma.calibrationTestPoint.deleteMany({});
  await prisma.calibrationRecord.deleteMany({});
  await prisma.instrument.deleteMany({});

  console.log('Database cleared. Starting seeding...');

  // Helper function to seed an instrument and its associated data
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
    calibrations: {
      calibrationDate: Date;
      technicianName: string;
      notes: string;
      pass: boolean;
      isLegacy?: boolean;
    }[];
  }) {
    console.log(`Seeding instrument: ${data.tagNumber}`);
    
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
            testPoints: {
              create: pointsData,
            }
          },
          include: {
            testPoints: true
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
        calibrationDate: new Date(Date.now() - 60 * 24 * 3600000),
        technicianName: 'John Doe',
        notes: 'Simulated RTD input. Display calibrated with dry block calibrator.',
        pass: true,
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
        calibrationDate: new Date(Date.now() - 200 * 24 * 3600000),
        technicianName: 'Marcus Vance',
        notes: 'Seeded legacy calibration record to test backward-compatibility rendering.',
        pass: true,
        isLegacy: true,
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
        calibrationDate: new Date(Date.now() - 360 * 24 * 3600000), // 360 days ago
        technicianName: 'Elena Rostova',
        notes: 'Pre-run verification check. Output within tolerance.',
        pass: true,
      },
      {
        calibrationDate: new Date(Date.now() - 5 * 24 * 3600000), // 5 days ago (Failed!)
        technicianName: 'Marcus Vance',
        notes: 'Coriolis tube drift observed at 75% and 100% test scale. Needs maintenance.',
        pass: false,
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
