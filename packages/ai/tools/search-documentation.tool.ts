import { searchDocumentation } from "../../../apps/api/src/services/documentation.service";
import { Tool, ToolRequest, ToolResponse } from "../types/tool";

export class SearchDocumentationTool implements Tool {
  readonly name = "searchDocumentation";
  readonly description =
    "Searches real CalTrack engineering documentation, procedures, drawings, and manuals suitable for an instrument calibration briefing.";

  async execute(request: ToolRequest): Promise<ToolResponse> {
    const instrumentId = typeof request.input?.instrumentId === "string" ? request.input.instrumentId : undefined;
    const instrumentType = typeof request.input?.instrumentType === "string" ? request.input.instrumentType : undefined;
    const manufacturer = typeof request.input?.manufacturer === "string" ? request.input.manufacturer : undefined;
    const model = typeof request.input?.model === "string" ? request.input.model : undefined;
    const tags = Array.isArray(request.input?.tags) ? (request.input.tags as string[]) : undefined;

    try {
      const documents = await searchDocumentation({
        instrumentId,
        instrumentType,
        manufacturer,
        model,
        tags,
      });

      return {
        success: true,
        message: `Found ${documents.length} matching document(s).`,
        data: {
          documents,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error searching documentation: ${error.message}`,
      };
    }
  }
}
