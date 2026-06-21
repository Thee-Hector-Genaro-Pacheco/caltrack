import prisma from '../db/prisma';
import { CalibrationPrepGuidance } from '@caltrack/types';

export async function generatePrepGuidance(instrumentId: string): Promise<CalibrationPrepGuidance> {
  const instrument = await prisma.instrument.findUnique({
    where: { id: instrumentId }
  });

  if (!instrument) {
    throw new Error('Instrument not found');
  }

  const typeLower = (instrument.instrumentType || '').toLowerCase();
  const unitLower = (instrument.engineeringUnits || '').toLowerCase();

  let category: 'pressure' | 'temperature' | 'flow' | 'level' | 'valve' | 'other' = 'other';

  if (
    typeLower.includes('pressure') ||
    typeLower.includes('vacuum') ||
    typeLower.includes('indicator') ||
    unitLower.includes('psi') ||
    unitLower.includes('bar') ||
    unitLower.includes('pa')
  ) {
    category = 'pressure';
  } else if (
    typeLower.includes('temperature') ||
    typeLower.includes('temp') ||
    typeLower.includes('rtd') ||
    typeLower.includes('thermocouple') ||
    typeLower.includes('switch') ||
    typeLower.includes('element') ||
    unitLower.includes('°c') ||
    unitLower.includes('°f') ||
    unitLower.includes('c') ||
    unitLower.includes('f')
  ) {
    category = 'temperature';
  } else if (
    typeLower.includes('flow') ||
    unitLower.includes('gpm') ||
    unitLower.includes('l/h') ||
    unitLower.includes('kg/h') ||
    unitLower.includes('m3/h')
  ) {
    category = 'flow';
  } else if (
    typeLower.includes('level') ||
    typeLower.includes('radar') ||
    unitLower.includes('inches') ||
    unitLower.includes('ft') ||
    unitLower.includes('m') ||
    unitLower.includes('mm')
  ) {
    category = 'level';
  } else if (
    typeLower.includes('valve') ||
    typeLower.includes('positioner') ||
    typeLower.includes('actuator')
  ) {
    category = 'valve';
  }

  // 1. Required Equipment
  const requiredEquipment: string[] = [];
  if (category === 'pressure') {
    requiredEquipment.push('Pressure calibrator');
    requiredEquipment.push('Hand pump or pressure source');
    requiredEquipment.push('High-pressure test hose and adapters');
  } else if (category === 'temperature') {
    requiredEquipment.push('Dry-block temperature calibrator or thermowell simulator');
    requiredEquipment.push('RTD/TC probe calibrator');
    requiredEquipment.push('Reference thermometer');
  } else if (category === 'flow') {
    requiredEquipment.push('Flow loop calibrator or master meter');
    requiredEquipment.push('Signal simulator or frequency generator');
  } else if (category === 'level') {
    requiredEquipment.push('Level calibration chamber or calibration stand');
    requiredEquipment.push('Tape measure or laser distance meter');
  } else if (category === 'valve') {
    requiredEquipment.push('Pneumatic hand pump or pressure regulator');
    requiredEquipment.push('Travel indicator gauge or calipers');
    requiredEquipment.push('Digital valve positioner tester');
  }

  if (instrument.signalType === '4-20 mA') {
    requiredEquipment.push('Documenting process calibrator');
    requiredEquipment.push('Digital multimeter');
    requiredEquipment.push('Test leads');
    requiredEquipment.push('Precision 250-ohm resistor (for HART communication)');
  }

  requiredEquipment.push('Approved reference standard within calibration date');

  // 2. Reference Standards
  const referenceStandards: string[] = [];
  if (category === 'pressure') {
    referenceStandards.push('Pneumatic/hydraulic pressure standard (accuracy class ±0.025% FS or better)');
  } else if (category === 'temperature') {
    referenceStandards.push('Precision RTD/TC temperature standard (accuracy class ±0.05°C or better)');
  } else if (category === 'flow') {
    referenceStandards.push('Master flow calibrator or volumetric standard (accuracy class ±0.1% or better)');
  } else if (category === 'level') {
    referenceStandards.push('Reference level tape/laser indicator or precision pressure standard (hydrostatic)');
  } else if (category === 'valve') {
    referenceStandards.push('Precision pressure indicator and travel reference standard');
  } else {
    referenceStandards.push('Multifunction process standard or digital multimeter standard');
  }

  // 3. Safety Precautions
  const safetyPrecautions: string[] = [
    'Obtain valid hot work/maintenance permit before starting.',
    'Verify line is depressurized, drained, and isolated.',
    'Notify control room before taking the loop offline.',
    'Wear appropriate PPE (safety glasses, steel-toed boots, protective gloves).',
  ];

  if (category === 'pressure') {
    safetyPrecautions.push('Ensure pressure source is vented completely before disconnecting hoses.');
    safetyPrecautions.push('Do not exceed maximum pressure rating of the sensor or test hoses.');
  } else if (category === 'temperature') {
    safetyPrecautions.push('Avoid contact with hot dry-block calibrator or thermowells; risk of burns.');
    safetyPrecautions.push('Allow temperature probe to cool down before handling.');
  } else if (category === 'valve') {
    safetyPrecautions.push('Keep hands and fingers clear of moving valve stems and actuator linkages; pinch point hazard.');
    safetyPrecautions.push('Isolate air supply and vent actuator pressure before working on mechanical linkages.');
  } else if (category === 'level') {
    safetyPrecautions.push('Use proper fall protection if tank top access is required.');
    safetyPrecautions.push('Follow confined space entry procedures if tank entry is necessary.');
  }

  // 4. Setup Instructions
  const setupInstructions: string[] = [
    'Verify tag number matches the work order.',
    'Clean the instrument exterior and inspect for physical damage.',
    'Isolate the instrument from process lines (close block valves, open vent valves).',
  ];

  if (instrument.signalType === '4-20 mA') {
    setupInstructions.push('Connect digital multimeter in series with the loop to measure mA output, or connect documenting calibrator to test points.');
    setupInstructions.push('Apply 24V loop power if not powered by the control system loop.');
  }

  if (category === 'pressure') {
    setupInstructions.push('Connect hand pump or pressure source to the high-pressure port of the transmitter.');
    setupInstructions.push('Vent the low-pressure side to atmosphere (for differential pressure).');
  } else if (category === 'temperature') {
    setupInstructions.push('Insert temperature element/probe into dry-block calibrator or connect RTD/TC simulator to transmitter inputs.');
  } else if (category === 'valve') {
    setupInstructions.push('Connect regulated air supply to positioner.');
    setupInstructions.push('Attach travel indicator or scale to monitor stem movement.');
  }

  setupInstructions.push('Perform a preliminary zero check and adjust if necessary within allowed limits.');

  // 5. Test Points (5-Point Calibration targets)
  const testPoints: { percent: number; targetInput: number; expectedOutput: number }[] = [];
  const percents = [0, 25, 50, 75, 100];
  for (const p of percents) {
    const percentDecimal = p / 100;
    const targetInput = instrument.rangeMin + percentDecimal * (instrument.rangeMax - instrument.rangeMin);

    let expectedOutput = targetInput;
    if (instrument.signalType === '4-20 mA') {
      expectedOutput = 4 + 16 * percentDecimal;
    }

    testPoints.push({
      percent: p,
      targetInput: Math.round(targetInput * 100) / 100,
      expectedOutput: Math.round(expectedOutput * 100) / 100,
    });
  }

  // 6. Documentation Checklist
  const documentationChecklist: string[] = [
    'Verify current calibration certificate of the reference standard.',
    "Record 'As-Found' values at all 5 test points.",
    'Note any zero or span adjustments made during calibration.',
    "Record 'As-Left' values at all 5 test points.",
    'Complete calibration datasheet with signature and date.',
    'Log calibration event in CalTrack system for supervisor review.',
    'Affix updated calibration label to the instrument housing.',
  ];

  // 7. Common Failure Reasons
  const commonFailureReasons: string[] = [
    'Dirty or loose electrical connections causing signal instability.',
    'Leaking test fittings, hoses, or process isolation valves.',
    'Environmental temperature extremes affecting test equipment accuracy.',
  ];

  if (category === 'pressure') {
    commonFailureReasons.push('Plugged or clogged impulse lines/ports.');
    commonFailureReasons.push('Diaphragm damage or process fluid coating.');
    commonFailureReasons.push(`Sensor drift exceeding maximum permissible error of ±${instrument.maxPermissibleError}%`);
  } else if (category === 'temperature') {
    commonFailureReasons.push('Poor thermal contact between probe and dry-block calibrator insert.');
    commonFailureReasons.push('Degraded or corroded RTD element / thermocouple junction.');
    commonFailureReasons.push(`Sensor drift exceeding maximum permissible error of ±${instrument.maxPermissibleError}%`);
  } else if (category === 'level') {
    commonFailureReasons.push('Process build-up or coating on level probe/sensor.');
    commonFailureReasons.push('Incorrect zero or span reference point settings.');
    commonFailureReasons.push('Turbulence or foam in the vessel interfering with signal.');
  } else if (category === 'valve') {
    commonFailureReasons.push('Pneumatic air leaks in tubings or actuator diaphragm.');
    commonFailureReasons.push('Mechanical wear or stiction in packing/linkages.');
    commonFailureReasons.push('Incorrect positioner calibration or feedback linkage misalignment.');
  }

  // 8. Disclaimer
  const disclaimer = 'Generated guidance must be verified against site procedures and manufacturer documentation. This does not replace official manufacturer manuals.';

  return {
    requiredEquipment,
    referenceStandards,
    safetyPrecautions,
    setupInstructions,
    testPoints,
    documentationChecklist,
    commonFailureReasons,
    disclaimer,
  };
}
