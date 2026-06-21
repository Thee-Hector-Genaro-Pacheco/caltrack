import { isSupabaseConfigured, supabase } from './supabase';
import { Instrument, CalibrationRecord, AuditEvent, DashboardStats, CreateInstrumentDto, UpdateInstrumentDto, CreateCalibrationRecordDto, ProcessArea, CreateProcessAreaDto, ControlLoop, CreateControlLoopDto, WorkOrder, CreateWorkOrderDto, UpdateWorkOrderDto, ReferenceStandard, CreateReferenceStandardDto, UpdateReferenceStandardDto, CalibrationPrepGuidance, TechnicianBriefing } from '@caltrack/types';

// Mock local storage keys
const MOCK_INSTRUMENTS_KEY = 'caltrack_mock_instruments';
const MOCK_CALIBRATIONS_KEY = 'caltrack_mock_calibrations';
const MOCK_AUDIT_KEY = 'caltrack_mock_audits';
const MOCK_PROCESS_AREAS_KEY = 'caltrack_mock_process_areas';
const MOCK_CONTROL_LOOPS_KEY = 'caltrack_mock_control_loops';
const MOCK_WORK_ORDERS_KEY = 'caltrack_mock_work_orders';
const MOCK_REFERENCE_STANDARDS_KEY = 'caltrack_mock_reference_standards';

// Mock Accessors
const getMockReferenceStandards = (): any[] => JSON.parse(localStorage.getItem(MOCK_REFERENCE_STANDARDS_KEY) || '[]');
const saveMockReferenceStandards = (data: any[]) => localStorage.setItem(MOCK_REFERENCE_STANDARDS_KEY, JSON.stringify(data));

function mockSha256(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const seed = Math.abs(hash).toString(16).padEnd(8, 'f');
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += seed;
  }
  return result.slice(0, 64);
}

