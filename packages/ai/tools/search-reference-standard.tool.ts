import { Tool, ToolRequest, ToolResponse } from "../types/tool";

export class SearchReferenceStandardTool implements Tool {
  readonly name = "searchReferenceStandard";
  readonly description =
    "Searches for valid reference standards suitable for an instrument calibration.";

  async execute(request: ToolRequest): Promise<ToolResponse> {
    const instrumentType = request.input?.instrumentType;
    const signalType = request.input?.signalType;

    return {
      success: true,
      message: "Reference standard search prepared.",
      data: {
        instrumentType,
        signalType,
        note: "This tool is currently scaffolded. Next step is connecting it to CalTrack reference standard records.",
      },
    };
  }
}