export type InstrumentStatus = 'ACTIVE' | 'CALIBRATION_DUE' | 'OVERDUE' | 'INACTIVE';

export interface Instrument {
  id: string;
  tagNumber: string;
  instrumentType: string;
  manufacturer: string;
  model: string;
  rangeMin: number;
  rangeMax: number;
  engineeringUnits: string;
  signalType: string;
  location: string;
  status: InstrumentStatus;
  maxPermissibleError: number; // e.g. 0.5 for ±0.5%
  createdAt: Date | string;
  updatedAt: Date | string;
  processAreaId?: string | null;
  processArea?: ProcessArea | null;
  controlLoopId?: string | null;
  controlLoop?: ControlLoop | null;
}

export interface ProcessArea {
  id: string;
  areaCode: string;
  name: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  controlLoops?: ControlLoop[];
  instruments?: Instrument[];
}

export interface ControlLoop {
  id: string;
  loopNumber: string;
  loopTag: string;
  description?: string | null;
  pidReference?: string | null;
  processAreaId: string;
  processArea?: ProcessArea;
  createdAt: Date | string;
  updatedAt: Date | string;
  instruments?: Instrument[];
}

export interface CalibrationTestPoint {
  id: string;
  calibrationRecordId: string;
  targetInput: number;
  expectedOutput: number;
  asFoundOutput: number;
  asLeftOutput: number;
  asFoundError: number;
  asLeftError: number;
  passFail: boolean;
}

export interface CalibrationRecord {
  id: string;
  instrumentId: string;
  calibrationDate: Date | string;
  technicianName: string;
  asFound?: number | null;
  asLeft?: number | null;
  passFail: boolean;
  notes?: string | null;
  createdAt: Date | string;
  testPoints?: CalibrationTestPoint[];
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue: any;
  newValue: any;
  changedBy: string;
  timestamp: Date | string;
  reason?: string | null;
}

// Data Transfer Objects (DTOs)
export interface CreateInstrumentDto {
  tagNumber: string;
  instrumentType: string;
  manufacturer: string;
  model: string;
  rangeMin: number;
  rangeMax: number;
  engineeringUnits: string;
  signalType: string;
  location: string;
  status?: InstrumentStatus;
  maxPermissibleError?: number; // e.g. 0.5
  processAreaId?: string | null;
  controlLoopId?: string | null;
}

export interface UpdateInstrumentDto {
  tagNumber?: string;
  instrumentType?: string;
  manufacturer?: string;
  model?: string;
  rangeMin?: number;
  rangeMax?: number;
  engineeringUnits?: string;
  signalType?: string;
  location?: string;
  status?: InstrumentStatus;
  maxPermissibleError?: number;
  processAreaId?: string | null;
  controlLoopId?: string | null;
  reason: string; // Audit reason is required on update
}

export interface CreateProcessAreaDto {
  areaCode: string;
  name: string;
  description?: string;
}

export interface CreateControlLoopDto {
  loopNumber: string;
  loopTag: string;
  description?: string;
  pidReference?: string;
  processAreaId: string;
}

export interface CreateCalibrationTestPointDto {
  targetInput: number;
  asFoundOutput: number;
  asLeftOutput: number;
}

export interface CreateCalibrationRecordDto {
  instrumentId: string;
  calibrationDate: string | Date;
  technicianName: string;
  notes?: string;
  testPoints: CreateCalibrationTestPointDto[];
}

export interface CreateAuditEventDto {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValue?: any;
  newValue?: any;
  changedBy: string;
  reason?: string;
}

// Telemetry & KPI stats payload
export interface DashboardStats {
  totalInstruments: number;
  calibrationsDue: number;
  overdueInstruments: number;
  recentAuditActivity: AuditEvent[];
  totalProcessAreas: number;
  totalControlLoops: number;
}
