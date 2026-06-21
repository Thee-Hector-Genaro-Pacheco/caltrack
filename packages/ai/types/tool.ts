/**
 * A Tool is an executable capability available to AI agents.
 *
 * Tools encapsulate deterministic business logic and provide
 * controlled access to CalTrack services.
 */

export interface ToolRequest {
  input?: Record<string, unknown>;
}

export interface ToolResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface Tool {
  readonly name: string;
  readonly description: string;

  execute(request: ToolRequest): Promise<ToolResponse>;
}