// Base mock data generator if local storage is empty
function initializeMockData() {
  if (!localStorage.getItem(MOCK_PROCESS_AREAS_KEY)) {
    const mockProcessAreas = [
      {
        id: 'area-10',
        areaCode: '10',
        name: 'Feedwater System',
        description: 'Main boiler feedwater storage, treatment, and pumping facility.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'area-12',
        areaCode: '12',
        name: 'Cooling Water System',
        description: 'Closed-loop non-contact cooling water cooling towers and pumps.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'area-15',
        areaCode: '15',
        name: 'Process Water System',
        description: 'Demineralized water purification, storage, and utility loops.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(MOCK_PROCESS_AREAS_KEY, JSON.stringify(mockProcessAreas));
  }

  if (!localStorage.getItem(MOCK_CONTROL_LOOPS_KEY)) {
    const mockControlLoops = [
      {
        id: 'loop-101',
        loopNumber: '101',
        loopTag: 'PT-101 Control Loop',
        description: 'Boiler 1 Header Pressure Master Control Loop',
        pidReference: 'PID-10-FW-101',
        processAreaId: 'area-10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'loop-215',
        loopNumber: '215',
        loopTag: 'Flow Control Loop',
        description: 'Cooling Tower Recycle Return Flow Loop',
        pidReference: 'PID-12-CW-215',
        processAreaId: 'area-12',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'loop-301',
        loopNumber: '301',
        loopTag: 'Level Control Loop',
        description: 'Deaerator Storage Tank Level Control Loop',
        pidReference: 'PID-15-PW-301',
        processAreaId: 'area-15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(MOCK_CONTROL_LOOPS_KEY, JSON.stringify(mockControlLoops));
  }

  if (!localStorage.getItem(MOCK_REFERENCE_STANDARDS_KEY)) {
    const mockStandards = [
      {
        id: 'std-fl754',
        assetTag: 'REF-FL754',
        equipmentType: 'Documenting Process Calibrator',
        manufacturer: 'Fluke',
        model: '754 Documenting Process Calibrator',
        serialNumber: 'FL754-893012',
        accuracyClass: '±0.01% span',
        certificateNumber: 'CERT-2025-9988',
        lastCalibratedDate: new Date(Date.now() - 180 * 24 * 3600000).toISOString(),
        calibrationDueDate: new Date(Date.now() + 180 * 24 * 3600000).toISOString(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-fl725',
        assetTag: 'REF-FL725',
        equipmentType: 'Multifunction Process Calibrator',
        manufacturer: 'Fluke',
        model: '725 Multifunction Process Calibrator',
        serialNumber: 'FL725-774431',
        accuracyClass: '±0.02% span',
        certificateNumber: 'CERT-2026-1024',
        lastCalibratedDate: new Date(Date.now() - 350 * 24 * 3600000).toISOString(),
        calibrationDueDate: new Date(Date.now() + 15 * 24 * 3600000).toISOString(),
        status: 'DUE_SOON',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-bxmc6',
        assetTag: 'REF-BXMC6',
        equipmentType: 'Advanced Field Calibrator',
        manufacturer: 'Beamex',
        model: 'MC6 Advanced Field Calibrator',
        serialNumber: 'BXMC6-554129',
        accuracyClass: '±0.005% RDG',
        certificateNumber: 'CERT-2026-4433',
        lastCalibratedDate: new Date(Date.now() - 90 * 24 * 3600000).toISOString(),
        calibrationDueDate: new Date(Date.now() + 270 * 24 * 3600000).toISOString(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-dr620',
        assetTag: 'REF-DR620',
        equipmentType: 'Pressure Calibrator',
        manufacturer: 'Druck',
        model: 'DPI620 Pressure Calibrator',
        serialNumber: 'DR620-112233',
        accuracyClass: '±0.025% FS',
        certificateNumber: 'CERT-2025-4859',
        lastCalibratedDate: new Date(Date.now() - 395 * 24 * 3600000).toISOString(),
        calibrationDueDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        status: 'EXPIRED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-wk7000',
        assetTag: 'REF-WK7000',
        equipmentType: 'Pressure Indicator',
        manufacturer: 'WIKA',
        model: 'CPH7000 Pressure Indicator',
        serialNumber: 'WK7000-482910',
        accuracyClass: '±0.05% FS',
        certificateNumber: 'CERT-2026-7788',
        lastCalibratedDate: new Date(Date.now() - 240 * 24 * 3600000).toISOString(),
        calibrationDueDate: new Date(Date.now() + 120 * 24 * 3600000).toISOString(),
        status: 'OUT_OF_SERVICE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'std-ks344',
        assetTag: 'REF-KS344',
        equipmentType: 'Digital Multimeter',
        manufacturer: 'Keysight',
        model: '34465A Digital Multimeter',
        serialNumber: 'KS344-992200',
        accuracyClass: '±0.0035% span',
        certificateNumber: 'CERT-2026-5511',
        lastCalibratedDate: new Date(Date.now() - 150 * 24 * 3600000).toISOString(),
        calibrationDueDate: new Date(Date.now() + 210 * 24 * 3600000).toISOString(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(MOCK_REFERENCE_STANDARDS_KEY, JSON.stringify(mockStandards));
  }

  if (!localStorage.getItem(MOCK_INSTRUMENTS_KEY)) {
    const mockInstruments: Instrument[] = [
      {
        id: 'inst-1',
        tagNumber: '10-PT-101A',
        instrumentType: 'Pressure Transmitter',
        manufacturer: 'ABB',
        model: '266MST Differential Pressure',
        rangeMin: 0,
        rangeMax: 150,
        engineeringUnits: 'PSI',
        signalType: '4-20 mA',
        location: 'Utilities Boiler House Main Steam Header',
        status: 'ACTIVE',
        maxPermissibleError: 0.25,
        processAreaId: 'area-10',
        controlLoopId: 'loop-101',
        calibrationIntervalMonths: 12,
        lastCalibrationDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        nextCalibrationDueDate: new Date(Date.now() + 335 * 24 * 3600000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inst-2',
        tagNumber: '12-TT-301',
        instrumentType: 'Temperature Transmitter',
        manufacturer: 'Honeywell',
        model: 'STT700Smart',
        rangeMin: 32,
        rangeMax: 350,
        engineeringUnits: '°F',
        signalType: '4-20 mA',
        location: 'Hydrotreater Reactor RX-302 Bed Overhead Vent',
        status: 'CALIBRATION_DUE',
        maxPermissibleError: 0.5,
        processAreaId: 'area-12',
        controlLoopId: 'loop-215',
        calibrationIntervalMonths: 12,
        lastCalibrationDate: new Date(Date.now() - 366 * 24 * 3600000).toISOString(),
        nextCalibrationDueDate: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inst-3',
        tagNumber: '12-TE-301A',
        instrumentType: 'Temperature Element',
        manufacturer: 'Rosemount',
        model: '0065 RTD Sensor',
        rangeMin: 0,
        rangeMax: 200,
        engineeringUnits: '°C',
        signalType: 'Direct Display',
        location: 'Hydrotreater Reactor RX-302 Middle Bed Thermowell',
        status: 'OVERDUE',
        maxPermissibleError: 0.75,
        processAreaId: 'area-12',
        controlLoopId: 'loop-215',
        calibrationIntervalMonths: 12,
        lastCalibrationDate: new Date(Date.now() - 400 * 24 * 3600000).toISOString(),
        nextCalibrationDueDate: new Date(Date.now() - 35 * 24 * 3600000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inst-4',
        tagNumber: '15-LT-212',
        instrumentType: 'Level Radar',
        manufacturer: 'Vega',
        model: 'VEGAPULS 6X Radar',
        rangeMin: 0,
        rangeMax: 45,
        engineeringUnits: 'FT',
        signalType: '4-20 mA',
        location: 'Crude Storage Tank T-102 Level Radar Receiver',
        status: 'INACTIVE',
        maxPermissibleError: 0.25,
        processAreaId: 'area-15',
        controlLoopId: 'loop-301',
        calibrationIntervalMonths: 12,
        lastCalibrationDate: null,
        nextCalibrationDueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const stdsList = JSON.parse(localStorage.getItem(MOCK_REFERENCE_STANDARDS_KEY) || '[]');
    const stdFl754 = stdsList.find((s: any) => s.assetTag === 'REF-FL754');
    const stdKs344 = stdsList.find((s: any) => s.assetTag === 'REF-KS344');
    const stdBxMc6 = stdsList.find((s: any) => s.assetTag === 'REF-BXMC6');

    const mockCalibrations: CalibrationRecord[] = [
      {
        id: 'cal-1',
        instrumentId: 'inst-1',
        calibrationDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        technicianName: 'Marcus Vance',
        asFound: null,
        asLeft: null,
        passFail: true,
        notes: 'Annual recalibration. Minor zero-shift adjusted.',
        createdAt: new Date().toISOString(),
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        approvedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        signatures: [
          {
            id: 'sig-1',
            calibrationRecordId: 'cal-1',
            signerName: 'Marcus Vance',
            signerRole: 'TECHNICIAN',
            meaning: 'SUBMITTED',
            signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            signedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
          },
          {
            id: 'sig-2',
            calibrationRecordId: 'cal-1',
            signerName: 'Marcus Supervisor',
            signerRole: 'SUPERVISOR',
            meaning: 'APPROVED',
            signatureHash: 'f451a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856',
            signedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
          }
        ],
        referenceStandards: stdFl754 ? [
          {
            id: 'mock-link-1',
            calibrationRecordId: 'cal-1',
            referenceStandardId: stdFl754.id,
            usageNotes: 'Routine loop validation test.',
            referenceStandard: stdFl754
          }
        ] : []
      },
      {
        id: 'cal-2',
        instrumentId: 'inst-2',
        calibrationDate: new Date(Date.now() - 366 * 24 * 3600000).toISOString(),
        technicianName: 'Marcus Vance',
        asFound: null,
        asLeft: null,
        passFail: true,
        notes: 'Instrument drift observed, recalibrated within tolerance.',
        createdAt: new Date().toISOString(),
        status: 'APPROVED',
        submittedAt: new Date(Date.now() - 366 * 24 * 3600000).toISOString(),
        approvedAt: new Date(Date.now() - 366 * 24 * 3600000).toISOString(),
        signatures: [
          {
            id: 'sig-3',
            calibrationRecordId: 'cal-2',
            signerName: 'Marcus Vance',
            signerRole: 'TECHNICIAN',
            meaning: 'SUBMITTED',
            signatureHash: 'a123b44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b857',
            signedAt: new Date(Date.now() - 366 * 24 * 3600000).toISOString(),
          },
          {
            id: 'sig-4',
            calibrationRecordId: 'cal-2',
            signerName: 'Marcus Supervisor',
            signerRole: 'SUPERVISOR',
            meaning: 'APPROVED',
            signatureHash: 'b456a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b858',
            signedAt: new Date(Date.now() - 366 * 24 * 3600000).toISOString(),
          }
        ],
        referenceStandards: stdKs344 ? [
          {
            id: 'mock-link-2',
            calibrationRecordId: 'cal-2',
            referenceStandardId: stdKs344.id,
            usageNotes: 'Annual RTD dry block calibration.',
            referenceStandard: stdKs344
          }
        ] : []
      },
      {
        id: 'cal-pending-1',
        instrumentId: 'inst-2',
        calibrationDate: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        technicianName: 'Marcus Vance',
        asFound: null,
        asLeft: null,
        passFail: true,
        notes: 'Awaiting supervisor approval of 5-point data.',
        createdAt: new Date().toISOString(),
        status: 'PENDING_REVIEW',
        submittedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        signatures: [
          {
            id: 'sig-5',
            calibrationRecordId: 'cal-pending-1',
            signerName: 'Marcus Vance',
            signerRole: 'TECHNICIAN',
            meaning: 'SUBMITTED',
            signatureHash: 'c789a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b859',
            signedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
          }
        ],
        referenceStandards: stdKs344 ? [
          {
            id: 'mock-link-3',
            calibrationRecordId: 'cal-pending-1',
            referenceStandardId: stdKs344.id,
            usageNotes: 'Verify standard drift checks.',
            referenceStandard: stdKs344
          }
        ] : []
      },
      {
        id: 'cal-rejected-1',
        instrumentId: 'inst-3',
        calibrationDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        technicianName: 'Marcus Vance',
        asFound: null,
        asLeft: null,
        passFail: false,
        notes: 'Upper range drift was out-of-tolerance.',
        createdAt: new Date().toISOString(),
        status: 'REJECTED',
        submittedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        rejectedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        signatures: [
          {
            id: 'sig-6',
            calibrationRecordId: 'cal-rejected-1',
            signerName: 'Marcus Vance',
            signerRole: 'TECHNICIAN',
            meaning: 'SUBMITTED',
            signatureHash: 'd012a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b860',
            signedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
          },
          {
            id: 'sig-7',
            calibrationRecordId: 'cal-rejected-1',
            signerName: 'Elena QA',
            signerRole: 'QA',
            meaning: 'REJECTED',
            signatureHash: 'e345a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b861',
            signedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
          }
        ],
        referenceStandards: stdKs344 ? [
          {
            id: 'mock-link-4',
            calibrationRecordId: 'cal-rejected-1',
            referenceStandardId: stdKs344.id,
            usageNotes: 'Dry block standard comparison.',
            referenceStandard: stdKs344
          }
        ] : []
      },
      {
        id: 'cal-draft-1',
        instrumentId: 'inst-4',
        calibrationDate: new Date(Date.now() - 3 * 3600000).toISOString(),
        technicianName: 'Marcus Vance',
        asFound: null,
        asLeft: null,
        passFail: true,
        notes: 'Testing in progress, saved as draft.',
        createdAt: new Date().toISOString(),
        status: 'DRAFT',
        referenceStandards: stdBxMc6 ? [
          {
            id: 'mock-link-5',
            calibrationRecordId: 'cal-draft-1',
            referenceStandardId: stdBxMc6.id,
            usageNotes: 'Bench verification setup.',
            referenceStandard: stdBxMc6
          }
        ] : []
      }
    ];

    const mockAudits: AuditEvent[] = [
      {
        id: 'aud-1',
        entityType: 'Instrument',
        entityId: 'inst-1',
        action: 'CREATE',
        oldValue: null,
        newValue: mockInstruments[0],
        changedBy: 'system@caltrack.com',
        timestamp: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
        reason: 'Initial Instrument Registration'
      },
      {
        id: 'aud-2',
        entityType: 'Instrument',
        entityId: 'inst-2',
        action: 'UPDATE',
        oldValue: { status: 'ACTIVE' },
        newValue: { status: 'CALIBRATION_DUE' },
        changedBy: 'scheduler@caltrack.com',
        timestamp: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        reason: 'Automatic status shift based on calibration schedule'
      }
    ];

    const mockWorkOrders = [
      {
        id: 'wo-1',
        workOrderNumber: 'WO-1001',
        instrumentId: 'inst-1',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        assignedTechnician: 'Marcus Vance',
        scheduledDate: new Date(Date.now() - 32 * 24 * 3600000).toISOString(),
        completedDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        description: 'Routine annual calibration check.',
        createdAt: new Date(Date.now() - 32 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
      },
      {
        id: 'wo-2',
        workOrderNumber: 'WO-1002',
        instrumentId: 'inst-2',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedTechnician: 'Elena Rostova',
        scheduledDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        completedDate: null,
        description: 'Drift detected on Honeywell sensor. Calibrate and adjust.',
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      },
      {
        id: 'wo-3',
        workOrderNumber: 'WO-1003',
        instrumentId: 'inst-3',
        status: 'OPEN',
        priority: 'CRITICAL',
        assignedTechnician: null,
        scheduledDate: null,
        completedDate: null,
        description: 'Calibration overdue by >30 days. High priority scheduling.',
        createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
      }
    ];

    localStorage.setItem(MOCK_INSTRUMENTS_KEY, JSON.stringify(mockInstruments));
    localStorage.setItem(MOCK_CALIBRATIONS_KEY, JSON.stringify(mockCalibrations));
    localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(mockAudits));
    localStorage.setItem(MOCK_WORK_ORDERS_KEY, JSON.stringify(mockWorkOrders));
  }
}

// Ensure mock registry has data
initializeMockData();

// Mock Accessors
const getMockInstruments = (): Instrument[] => JSON.parse(localStorage.getItem(MOCK_INSTRUMENTS_KEY) || '[]');
const getMockCalibrations = (): CalibrationRecord[] => JSON.parse(localStorage.getItem(MOCK_CALIBRATIONS_KEY) || '[]');
const getMockAudits = (): AuditEvent[] => JSON.parse(localStorage.getItem(MOCK_AUDIT_KEY) || '[]');
const getMockProcessAreas = (): any[] => JSON.parse(localStorage.getItem(MOCK_PROCESS_AREAS_KEY) || '[]');
const getMockControlLoops = (): any[] => JSON.parse(localStorage.getItem(MOCK_CONTROL_LOOPS_KEY) || '[]');
const getMockWorkOrders = (): any[] => JSON.parse(localStorage.getItem(MOCK_WORK_ORDERS_KEY) || '[]');

const saveMockInstruments = (data: Instrument[]) => localStorage.setItem(MOCK_INSTRUMENTS_KEY, JSON.stringify(data));
const saveMockCalibrations = (data: CalibrationRecord[]) => localStorage.setItem(MOCK_CALIBRATIONS_KEY, JSON.stringify(data));
const saveMockAudits = (data: AuditEvent[]) => localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(data));
const saveMockProcessAreas = (data: any[]) => localStorage.setItem(MOCK_PROCESS_AREAS_KEY, JSON.stringify(data));
const saveMockControlLoops = (data: any[]) => localStorage.setItem(MOCK_CONTROL_LOOPS_KEY, JSON.stringify(data));
const saveMockWorkOrders = (data: any[]) => localStorage.setItem(MOCK_WORK_ORDERS_KEY, JSON.stringify(data));

// Fetch helper with token injection and automatic mock fallback
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token: string | null = null;
  
  if (isSupabaseConfigured && supabase) {
    const sessionRes = await supabase.auth.getSession();
    token = sessionRes.data.session?.access_token || null;
  } else {
    token = localStorage.getItem('caltrack_mock_token');
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(endpoint, config);
    if (!response.ok) {
      const errorMsg = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorMsg.error || 'Network response error');
    }
    return await response.json();
  } catch (error) {
    console.warn(`Backend connection failed for ${endpoint}. Falling back to client-side database simulation.`, error);
    return handleMockRequest<T>(endpoint, options);
  }
}

// Local mock database engine (Client-side simulation)
function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): T {
  const method = options.method || 'GET';
  const url = new URL(endpoint, 'http://localhost');
  const path = url.pathname;
  const userEmail = localStorage.getItem('caltrack_user_email') || 'admin@caltrack.com';

  if (path === '/api/ai/calibration-brief') {
    const body = JSON.parse(options.body as string);
    const instrumentId = body.instrumentId;
    const insts = getMockInstruments();
    const instrument = insts.find(i => i.id === instrumentId);
    if (!instrument) throw new Error('Instrument not found');

    const allCals = getMockCalibrations();
    const calibrationHistory = allCals.filter(c => c.instrumentId === instrumentId);

    const allStandards = getMockReferenceStandards();
    const typeLower = (instrument.instrumentType || '').toLowerCase();
    const signalLower = (instrument.signalType || '').toLowerCase();

    const matchedStandards = allStandards.filter(standard => {
      if (standard.status === "EXPIRED" || standard.status === "OUT_OF_SERVICE") {
        return false;
      }
      const equipmentType = standard.equipmentType.toLowerCase();
      const model = standard.model.toLowerCase();
      const manufacturer = standard.manufacturer.toLowerCase();

      if (
        typeLower.includes("pressure") &&
        (equipmentType.includes("pressure") || model.includes("dpi") || model.includes("cph"))
      ) {
        return true;
      }
      if (
        signalLower.includes("4-20") &&
        (equipmentType.includes("process") || equipmentType.includes("multifunction") || manufacturer.includes("fluke") || manufacturer.includes("beamex"))
      ) {
        return true;
      }
      if (
        typeLower.includes("temperature") &&
        (equipmentType.includes("temperature") || equipmentType.includes("rtd") || equipmentType.includes("thermocouple") || equipmentType.includes("multifunction"))
      ) {
        return true;
      }
      return false;
    });

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

    const checklist = [
      "Verify isolation",
      "Verify zero",
      "Perform 5-point calibration",
      "Record As Found",
      "Record As Left",
      "Verify MPE",
      "Submit for QA Review"
    ];

    let lastCalibrationDate = "Never Calibrated";
    let passFail = "N/A";
    let previousTechnician = "N/A";

    if (calibrationHistory.length > 0) {
      const sortedHistory = [...calibrationHistory].sort(
        (a: any, b: any) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime()
      );
      const lastRecord = sortedHistory[0];
      lastCalibrationDate = new Date(lastRecord.calibrationDate).toLocaleDateString();
      passFail = lastRecord.passFail ? "PASS" : "FAIL";
      previousTechnician = lastRecord.technicianName || "Unknown";
    }

    const formattedStandards = matchedStandards.map((std: any) => {
      const isExpired = std.status === "EXPIRED" || new Date(std.calibrationDueDate).getTime() < Date.now();
      return {
        assetTag: std.assetTag,
        equipmentType: std.equipmentType,
        manufacturer: std.manufacturer,
        model: std.model,
        calibrationDueDate: new Date(std.calibrationDueDate).toLocaleDateString(),
        status: std.status,
        isExpired,
        accuracyClass: std.accuracyClass,
      };
    });

    const recommendations: string[] = [];
    if (instrument.status === "OVERDUE") {
      recommendations.push("🚨 Calibration is OVERDUE. Schedule calibration immediately to prevent measurement drift.");
    } else if (instrument.status === "CALIBRATION_DUE") {
      recommendations.push("⚠️ Calibration is due soon. Schedule verification before the deadline.");
    }
    if (instrument.maxPermissibleError <= 0.25) {
      recommendations.push(`🎯 Precision device (MPE ±${instrument.maxPermissibleError}%): Use high-accuracy standards and minimize environment noise.`);
    }

    const lastCalFailed = calibrationHistory.some((rec: any, idx: number) => idx === 0 && !rec.passFail);
    if (lastCalFailed) {
      recommendations.push("🔍 The last calibration failed. Conduct thorough visual checks and test connections for leakage.");
    }
    if (formattedStandards.length === 0) {
      recommendations.push("🚫 No active reference standards were found matching this instrument category. Check standard inventory.");
    } else {
      const anyExpired = formattedStandards.some(s => s.isExpired);
      if (anyExpired) {
        recommendations.push("🛑 Warning: One or more recommended reference standards are expired. Use only valid active equipment.");
      }
      const anyDueSoon = formattedStandards.some(s => !s.isExpired && (new Date(s.calibrationDueDate).getTime() - Date.now()) < 30 * 24 * 3600000);
      if (anyDueSoon) {
        recommendations.push("⏳ Note: Some recommended reference standards are due for calibration within 30 days.");
      }
    }

    const loops = getMockControlLoops();
    const areas = getMockProcessAreas();
    const loop = loops.find(l => l.id === instrument.controlLoopId);
    const area = areas.find(a => a.id === instrument.processAreaId);

    const processAreaStr = area ? `${area.areaCode} - ${area.name}` : "N/A";
    const controlLoopStr = loop ? `${loop.loopTag} (${loop.loopNumber})` : "N/A";

    const briefing: TechnicianBriefing = {
      instrumentInfo: {
        tagNumber: instrument.tagNumber,
        manufacturer: instrument.manufacturer,
        model: instrument.model,
        instrumentType: instrument.instrumentType,
        range: `${instrument.rangeMin} - ${instrument.rangeMax} ${instrument.engineeringUnits}`,
        signalType: instrument.signalType,
        location: instrument.location,
        processArea: processAreaStr,
        controlLoop: controlLoopStr,
      },
      calibrationHistory: {
        lastCalibrationDate,
        passFail,
        previousTechnician,
        numberOfHistoricalCalibrations: calibrationHistory.length,
      },
      referenceStandards: formattedStandards,
      calibrationChecklist: checklist,
      testPoints,
      recommendations: Array.from(new Set(recommendations)),
    };

    return briefing as any as T;
  }

  if (path.startsWith('/api/ai/calibration-prep/')) {
    const parts = path.split('/');
    const instrumentId = parts[parts.length - 1];
    const insts = getMockInstruments();
    const instrument = insts.find(i => i.id === instrumentId);
    if (!instrument) throw new Error('Instrument not found');

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
    } as any as T;
  }

  if (path === '/api/dashboard') {
    const insts = getMockInstruments();
    const audits = getMockAudits();
    const areas = getMockProcessAreas();
    const loops = getMockControlLoops();
    const wos = getMockWorkOrders();
    const cals = getMockCalibrations();
    const standards = getMockReferenceStandards();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    const standardsDueSoon = standards.filter(std => 
      std.status === 'DUE_SOON' || 
      (std.status === 'ACTIVE' && new Date(std.calibrationDueDate) >= now && new Date(std.calibrationDueDate) <= thirtyDaysFromNow)
    ).length;

    const expiredStandards = standards.filter(std => 
      std.status === 'EXPIRED' || 
      (new Date(std.calibrationDueDate) < now && std.status !== 'OUT_OF_SERVICE')
    ).length;

    return {
      totalInstruments: insts.length,
      calibrationsDue: insts.filter(i => i.status === 'CALIBRATION_DUE').length,
      overdueInstruments: insts.filter(i => i.status === 'OVERDUE').length,
      recentAuditActivity: audits.slice(0, 5),
      totalProcessAreas: areas.length,
      totalControlLoops: loops.length,
      openWorkOrders: wos.filter(w => w.status === 'OPEN').length,
      pendingReviews: cals.filter(c => c.status === 'PENDING_REVIEW').length,
      approvedRecords: cals.filter(c => c.status === 'APPROVED').length,
      rejectedRecords: cals.filter(c => c.status === 'REJECTED').length,
      totalReferenceStandards: standards.length,
      standardsDueSoon,
      expiredStandards,
    } as any as T;
  }

  if (path === '/api/instruments') {
    if (method === 'GET') {
      const insts = getMockInstruments();
      const loops = getMockControlLoops();
      const areas = getMockProcessAreas();
      return insts.map(i => ({
        ...i,
        controlLoop: loops.find(l => l.id === i.controlLoopId),
        processArea: areas.find(a => a.id === i.processAreaId),
      })) as any as T;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body as string) as CreateInstrumentDto;
      const insts = getMockInstruments();
      const interval = body.calibrationIntervalMonths || 12;
      let nextDueDate = body.nextCalibrationDueDate ? new Date(body.nextCalibrationDueDate).toISOString() : null;
      const lastCalDate = body.lastCalibrationDate ? new Date(body.lastCalibrationDate).toISOString() : null;
      if (!nextDueDate && lastCalDate) {
        const d = new Date(lastCalDate);
        d.setMonth(d.getMonth() + interval);
        nextDueDate = d.toISOString();
      }

      const newInstrument: Instrument = {
        ...body,
        id: `inst-${Date.now()}`,
        status: body.status || 'ACTIVE',
        maxPermissibleError: body.maxPermissibleError || 0.5,
        calibrationIntervalMonths: interval,
        lastCalibrationDate: lastCalDate,
        nextCalibrationDueDate: nextDueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      insts.push(newInstrument);
      saveMockInstruments(insts);

      // Audit log
      const audits = getMockAudits();
      audits.unshift({
        id: `aud-${Date.now()}`,
        entityType: 'Instrument',
        entityId: newInstrument.id,
        action: 'CREATE',
        oldValue: null,
        newValue: newInstrument,
        changedBy: userEmail,
        timestamp: new Date().toISOString(),
        reason: 'Initial Instrument Registration',
      });
      saveMockAudits(audits);

      return newInstrument as any as T;
    }
  }

  if (path.startsWith('/api/process-areas')) {
    if (method === 'GET') {
      const areas = getMockProcessAreas();
      const loops = getMockControlLoops();
      return areas.map(a => ({
        ...a,
        controlLoops: loops.filter(l => l.processAreaId === a.id)
      })) as any as T;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body as string);
      const areas = getMockProcessAreas();
      const newArea = {
        ...body,
        id: `area-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      areas.push(newArea);
      saveMockProcessAreas(areas);
      // Audit log
      const audits = getMockAudits();
      audits.unshift({
        id: `aud-${Date.now()}`,
        entityType: 'ProcessArea',
        entityId: newArea.id,
        action: 'CREATE',
        oldValue: null,
        newValue: newArea,
        changedBy: userEmail,
        timestamp: new Date().toISOString(),
        reason: 'Process Area Created',
      });
      saveMockAudits(audits);
      return newArea as any as T;
    }
  }

  if (path.startsWith('/api/control-loops')) {
    const parts = path.split('/');
    if (parts.length > 3 && parts[3] === 'instruments') {
      const loopId = parts[2];
      const insts = getMockInstruments();
      const loops = getMockControlLoops();
      const areas = getMockProcessAreas();
      const matchedInsts = insts.filter(i => i.controlLoopId === loopId);
      return matchedInsts.map(i => ({
        ...i,
        controlLoop: loops.find(l => l.id === i.controlLoopId),
        processArea: areas.find(a => a.id === i.processAreaId),
        calibrations: getMockCalibrations().filter(c => c.instrumentId === i.id),
      })) as any as T;
    } else if (parts.length > 2 && parts[2] !== '') {
      const id = parts[2];
      const loops = getMockControlLoops();
      const areas = getMockProcessAreas();
      const loop = loops.find(l => l.id === id);
      if (!loop) throw new Error('Control Loop not found');
      return {
        ...loop,
        processArea: areas.find(a => a.id === loop.processAreaId)
      } as any as T;
    } else {
      if (method === 'GET') {
        const loops = getMockControlLoops();
        const areas = getMockProcessAreas();
        return loops.map(l => ({
          ...l,
          processArea: areas.find(a => a.id === l.processAreaId)
        })) as any as T;
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body as string);
        const loops = getMockControlLoops();
        const areas = getMockProcessAreas();
        const newLoop = {
          ...body,
          id: `loop-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        loops.push(newLoop);
        saveMockControlLoops(loops);
        // Audit log
        const audits = getMockAudits();
        audits.unshift({
          id: `aud-${Date.now()}`,
          entityType: 'ControlLoop',
          entityId: newLoop.id,
          action: 'CREATE',
          oldValue: null,
          newValue: newLoop,
          changedBy: userEmail,
          timestamp: new Date().toISOString(),
          reason: 'Control Loop Created',
        });
        saveMockAudits(audits);
        return {
          ...newLoop,
          processArea: areas.find(a => a.id === newLoop.processAreaId)
        } as any as T;
      }
    }
  }

  if (path.startsWith('/api/instruments/')) {
    const id = path.split('/').pop();
    const insts = getMockInstruments();
    const recordIdx = insts.findIndex(i => i.id === id);

    if (recordIdx === -1) {
      throw new Error('Instrument not found');
    }

    if (method === 'GET') {
      const inst = insts[recordIdx];
      const calibrations = getMockCalibrations().filter(c => c.instrumentId === id);
      const loops = getMockControlLoops();
      const areas = getMockProcessAreas();
      const workOrders = getMockWorkOrders().filter(w => w.instrumentId === id);
      return {
        ...inst,
        calibrations,
        controlLoop: loops.find(l => l.id === inst.controlLoopId),
        processArea: areas.find(a => a.id === inst.processAreaId),
        workOrders,
      } as any as T;
    }

    if (method === 'PUT') {
      const body = JSON.parse(options.body as string) as UpdateInstrumentDto;
      const inst = insts[recordIdx];
      const interval = body.calibrationIntervalMonths !== undefined 
        ? body.calibrationIntervalMonths 
        : inst.calibrationIntervalMonths;
      const lastCal = body.lastCalibrationDate !== undefined 
        ? body.lastCalibrationDate 
        : inst.lastCalibrationDate;

      let nextCal: string | null = null;
      if (body.nextCalibrationDueDate !== undefined) {
        nextCal = body.nextCalibrationDueDate ? new Date(body.nextCalibrationDueDate).toISOString() : null;
      } else if (body.calibrationIntervalMonths !== undefined || body.lastCalibrationDate !== undefined) {
        if (lastCal) {
          const d = new Date(lastCal);
          d.setMonth(d.getMonth() + interval);
          nextCal = d.toISOString();
        }
      }

      const updatedInstrument = {
        ...inst,
        ...body,
        lastCalibrationDate: body.lastCalibrationDate !== undefined 
          ? (body.lastCalibrationDate ? new Date(body.lastCalibrationDate).toISOString() : null)
          : inst.lastCalibrationDate,
        updatedAt: new Date().toISOString(),
      };
      if (nextCal !== null || body.nextCalibrationDueDate === null) {
        updatedInstrument.nextCalibrationDueDate = nextCal;
      }
      
      // Calculate field changes for detailed audit trails
      const changedKeys: Record<string, any> = {};
      const originalKeys: Record<string, any> = {};
      
      for (const k of Object.keys(body)) {
        if (k === 'reason') continue;
        const key = k as keyof Instrument;
        if (JSON.stringify(inst[key]) !== JSON.stringify(body[k as keyof UpdateInstrumentDto])) {
          changedKeys[k] = body[k as keyof UpdateInstrumentDto];
          originalKeys[k] = inst[key];
        }
      }

      insts[recordIdx] = updatedInstrument as any;
      saveMockInstruments(insts);

      if (Object.keys(changedKeys).length > 0) {
        const audits = getMockAudits();
        audits.unshift({
          id: `aud-${Date.now()}`,
          entityType: 'Instrument',
          entityId: inst.id,
          action: 'UPDATE',
          oldValue: originalKeys,
          newValue: changedKeys,
          changedBy: userEmail,
          timestamp: new Date().toISOString(),
          reason: body.reason || 'Instrument details modified',
        });
        saveMockAudits(audits);
      }

      return updatedInstrument as any as T;
    }

    if (method === 'DELETE') {
      const reason = url.searchParams.get('reason') || 'Instrument decommissioned';
      const inst = insts[recordIdx];
      insts.splice(recordIdx, 1);
      saveMockInstruments(insts);

      const audits = getMockAudits();
      audits.unshift({
        id: `aud-${Date.now()}`,
        entityType: 'Instrument',
        entityId: id!,
        action: 'DELETE',
        oldValue: inst,
        newValue: null,
        changedBy: userEmail,
        timestamp: new Date().toISOString(),
        reason,
      });
      saveMockAudits(audits);

      return { message: 'Instrument deleted successfully' } as any as T;
    }
  }

  if (path.startsWith('/api/calibrations')) {
    const parts = path.split('/');
    if (parts.length === 3 && parts[2] === 'calibrations') {
      if (method === 'GET') {
        const cals = getMockCalibrations();
        const insts = getMockInstruments();
        const status = url.searchParams.get('status');
        const instrumentId = url.searchParams.get('instrumentId');
        
        let filtered = cals;
        if (status) {
          filtered = filtered.filter(c => c.status === status);
        }
        if (instrumentId) {
          filtered = filtered.filter(c => c.instrumentId === instrumentId);
        }
        
        return filtered.map(c => ({
          ...c,
          instrument: insts.find(i => i.id === c.instrumentId),
        })) as any as T;
      }
      
      if (method === 'POST') {
        const body = JSON.parse(options.body as string) as CreateCalibrationRecordDto;
        const insts = getMockInstruments();
        const inst = insts.find(i => i.id === body.instrumentId);
        if (!inst) {
          throw new Error('Instrument not found');
        }

        const cals = getMockCalibrations();
        const outputSpan = inst.signalType === '4-20 mA' ? 16 : inst.rangeMax - inst.rangeMin;
        const maxError = inst.maxPermissibleError || 0.5;
        let overallPass = true;

        const calId = `cal-${Date.now()}`;
        const testPoints = body.testPoints.map((pt, index) => {
          const span = inst.rangeMax - inst.rangeMin;
          const percentDecimal = span === 0 ? 0 : (pt.targetInput - inst.rangeMin) / span;
          
          const expectedOutput = inst.signalType === '4-20 mA' 
            ? 4 + 16 * percentDecimal 
            : pt.targetInput;

          const asFoundError = outputSpan === 0 ? 0 : ((pt.asFoundOutput - expectedOutput) / outputSpan) * 100;
          const asLeftError = outputSpan === 0 ? 0 : ((pt.asLeftOutput - expectedOutput) / outputSpan) * 100;
          
          const pointPass = Math.abs(asLeftError) <= maxError;
          if (!pointPass) {
            overallPass = false;
          }

          return {
            id: `pt-${Date.now()}-${index}`,
            calibrationRecordId: calId,
            targetInput: pt.targetInput,
            expectedOutput,
            asFoundOutput: pt.asFoundOutput,
            asLeftOutput: pt.asLeftOutput,
            asFoundError,
            asLeftError,
            passFail: pointPass,
          };
        });

        const referenceStandards = body.referenceStandards ? body.referenceStandards.map((rs, index) => {
          const stds = getMockReferenceStandards();
          const targetStd = stds.find(s => s.id === rs.referenceStandardId || s.assetTag === rs.referenceStandardId);
          return {
            id: `mock-link-${Date.now()}-${index}`,
            calibrationRecordId: calId,
            referenceStandardId: targetStd?.id || rs.referenceStandardId,
            usageNotes: rs.usageNotes || null,
            referenceStandard: targetStd,
          };
        }) : [];

        const newCalibration: CalibrationRecord = {
          id: calId,
          instrumentId: body.instrumentId,
          calibrationDate: new Date(body.calibrationDate).toISOString(),
          technicianName: body.technicianName,
          passFail: overallPass,
          notes: body.notes || '',
          createdAt: new Date().toISOString(),
          status: 'DRAFT',
          testPoints,
          signatures: [],
          referenceStandards,
        };

        cals.unshift(newCalibration);
        saveMockCalibrations(cals);

        const audits = getMockAudits();
        audits.unshift({
          id: `aud-${Date.now()}`,
          entityType: 'CalibrationRecord',
          entityId: newCalibration.id,
          action: 'CREATE',
          oldValue: null,
          newValue: newCalibration,
          changedBy: userEmail,
          timestamp: new Date().toISOString(),
          reason: 'Calibration Record Created (DRAFT)',
        });

        if (body.referenceStandards && body.referenceStandards.length > 0) {
          body.referenceStandards.forEach((rs, index) => {
            const stds = getMockReferenceStandards();
            const targetStd = stds.find(s => s.id === rs.referenceStandardId || s.assetTag === rs.referenceStandardId);
            audits.unshift({
              id: `aud-link-${Date.now()}-${index}`,
              entityType: 'CalibrationRecord',
              entityId: calId,
              action: 'LINK_REFERENCE_STANDARD',
              oldValue: null,
              newValue: { referenceStandardId: targetStd?.id || rs.referenceStandardId, usageNotes: rs.usageNotes, assetTag: targetStd?.assetTag, manufacturer: targetStd?.manufacturer, model: targetStd?.model },
              changedBy: userEmail,
              timestamp: new Date().toISOString(),
              reason: `Linked reference standard ${targetStd?.assetTag || 'unknown'} to calibration record`,
            });
          });
        }
        saveMockAudits(audits);

        return newCalibration as any as T;
      }
    } else if (parts.length >= 4) {
      const id = parts[3];
      const cals = getMockCalibrations();
      const insts = getMockInstruments();
      const calIdx = cals.findIndex(c => c.id === id);
      
      if (calIdx === -1) {
        throw new Error('Calibration record not found');
      }
      
      const record = cals[calIdx];

      if (parts.length === 4) {
        if (method === 'GET') {
          return {
            ...record,
            instrument: insts.find(i => i.id === record.instrumentId),
          } as any as T;
        }
        
        if (method === 'PUT') {
          if (record.status === 'APPROVED') {
            throw new Error('Compliance record is approved and locked. Modifications are prohibited.');
          }
          const body = JSON.parse(options.body as string);
          const updatedRecord = {
            ...record,
            ...body,
            updatedAt: new Date().toISOString(),
          };
          cals[calIdx] = updatedRecord;
          saveMockCalibrations(cals);
          return updatedRecord as any as T;
        }

        if (method === 'DELETE') {
          if (record.status === 'APPROVED') {
            throw new Error('Compliance record is approved and locked. Modifications are prohibited.');
          }
          cals.splice(calIdx, 1);
          saveMockCalibrations(cals);
          return { message: 'Calibration record deleted successfully' } as any as T;
        }
      }

      if (parts.length === 5) {
        const subRoute = parts[4];
        const signedAt = new Date().toISOString();

        if (subRoute === 'submit') {
          if (record.referenceStandards && record.referenceStandards.length > 0) {
            const now = new Date();
            for (const rs of record.referenceStandards) {
              const std = rs.referenceStandard;
              if (std) {
                const isPastDue = new Date(std.calibrationDueDate) < now;
                if (std.status === 'EXPIRED' || std.status === 'OUT_OF_SERVICE' || isPastDue) {
                  const reason = std.status === 'OUT_OF_SERVICE' ? 'is out of service' : 'is expired';
                  throw new Error(
                    `Metrology Traceability Violation: Reference standard '${std.manufacturer} ${std.model}' (Tag: ${std.assetTag}) ${reason} and cannot be used for compliance calibrations.`
                  );
                }
              }
            }
          }
          const { signerName, signerRole } = JSON.parse(options.body as string);
          const signatureHash = mockSha256(`${id}:${signerName}:${signerRole}:${signedAt}:PENDING_REVIEW`);
          
          record.status = 'PENDING_REVIEW';
          record.submittedAt = signedAt;
          record.signatures = record.signatures || [];
          record.signatures.push({
            id: `sig-${Date.now()}`,
            calibrationRecordId: id,
            signerName,
            signerRole,
            meaning: 'SUBMITTED',
            signatureHash,
            signedAt,
          });
          
          cals[calIdx] = record;
          saveMockCalibrations(cals);

          const audits = getMockAudits();
          audits.unshift({
            id: `aud-${Date.now()}`,
            entityType: 'CalibrationRecord',
            entityId: id,
            action: 'SUBMIT_CALIBRATION',
            oldValue: { status: 'DRAFT' },
            newValue: { status: 'PENDING_REVIEW', submittedAt: signedAt },
            changedBy: userEmail,
            timestamp: new Date().toISOString(),
            reason: `Calibration record submitted for compliance review by ${signerName} (${signerRole})`,
          });
          saveMockAudits(audits);

          return record as any as T;
        }

        if (subRoute === 'approve') {
          if (record.status === 'APPROVED') {
            throw new Error('Calibration record is already approved');
          }
          const { signerName, signerRole } = JSON.parse(options.body as string);
          const signatureHash = mockSha256(`${id}:${signerName}:${signerRole}:${signedAt}:APPROVED`);
          
          const oldStatus = record.status;
          record.status = 'APPROVED';
          record.approvedAt = signedAt;
          record.signatures = record.signatures || [];
          record.signatures.push({
            id: `sig-${Date.now()}`,
            calibrationRecordId: id,
            signerName,
            signerRole,
            meaning: 'APPROVED',
            signatureHash,
            signedAt,
          });
          
          cals[calIdx] = record;
          saveMockCalibrations(cals);

          const instIdx = insts.findIndex(i => i.id === record.instrumentId);
          if (instIdx !== -1) {
            const instrument = insts[instIdx];
            const nextStatus = record.passFail ? 'ACTIVE' : 'CALIBRATION_DUE';
            const calibrationDate = new Date(record.calibrationDate);
            const nextCalibrationDueDate = new Date(calibrationDate);
            nextCalibrationDueDate.setMonth(nextCalibrationDueDate.getMonth() + (instrument.calibrationIntervalMonths || 12));

            insts[instIdx].status = nextStatus;
            insts[instIdx].lastCalibrationDate = calibrationDate.toISOString();
            insts[instIdx].nextCalibrationDueDate = nextCalibrationDueDate.toISOString();
            saveMockInstruments(insts);

            const wos = getMockWorkOrders();
            let woChanged = false;
            wos.forEach((wo) => {
              if (wo.instrumentId === record.instrumentId && (wo.status === 'OPEN' || wo.status === 'IN_PROGRESS')) {
                const oldWoStatus = wo.status;
                wo.status = 'COMPLETED';
                wo.completedDate = new Date().toISOString();
                wo.updatedAt = new Date().toISOString();
                woChanged = true;

                const auditsList = getMockAudits();
                auditsList.unshift({
                  id: `aud-${Date.now()}-${wo.id}`,
                  entityType: 'WorkOrder',
                  entityId: wo.id,
                  action: 'UPDATE',
                  oldValue: { status: oldWoStatus },
                  newValue: { status: 'COMPLETED', completedDate: wo.completedDate },
                  changedBy: userEmail,
                  timestamp: new Date().toISOString(),
                  reason: 'Automatically completed upon calibration compliance approval',
                });
                saveMockAudits(auditsList);
              }
            });
            if (woChanged) {
              saveMockWorkOrders(wos);
            }
          }

          const audits = getMockAudits();
          audits.unshift({
            id: `aud-${Date.now()}`,
            entityType: 'CalibrationRecord',
            entityId: id,
            action: 'APPROVE_CALIBRATION',
            oldValue: { status: oldStatus },
            newValue: { status: 'APPROVED', approvedAt: signedAt },
            changedBy: userEmail,
            timestamp: new Date().toISOString(),
            reason: `Calibration record approved by ${signerName} (${signerRole})`,
          });
          saveMockAudits(audits);

          return record as any as T;
        }

        if (subRoute === 'reject') {
          if (record.status === 'APPROVED') {
            throw new Error('Approved compliance records cannot be rejected');
          }
          const { signerName, signerRole, reason } = JSON.parse(options.body as string);
          const signatureHash = mockSha256(`${id}:${signerName}:${signerRole}:${signedAt}:REJECTED`);
          
          const oldStatus = record.status;
          record.status = 'REJECTED';
          record.rejectedAt = signedAt;
          record.signatures = record.signatures || [];
          record.signatures.push({
            id: `sig-${Date.now()}`,
            calibrationRecordId: id,
            signerName,
            signerRole,
            meaning: 'REJECTED',
            signatureHash,
            signedAt,
          });
          
          cals[calIdx] = record;
          saveMockCalibrations(cals);

          const audits = getMockAudits();
          audits.unshift({
            id: `aud-${Date.now()}`,
            entityType: 'CalibrationRecord',
            entityId: id,
            action: 'REJECT_CALIBRATION',
            oldValue: { status: oldStatus },
            newValue: { status: 'REJECTED', rejectedAt: signedAt },
            changedBy: userEmail,
            timestamp: new Date().toISOString(),
            reason: `Calibration record rejected by ${signerName} (${signerRole}). Reason: ${reason}`,
          });
          saveMockAudits(audits);

          return record as any as T;
        }
      }
    }
  }

  if (path === '/api/audit') {
    if (method === 'GET') {
      return getMockAudits() as any as T;
    }
  }

  if (path.startsWith('/api/work-orders')) {
    const parts = path.split('/');
    if (parts.length > 2 && parts[2] === 'generate') {
      if (method === 'POST') {
        const insts = getMockInstruments();
        const wos = getMockWorkOrders();
        let generatedCount = 0;
        
        for (const inst of insts) {
          if (inst.status === 'CALIBRATION_DUE' || inst.status === 'OVERDUE') {
            const hasActive = wos.some(w => w.instrumentId === inst.id && (w.status === 'OPEN' || w.status === 'IN_PROGRESS'));
            if (!hasActive) {
              let nextNum = 1001;
              if (wos.length > 0) {
                const nums = wos.map(w => {
                  const match = w.workOrderNumber.match(/WO-(\d+)/);
                  return match ? parseInt(match[1]) : 1000;
                });
                nextNum = Math.max(...nums) + 1;
              }
              const workOrderNumber = `WO-${nextNum}`;
              const priority = inst.status === 'OVERDUE' ? 'HIGH' : 'MEDIUM';
              
              const newWo = {
                id: `wo-${Date.now()}-${generatedCount}`,
                workOrderNumber,
                instrumentId: inst.id,
                status: 'OPEN',
                priority,
                assignedTechnician: null,
                scheduledDate: null,
                completedDate: null,
                description: `Automated maintenance work order generated due to compliance status: ${inst.status.replace('_', ' ')}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              wos.unshift(newWo);
              
              const auditsList = getMockAudits();
              auditsList.unshift({
                id: `aud-${Date.now()}-${generatedCount}`,
                entityType: 'WorkOrder',
                entityId: newWo.id,
                action: 'CREATE',
                oldValue: null,
                newValue: newWo,
                changedBy: userEmail,
                timestamp: new Date().toISOString(),
                reason: 'System auto-generated for compliance matching',
              });
              saveMockAudits(auditsList);
              
              generatedCount++;
            }
          }
        }
        if (generatedCount > 0) {
          saveMockWorkOrders(wos);
        }
        return { generatedCount } as any as T;
      }
    } else if (parts.length > 2 && parts[2] !== '') {
      const id = parts[2];
      const wos = getMockWorkOrders();
      const idx = wos.findIndex(w => w.id === id);
      if (idx === -1) throw new Error('Work Order not found');

      if (method === 'PATCH') {
        const oldWo = wos[idx];
        const body = JSON.parse(options.body as string);
        const { reason, ...updateData } = body;
        
        const updatedWo = {
          ...oldWo,
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
        
        if (updateData.status === 'COMPLETED' && !updatedWo.completedDate) {
          updatedWo.completedDate = new Date().toISOString();
        }
        
        wos[idx] = updatedWo;
        saveMockWorkOrders(wos);
        
        const changedKeys: Record<string, any> = {};
        const originalKeys: Record<string, any> = {};
        for (const k of Object.keys(updateData)) {
          if (JSON.stringify(oldWo[k as keyof typeof oldWo]) !== JSON.stringify(updateData[k])) {
            changedKeys[k] = updateData[k];
            originalKeys[k] = oldWo[k as keyof typeof oldWo];
          }
        }
        if (Object.keys(changedKeys).length > 0) {
          const auditsList = getMockAudits();
          auditsList.unshift({
            id: `aud-${Date.now()}`,
            entityType: 'WorkOrder',
            entityId: id,
            action: 'UPDATE',
            oldValue: originalKeys,
            newValue: changedKeys,
            changedBy: userEmail,
            timestamp: new Date().toISOString(),
            reason: reason || 'Work order details updated',
          });
          saveMockAudits(auditsList);
        }
        
        const insts = getMockInstruments();
        return {
          ...updatedWo,
          instrument: insts.find(i => i.id === updatedWo.instrumentId),
        } as any as T;
      }
    } else {
      if (method === 'GET') {
        const wos = getMockWorkOrders();
        const insts = getMockInstruments();
        return wos.map(w => ({
          ...w,
          instrument: insts.find(i => i.id === w.instrumentId),
        })) as any as T;
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body as string);
        const wos = getMockWorkOrders();
        
        let nextNum = 1001;
        if (wos.length > 0) {
          const nums = wos.map(w => {
            const match = w.workOrderNumber.match(/WO-(\d+)/);
            return match ? parseInt(match[1]) : 1000;
          });
          nextNum = Math.max(...nums) + 1;
        }
        const workOrderNumber = `WO-${nextNum}`;
        
        const newWo = {
          ...body,
          id: `wo-${Date.now()}`,
          workOrderNumber,
          status: body.status || 'OPEN',
          priority: body.priority || 'MEDIUM',
          assignedTechnician: body.assignedTechnician || null,
          scheduledDate: body.scheduledDate ? new Date(body.scheduledDate).toISOString() : null,
          completedDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        wos.unshift(newWo);
        saveMockWorkOrders(wos);
        
        const auditsList = getMockAudits();
        auditsList.unshift({
          id: `aud-${Date.now()}`,
          entityType: 'WorkOrder',
          entityId: newWo.id,
          action: 'CREATE',
          oldValue: null,
          newValue: newWo,
          changedBy: userEmail,
          timestamp: new Date().toISOString(),
          reason: 'Work Order Created',
        });
        saveMockAudits(auditsList);
        
        const insts = getMockInstruments();
        return {
          ...newWo,
          instrument: insts.find(i => i.id === newWo.instrumentId),
        } as any as T;
      }
    }
  }

  if (path.startsWith('/api/reference-standards')) {
    const parts = path.split('/');
    if (parts.length === 3 && parts[2] === 'reference-standards') {
      if (method === 'GET') {
        return getMockReferenceStandards() as any as T;
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body as string) as CreateReferenceStandardDto;
        const standards = getMockReferenceStandards();
        const newStandard = {
          ...body,
          id: `std-${Date.now()}`,
          status: body.status || 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        standards.push(newStandard);
        saveMockReferenceStandards(standards);

        // Audit log
        const audits = getMockAudits();
        audits.unshift({
          id: `aud-${Date.now()}`,
          entityType: 'ReferenceStandard',
          entityId: newStandard.id,
          action: 'CREATE',
          oldValue: null,
          newValue: newStandard,
          changedBy: userEmail,
          timestamp: new Date().toISOString(),
          reason: 'Initial Reference Standard Registration',
        });
        saveMockAudits(audits);

        return newStandard as any as T;
      }
    } else if (parts.length === 4) {
      const id = parts[3];
      const standards = getMockReferenceStandards();
      const idx = standards.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Reference standard not found');

      if (method === 'GET') {
        return standards[idx] as any as T;
      }
      if (method === 'PUT') {
        const body = JSON.parse(options.body as string);
        const oldStandard = standards[idx];
        const updatedStandard = {
          ...oldStandard,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        standards[idx] = updatedStandard;
        saveMockReferenceStandards(standards);

        const changedKeys: Record<string, any> = {};
        const originalKeys: Record<string, any> = {};
        for (const k of Object.keys(body)) {
          if (k === 'reason') continue;
          if (JSON.stringify(oldStandard[k]) !== JSON.stringify(body[k])) {
            changedKeys[k] = body[k];
            originalKeys[k] = oldStandard[k];
          }
        }
        if (Object.keys(changedKeys).length > 0) {
          const audits = getMockAudits();
          audits.unshift({
            id: `aud-${Date.now()}`,
            entityType: 'ReferenceStandard',
            entityId: id,
            action: 'UPDATE',
            oldValue: originalKeys,
            newValue: changedKeys,
            changedBy: userEmail,
            timestamp: new Date().toISOString(),
            reason: body.reason || 'Reference standard details modified',
          });
          saveMockAudits(audits);
        }

        return updatedStandard as any as T;
      }
    }
  }

  throw new Error(`Endpoint path ${path} not mock simulated.`);
}

// API functions mapping
export const api = {
  getDashboardStats: () => request<DashboardStats>('/api/dashboard'),
  getInstruments: () => request<Instrument[]>('/api/instruments'),
  getInstrument: (id: string) => request<Instrument & { calibrations: CalibrationRecord[] }>(`/api/instruments/${id}`),
  createInstrument: (dto: CreateInstrumentDto) => request<Instrument>('/api/instruments', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  updateInstrument: (id: string, dto: UpdateInstrumentDto) => request<Instrument>(`/api/instruments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  }),
  deleteInstrument: (id: string, reason: string) => request<{ message: string }>(`/api/instruments/${id}?reason=${encodeURIComponent(reason)}`, {
    method: 'DELETE',
  }),
  addCalibrationRecord: (dto: CreateCalibrationRecordDto) => request<CalibrationRecord>('/api/calibrations', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  getCalibrations: (status?: string, instrumentId?: string) => request<CalibrationRecord[]>(`/api/calibrations?status=${status || ''}&instrumentId=${instrumentId || ''}`),
  getCalibration: (id: string) => request<CalibrationRecord>(`/api/calibrations/${id}`),
  submitCalibration: (id: string, signerName: string, signerRole: string) => request<CalibrationRecord>(`/api/calibrations/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ signerName, signerRole }),
  }),
  approveCalibration: (id: string, signerName: string, signerRole: string) => request<CalibrationRecord>(`/api/calibrations/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ signerName, signerRole }),
  }),
  rejectCalibration: (id: string, signerName: string, signerRole: string, reason: string) => request<CalibrationRecord>(`/api/calibrations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ signerName, signerRole, reason }),
  }),
  getAuditTrail: () => request<AuditEvent[]>('/api/audit'),
  getProcessAreas: () => request<ProcessArea[]>('/api/process-areas'),
  createProcessArea: (dto: CreateProcessAreaDto) => request<ProcessArea>('/api/process-areas', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  getControlLoops: () => request<ControlLoop[]>('/api/control-loops'),
  getControlLoop: (id: string) => request<ControlLoop>(`/api/control-loops/${id}`),
  createControlLoop: (dto: CreateControlLoopDto) => request<ControlLoop>('/api/control-loops', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  getLoopInstruments: (id: string) => request<Instrument[]>(`/api/control-loops/${id}/instruments`),
  getWorkOrders: () => request<WorkOrder[]>('/api/work-orders'),
  createWorkOrder: (dto: CreateWorkOrderDto) => request<WorkOrder>('/api/work-orders', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  updateWorkOrder: (id: string, dto: UpdateWorkOrderDto) => request<WorkOrder>(`/api/work-orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  }),
  generateWorkOrders: () => request<{ generatedCount: number }>('/api/work-orders/generate', {
    method: 'POST',
  }),
  getReferenceStandards: () => request<ReferenceStandard[]>('/api/reference-standards'),
  getReferenceStandard: (id: string) => request<ReferenceStandard>(`/api/reference-standards/${id}`),
  createReferenceStandard: (dto: CreateReferenceStandardDto) => request<ReferenceStandard>('/api/reference-standards', {
    method: 'POST',
    body: JSON.stringify(dto),
  }),
  updateReferenceStandard: (id: string, dto: UpdateReferenceStandardDto) => request<ReferenceStandard>(`/api/reference-standards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  }),
  generateCalibrationPrep: (id: string) => request<CalibrationPrepGuidance>(`/api/ai/calibration-prep/${id}`, {
    method: 'POST',
  }),
  getCalibrationBrief: (instrumentId: string) => request<TechnicianBriefing>('/api/ai/calibration-brief', {
    method: 'POST',
    body: JSON.stringify({ instrumentId }),
  }),
};
export default api;
