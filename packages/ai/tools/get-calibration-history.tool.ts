import { Tool, ToolRequest, ToolResponse } from "../types/tool";

export class GetCalibrationHistoryTool implements Tool {
  readonly name = "getCalibrationHistory";
  readonly description =
    "Retrieves calibration history for an instrument by tag number or instrument id.";

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
      message: "Calibration history lookup prepared.",
      data: {
        tagNumber,
        instrumentId,
        note: "This tool is currently scaffolded. Next step is connecting it to CalTrack calibration records.",
      },
    };
  }
}