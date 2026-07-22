import { getCalibrationHistoryByInstrumentId } from "../../services/instrument.service";
import { Tool, ToolRequest, ToolResponse } from '@caltrack/ai';

export class GetCalibrationHistoryTool implements Tool {
  readonly name = "getCalibrationHistory";
  readonly description =
    "Retrieves real calibration history for an instrument by instrument id.";

  async execute(request: ToolRequest): Promise<ToolResponse> {
    const instrumentId = request.input?.instrumentId;

    if (typeof instrumentId !== "string") {
      return {
        success: false,
        message: "Missing instrumentId.",
      };
    }

    const calibrationHistory =
      await getCalibrationHistoryByInstrumentId(instrumentId);

    return {
      success: true,
      message: `Retrieved ${calibrationHistory.length} calibration record(s).`,
      data: {
        instrumentId,
        calibrationHistory,
      },
    };
  }
}