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
    console.log("🚀 CalTrack AI Engine initialized.");
  }

}