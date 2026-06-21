import { GetCalibrationHistoryTool } from "../tools/get-calibration-history.tool";
import { GetInstrumentTool } from "../tools/get-instrument.tool";
import { SearchReferenceStandardTool } from "../tools/search-reference-standard.tool";
import { SearchDocumentationTool } from "../tools/search-documentation.tool";
import { AgentRegistry } from "./registry";
import { ToolRegistry } from "./tool-registry";


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

  constructor() {
    this.agents = new AgentRegistry();
    this.tools = new ToolRegistry();
  }

  initialize(): void {
    // 1. Register Tools
    this.tools.register(new GetInstrumentTool());
    this.tools.register(new GetCalibrationHistoryTool());
    this.tools.register(new SearchReferenceStandardTool());
    this.tools.register(new SearchDocumentationTool());

    // 2. Register Subagents
    this.agents.register(new CalibrationAgent());
    this.agents.register(new DocumentationAgent(this.tools));
    this.agents.register(new MetrologyAgent());
    this.agents.register(new PlanningAgent());
    this.agents.register(new QAAgent());
    this.agents.register(new ReportingAgent());

    // 3. Register Supervisor Agent (passes registries for coordination)
    this.agents.register(new SupervisorAgent(this.agents, this.tools));

    console.log("🚀 CalTrack AI Engine initialized.");
  }
}