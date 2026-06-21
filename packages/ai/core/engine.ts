import { GetCalibrationHistoryTool } from "../tools/get-calibration-history.tool";
import { GetInstrumentTool } from "../tools/get-instrument.tool";
import { SearchReferenceStandardTool } from "../tools/search-reference-standard.tool";
import { AgentRegistry } from "./registry";
import { ToolRegistry } from "./tool-registry";

export class AIEngine {
  readonly agents: AgentRegistry;
  readonly tools: ToolRegistry;

  constructor() {
    this.agents = new AgentRegistry();
    this.tools = new ToolRegistry();
  }

  initialize(): void {
    this.tools.register(new GetInstrumentTool());
    this.tools.register(new GetCalibrationHistoryTool());
    this.tools.register(new SearchReferenceStandardTool());

    console.log("🚀 CalTrack AI Engine initialized.");
  }
}