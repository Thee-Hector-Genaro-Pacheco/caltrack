import { Tool, ToolRequest, ToolResponse } from "../types/tool";

export class GetInstrumentTool implements Tool {
  readonly name = "getInstrument";
  readonly description =
    "Retrieves instrument information by tag number or instrument id.";

  async execute(request: ToolRequest): Promise<ToolResponse> {
    const tagNumber = request.input?.tagNumber;
    const instrumentId = request.input?.instrumentId;

    if (!tagNumber && !instrumentId) {
      return {
        success: false,
        message: "Missing tagNumber or instrumentId.",
      };
    }

    return {
      success: true,
      message: "Instrument lookup prepared.",
      data: {
        tagNumber,
        instrumentId,
        note: "This tool is currently scaffolded. Next step is connecting it to CalTrack API or Prisma.",
      },
    };
  }
}