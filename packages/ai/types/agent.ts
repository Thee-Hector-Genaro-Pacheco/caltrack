/**
 * Every AI agent in CalTrack implements this interface.
 * The Supervisor interacts with agents through this contract,
 * allowing implementations to change without affecting orchestration.
 */

export interface AgentRequest {
  goal: string;
  context?: Record<string, unknown>;
}

export interface AgentResponse {
  success: boolean;
  agent: string;
  summary: string;
  data?: Record<string, unknown>;
  recommendations?: string[];
}

export interface Agent {
  readonly name: string;
  readonly description: string;

  execute(request: AgentRequest): Promise<AgentResponse>;
}