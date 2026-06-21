import { Agent, AgentRequest, AgentResponse } from "../types/agent";
import { AgentRegistry } from "../core/registry";

export class SupervisorAgent implements Agent {
  readonly name = "supervisor";
  readonly description =
    "Coordinates CalTrack AI workflows by routing requests to specialized agents.";

  constructor(private readonly registry: AgentRegistry) {}

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const goal = request.goal.toLowerCase();
    const selectedAgents: string[] = [];

    if (goal.includes("calibration") || goal.includes("calibrate")) {
      selectedAgents.push("calibration");
    }

    if (
      goal.includes("manual") ||
      goal.includes("procedure") ||
      goal.includes("documentation")
    ) {
      selectedAgents.push("documentation");
    }

    if (
      goal.includes("reference standard") ||
      goal.includes("nist") ||
      goal.includes("traceability")
    ) {
      selectedAgents.push("metrology");
    }

    if (
      goal.includes("work order") ||
      goal.includes("schedule") ||
      goal.includes("planning")
    ) {
      selectedAgents.push("planning");
    }

    if (
      goal.includes("approve") ||
      goal.includes("reject") ||
      goal.includes("review") ||
      goal.includes("qa")
    ) {
      selectedAgents.push("qa");
    }

    if (
      goal.includes("report") ||
      goal.includes("summary") ||
      goal.includes("dashboard")
    ) {
      selectedAgents.push("reporting");
    }

    return {
      success: true,
      agent: this.name,
      summary:
        selectedAgents.length > 0
          ? `Supervisor selected: ${selectedAgents.join(", ")}`
          : "Supervisor could not identify a specific specialist agent yet.",
      data: {
        selectedAgents,
        originalGoal: request.goal,
      },
      recommendations: [
        "Next step: execute selected subagents and combine their responses.",
      ],
    };
  }
}