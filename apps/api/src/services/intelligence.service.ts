import prisma from '../db/prisma';
import { InstrumentIntelligenceSummary, CalibrationRiskLevel } from '@caltrack/types';

export function calculateIntelligence(instrument: any): InstrumentIntelligenceSummary {
  const calibrations = instrument.calibrations || [];
  
  // Sort calibrations: newest first
  const sortedCalibrations = [...calibrations].sort(
    (a: any, b: any) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime()
  );
  
  const totalCalibrations = sortedCalibrations.length;
  const failedCalibrations = sortedCalibrations.filter((c: any) => !c.passFail).length;
  const passRate = totalCalibrations > 0 ? (totalCalibrations - failedCalibrations) / totalCalibrations : 1.0;
  
  const lastCalibration = sortedCalibrations[0] || null;
  const lastCalibrationDate = lastCalibration ? lastCalibration.calibrationDate : null;
  const lastCalibrationStatus = lastCalibration ? lastCalibration.status : null;
  const lastCalibrationPass = lastCalibration ? lastCalibration.passFail : null;
  
  // Gather all test points
  const allTestPoints = sortedCalibrations.flatMap((c: any) => c.testPoints || []);
  
  let worstTestPointError = 0;
  let avgAbsoluteAsLeftError = 0;
  
  if (allTestPoints.length > 0) {
    worstTestPointError = Math.max(
      ...allTestPoints.map((tp: any) =>
        Math.max(Math.abs(tp.asFoundError || 0), Math.abs(tp.asLeftError || 0))
      )
    );
    
    const sumAbsAsLeft = allTestPoints.reduce((sum: number, tp: any) => sum + Math.abs(tp.asLeftError || 0), 0);
    avgAbsoluteAsLeftError = sumAbsAsLeft / allTestPoints.length;
  }
  
  // Consecutive failed calibrations starting from most recent
  let repeatedFailures = 0;
  for (const cal of sortedCalibrations) {
    if (!cal.passFail) {
      repeatedFailures++;
    } else {
      break;
    }
  }
  
  // Drift direction calculation
  let driftDirection: 'UPWARD' | 'DOWNWARD' | 'STABLE' | 'NONE' = 'NONE';
  let avgDrift = 0;
  
  if (sortedCalibrations.length >= 2) {
    const cal0 = sortedCalibrations[0];
    const cal1 = sortedCalibrations[1];
    
    const pts0 = cal0.testPoints || [];
    const pts1 = cal1.testPoints || [];
    
    const N = Math.min(pts0.length, pts1.length);
    if (N > 0) {
      let totalDiff = 0;
      for (let i = 0; i < N; i++) {
        // Current Found Error vs Previous Left Error
        totalDiff += ((pts0[i].asFoundError || 0) - (pts1[i].asLeftError || 0));
      }
      avgDrift = totalDiff / N;
      
      if (avgDrift > 0.05) {
        driftDirection = 'UPWARD';
      } else if (avgDrift < -0.05) {
        driftDirection = 'DOWNWARD';
      } else {
        driftDirection = 'STABLE';
      }
    }
  }
  
  // Deterministic risk scoring
  let riskLevel: CalibrationRiskLevel = 'LOW';
  const isOverdue = instrument.status === 'OVERDUE';
  const isDueSoon = instrument.status === 'CALIBRATION_DUE';
  const lastCalFailed = lastCalibration && !lastCalibration.passFail;
  
  if (isOverdue && lastCalFailed) {
    riskLevel = 'CRITICAL';
  } else if (repeatedFailures >= 2 || (lastCalibration && worstTestPointError > instrument.maxPermissibleError * 1.5)) {
    riskLevel = 'HIGH';
  } else if (isDueSoon || isOverdue || driftDirection === 'UPWARD' || driftDirection === 'DOWNWARD') {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }
  
  // local technician instructions
  const recommendedAttentionItems: string[] = [];
  
  if (riskLevel === 'CRITICAL') {
    recommendedAttentionItems.push('CRITICAL: Device is overdue and its last calibration failed. Immediate recalibration required.');
  }
  if (repeatedFailures >= 2) {
    recommendedAttentionItems.push(`HIGH RISK: ${repeatedFailures} consecutive calibration failures detected. Investigate potential hardware malfunction.`);
  }
  if (lastCalibration && worstTestPointError > instrument.maxPermissibleError * 1.5) {
    recommendedAttentionItems.push(`HIGH RISK: Maximum error of ${worstTestPointError.toFixed(2)}% exceeds MPE limits by 1.5x. Assess process safety impact.`);
  }
  if (isOverdue && !lastCalFailed) {
    recommendedAttentionItems.push('Device is overdue for periodic validation check. Schedule maintenance task.');
  }
  if (isDueSoon) {
    recommendedAttentionItems.push('Device is approaching calibration deadline. Prepare validation standards.');
  }
  if (driftDirection === 'UPWARD') {
    recommendedAttentionItems.push(`Drift trend: UPWARD (avg drift: +${avgDrift.toFixed(2)}% of span). Monitor closely on next inspection.`);
  }
  if (driftDirection === 'DOWNWARD') {
    recommendedAttentionItems.push(`Drift trend: DOWNWARD (avg drift: ${avgDrift.toFixed(2)}% of span). Monitor closely on next inspection.`);
  }
  if (totalCalibrations === 0) {
    recommendedAttentionItems.push('Baseline calibration required. No historical quality data exists.');
  }
  
  if (recommendedAttentionItems.length === 0) {
    recommendedAttentionItems.push('Normal operation. Device is performing within expected tolerance limits.');
  }
  
  return {
    instrumentId: instrument.id,
    tagNumber: instrument.tagNumber,
    instrumentType: instrument.instrumentType,
    manufacturer: instrument.manufacturer,
    model: instrument.model,
    location: instrument.location,
    status: instrument.status,
    totalCalibrations,
    failedCalibrations,
    passRate,
    lastCalibrationDate,
    lastCalibrationStatus,
    lastCalibrationPass,
    avgAbsoluteAsLeftError,
    worstTestPointError,
    repeatedFailures,
    driftDirection,
    riskLevel,
    recommendedAttentionItems,
  };
}

export async function getInstrumentIntelligence(id: string): Promise<InstrumentIntelligenceSummary> {
  const instrument = await prisma.instrument.findUnique({
    where: { id },
    include: {
      calibrations: {
        include: { testPoints: true },
        orderBy: { calibrationDate: 'desc' },
      },
    },
  });
  
  if (!instrument) {
    throw new Error('Instrument not found');
  }
  
  return calculateIntelligence(instrument);
}

export async function getAllInstrumentsIntelligence(): Promise<InstrumentIntelligenceSummary[]> {
  const instruments = await prisma.instrument.findMany({
    include: {
      calibrations: {
        include: { testPoints: true },
        orderBy: { calibrationDate: 'desc' },
      },
    },
  });
  
  return instruments.map((inst) => calculateIntelligence(inst));
}
