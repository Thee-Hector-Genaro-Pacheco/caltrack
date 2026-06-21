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

    const subagentResponses: AgentResponse[] = [];

    for (const agentName of selectedAgents) {
      const agent = this.registry.get(agentName);

      if (!agent) {
        subagentResponses.push({
          success: false,
          agent: agentName,
          summary: `Agent "${agentName}" is not registered.`,
        });
        continue;
      }

      const response = await agent.execute(request);
      subagentResponses.push(response);
    }

    return {
      success: true,
      agent: this.name,
      summary:
        subagentResponses.length > 0
          ? `Supervisor executed ${subagentResponses.length} subagent(s): ${selectedAgents.join(", ")}.`
          : "Supervisor could not identify a specific specialist agent yet.",
      data: {
        selectedAgents,
        subagentResponses,
        originalGoal: request.goal,
      },
      recommendations:
        subagentResponses.length > 0
          ? subagentResponses.flatMap((response) => response.recommendations ?? [])
          : ["Try asking about calibration, procedures, manuals, or documentation."],
    };
  }
}