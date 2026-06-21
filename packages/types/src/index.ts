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
  calibrationIntervalMonths: number;
  lastCalibrationDate?: Date | string | null;
  nextCalibrationDueDate?: Date | string | null;
  workOrders?: WorkOrder[];
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
  instrument?: Instrument;
  status: CalibrationStatus;
  submittedAt?: Date | string | null;
  approvedAt?: Date | string | null;
  rejectedAt?: Date | string | null;
  signatures?: Signature[];
  referenceStandards?: CalibrationReferenceStandard[];
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT_CALIBRATION' | 'APPROVE_CALIBRATION' | 'REJECT_CALIBRATION' | 'LINK_REFERENCE_STANDARD';
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
  calibrationIntervalMonths?: number;
  lastCalibrationDate?: Date | string | null;
  nextCalibrationDueDate?: Date | string | null;
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
  calibrationIntervalMonths?: number;
  lastCalibrationDate?: Date | string | null;
  nextCalibrationDueDate?: Date | string | null;
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
  referenceStandards?: { referenceStandardId: string; usageNotes?: string }[];
}

export interface CreateAuditEventDto {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT_CALIBRATION' | 'APPROVE_CALIBRATION' | 'REJECT_CALIBRATION' | 'LINK_REFERENCE_STANDARD';
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
  openWorkOrders: number;
  pendingReviews: number;
  approvedRecords: number;
  rejectedRecords: number;
  totalReferenceStandards: number;
  standardsDueSoon: number;
  expiredStandards: number;
}

export type WorkOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  instrumentId: string;
  instrument?: Instrument;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedTechnician?: string | null;
  scheduledDate?: Date | string | null;
  completedDate?: Date | string | null;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWorkOrderDto {
  instrumentId: string;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  assignedTechnician?: string;
  scheduledDate?: Date | string;
  description?: string;
}

export interface UpdateWorkOrderDto {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  assignedTechnician?: string | null;
  scheduledDate?: Date | string | null;
  completedDate?: Date | string | null;
  description?: string | null;
  reason: string;
}

export type CalibrationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type SignerRole = 'TECHNICIAN' | 'SUPERVISOR' | 'QA';
export type SignatureMeaning = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Signature {
  id: string;
  calibrationRecordId: string;
  signerName: string;
  signerRole: SignerRole;
  meaning: SignatureMeaning;
  signatureHash: string;
  signedAt: Date | string;
}

export type ReferenceStandardStatus = 'ACTIVE' | 'DUE_SOON' | 'EXPIRED' | 'OUT_OF_SERVICE';

export interface ReferenceStandard {
  id: string;
  assetTag: string;
  equipmentType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  accuracyClass: string;
  certificateNumber: string;
  lastCalibratedDate: Date | string;
  calibrationDueDate: Date | string;
  status: ReferenceStandardStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  calibrations?: CalibrationReferenceStandard[];
}

export interface CalibrationReferenceStandard {
  id: string;
  calibrationRecordId: string;
  calibrationRecord?: CalibrationRecord;
  referenceStandardId: string;
  referenceStandard?: ReferenceStandard;
  usageNotes?: string | null;
}

export interface CreateReferenceStandardDto {
  assetTag: string;
  equipmentType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  accuracyClass: string;
  certificateNumber: string;
  lastCalibratedDate: string | Date;
  calibrationDueDate: string | Date;
  status?: ReferenceStandardStatus;
}

export interface UpdateReferenceStandardDto {
  assetTag?: string;
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  accuracyClass?: string;
  certificateNumber?: string;
  lastCalibratedDate?: string | Date;
  calibrationDueDate?: string | Date;
  status?: ReferenceStandardStatus;
  reason: string;
}

export interface CalibrationPrepGuidance {
  requiredEquipment: string[];
  referenceStandards: string[];
  safetyPrecautions: string[];
  setupInstructions: string[];
  testPoints: {
    percent: number;
    targetInput: number;
    expectedOutput: number;
  }[];
  documentationChecklist: string[];
  commonFailureReasons: string[];
  disclaimer: string;
}

