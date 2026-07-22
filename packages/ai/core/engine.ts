import { AgentRegistry } from "./registry";
import { ToolRegistry } from "./tool-registry";
import { Tool } from "../types/tool";

import { SupervisorAgent } from "../agents/supervisor";
import { CalibrationAgent } from "../agents/calibration";
import { DocumentationAgent } from "../agents/documentation";
import { MetrologyAgent } from "../agents/metrology";
import { PlanningAgent } from "../agents/planning";
import { QAAgent } from "../agents/qa";
import { ReportingAgent } from "../agents/reporting";

export class AIEngine {
  readonly agents: AgentRegistry;
  readonly tools: ToolRegistry;

  private readonly externalTools: Tool[];

  constructor(externalTools: Tool[] = []) {
    this.agents = new AgentRegistry();
    this.tools = new ToolRegistry();
    this.externalTools = externalTools;
  }

  initialize(): void {
    // Database-backed tools are supplied by the API layer.
    for (const tool of this.externalTools) {
      this.tools.register(tool);
    }

    // Register subagents.
    this.agents.register(new CalibrationAgent());
    this.agents.register(new DocumentationAgent(this.tools));
    this.agents.register(new MetrologyAgent());
    this.agents.register(new PlanningAgent());
    this.agents.register(new QAAgent());
    this.agents.register(new ReportingAgent());

    // Register supervisor agent.
    this.agents.register(new SupervisorAgent(this.agents, this.tools));

    console.log("🚀 CalTrack AI Engine initialized.");
  }
}
