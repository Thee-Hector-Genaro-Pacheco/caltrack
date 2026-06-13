import { isSupabaseConfigured, supabase } from './supabase';
import { Instrument, CalibrationRecord, AuditEvent, DashboardStats, CreateInstrumentDto, UpdateInstrumentDto, CreateCalibrationRecordDto, ProcessArea, CreateProcessAreaDto, ControlLoop, CreateControlLoopDto } from '@caltrack/types';

// Mock local storage keys
const MOCK_INSTRUMENTS_KEY = 'caltrack_mock_instruments';
const MOCK_CALIBRATIONS_KEY = 'caltrack_mock_calibrations';
const MOCK_AUDIT_KEY = 'caltrack_mock_audits';
const MOCK_PROCESS_AREAS_KEY = 'caltrack_mock_process_areas';
const MOCK_CONTROL_LOOPS_KEY = 'caltrack_mock_control_loops';

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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

    localStorage.setItem(MOCK_INSTRUMENTS_KEY, JSON.stringify(mockInstruments));
    localStorage.setItem(MOCK_CALIBRATIONS_KEY, JSON.stringify(mockCalibrations));
    localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(mockAudits));
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

const saveMockInstruments = (data: Instrument[]) => localStorage.setItem(MOCK_INSTRUMENTS_KEY, JSON.stringify(data));
const saveMockCalibrations = (data: CalibrationRecord[]) => localStorage.setItem(MOCK_CALIBRATIONS_KEY, JSON.stringify(data));
const saveMockAudits = (data: AuditEvent[]) => localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(data));
const saveMockProcessAreas = (data: any[]) => localStorage.setItem(MOCK_PROCESS_AREAS_KEY, JSON.stringify(data));
const saveMockControlLoops = (data: any[]) => localStorage.setItem(MOCK_CONTROL_LOOPS_KEY, JSON.stringify(data));

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

  if (path === '/api/dashboard') {
    const insts = getMockInstruments();
    const audits = getMockAudits();
    const areas = getMockProcessAreas();
    const loops = getMockControlLoops();
    return {
      totalInstruments: insts.length,
      calibrationsDue: insts.filter(i => i.status === 'CALIBRATION_DUE').length,
      overdueInstruments: insts.filter(i => i.status === 'OVERDUE').length,
      recentAuditActivity: audits.slice(0, 5),
      totalProcessAreas: areas.length,
      totalControlLoops: loops.length,
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
      const newInstrument: Instrument = {
        ...body,
        id: `inst-${Date.now()}`,
        status: body.status || 'ACTIVE',
        maxPermissibleError: body.maxPermissibleError || 0.5,
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
      return {
        ...inst,
        calibrations,
        controlLoop: loops.find(l => l.id === inst.controlLoopId),
        processArea: areas.find(a => a.id === inst.processAreaId),
      } as any as T;
    }

    if (method === 'PUT') {
      const body = JSON.parse(options.body as string) as UpdateInstrumentDto;
      const inst = insts[recordIdx];
      const updatedInstrument = {
        ...inst,
        ...body,
        updatedAt: new Date().toISOString(),
      };
      
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

  if (path === '/api/calibrations') {
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
          calibrationRecordId: `cal-${Date.now()}`,
          targetInput: pt.targetInput,
          expectedOutput,
          asFoundOutput: pt.asFoundOutput,
          asLeftOutput: pt.asLeftOutput,
          asFoundError,
          asLeftError,
          passFail: pointPass,
        };
      });

      const newCalibration: CalibrationRecord = {
        id: `cal-${Date.now()}`,
        instrumentId: body.instrumentId,
        calibrationDate: new Date(body.calibrationDate).toISOString(),
        technicianName: body.technicianName,
        passFail: overallPass,
        notes: body.notes || '',
        createdAt: new Date().toISOString(),
        testPoints,
      };

      cals.push(newCalibration);
      saveMockCalibrations(cals);

      const instIdx = insts.findIndex(i => i.id === body.instrumentId);
      if (instIdx !== -1) {
        insts[instIdx].status = overallPass ? 'ACTIVE' : 'CALIBRATION_DUE';
        saveMockInstruments(insts);
      }

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
        reason: 'Calibration Record Created',
      });
      saveMockAudits(audits);

      return newCalibration as any as T;
    }
  }

  if (path === '/api/audit') {
    if (method === 'GET') {
      return getMockAudits() as any as T;
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
};
export default api;
