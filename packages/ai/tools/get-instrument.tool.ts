import { getInstrumentById, getInstrumentByTagNumber } from "../../../apps/api/src/services/instrument.service";
import { Tool, ToolRequest, ToolResponse } from "../types/tool";

export class GetInstrumentTool implements Tool {
  readonly name = "getInstrument";
  readonly description =
    "Retrieves real CalTrack instrument information by tag number or instrument id.";

  async execute(request: ToolRequest): Promise<ToolResponse> {
    const tagNumber = request.input?.tagNumber;
    const instrumentId = request.input?.instrumentId;

    if (typeof tagNumber !== "string" && typeof instrumentId !== "string") {
      return {
        success: false,
        message: "Missing tagNumber or instrumentId.",
      };
    }

    const instrument =
      typeof instrumentId === "string"
        ? await getInstrumentById(instrumentId)
        : await getInstrumentByTagNumber(tagNumber as string);

    if (!instrument) {
      return {
        success: false,
        message: "Instrument not found.",
        data: {
          tagNumber,
          instrumentId,
        },
      };
    }

    return {
      success: true,
      message: `Instrument ${instrument.tagNumber} retrieved successfully.`,
      data: {
        instrument,
      },
    };
  }
}