import { getAllReferenceStandards } from "../../services/referenceStandard.service";
import { Tool, ToolRequest, ToolResponse } from '@caltrack/ai';

export class SearchReferenceStandardTool implements Tool {
  readonly name = "searchReferenceStandard";
  readonly description =
    "Searches real CalTrack reference standards suitable for an instrument calibration.";

  async execute(request: ToolRequest): Promise<ToolResponse> {
    const instrumentType =
      typeof request.input?.instrumentType === "string"
        ? request.input.instrumentType.toLowerCase()
        : "";

    const signalType =
      typeof request.input?.signalType === "string"
        ? request.input.signalType.toLowerCase()
        : "";

    const standards = await getAllReferenceStandards();

    const matchingStandards = standards.filter((standard) => {
      const equipmentType = standard.equipmentType.toLowerCase();
      const model = standard.model.toLowerCase();
      const manufacturer = standard.manufacturer.toLowerCase();

      if (
        standard.status === "EXPIRED" ||
        standard.status === "OUT_OF_SERVICE"
      ) {
        return false;
      }

      if (
        instrumentType.includes("pressure") &&
        (equipmentType.includes("pressure") ||
          model.includes("dpi") ||
          model.includes("cph"))
      ) {
        return true;
      }

      if (
        signalType.includes("4-20") &&
        (equipmentType.includes("process") ||
          equipmentType.includes("multifunction") ||
          manufacturer.includes("fluke") ||
          manufacturer.includes("beamex"))
      ) {
        return true;
      }

      if (
        instrumentType.includes("temperature") &&
        (equipmentType.includes("temperature") ||
          equipmentType.includes("rtd") ||
          equipmentType.includes("thermocouple") ||
          equipmentType.includes("multifunction"))
      ) {
        return true;
      }

      return false;
    });

    return {
      success: true,
      message: `Found ${matchingStandards.length} suitable reference standard(s).`,
      data: {
        instrumentType,
        signalType,
        referenceStandards: matchingStandards,
      },
    };
  }
}