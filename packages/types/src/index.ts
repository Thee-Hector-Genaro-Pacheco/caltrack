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
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CalibrationRecord {
  id: string;
  instrumentId: string;
  calibrationDate: Date | string;
  technicianName: string;
  asFound: number;
  asLeft: number;
  passFail: boolean;
  notes?: string | null;
  createdAt: Date | string;
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
  reason: string; // Audit reason is required on update
}

export interface CreateCalibrationRecordDto {
  instrumentId: string;
  calibrationDate: string | Date;
  technicianName: string;
  asFound: number;
  asLeft: number;
  passFail: boolean;
  notes?: string;
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
}
