export interface AIContext {
  userId?: string;

  sessionId?: string;

  timestamp: Date;

  currentInstrument?: string;

  currentWorkOrder?: string;

  metadata?: Record<string, unknown>;
}