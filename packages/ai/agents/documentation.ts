import { Agent, AgentRequest, AgentResponse } from "../types/agent";
import { ToolRegistry } from "../core/tool-registry";
import { BriefingDocumentationItem, BriefingTechnicalDocumentation } from "@caltrack/types";

export class DocumentationAgent implements Agent {
  readonly name = "documentation";
  readonly description =
    "Retrieves and summarizes manuals, procedures, SOPs, and documentation guidance.";

  constructor(private readonly tools?: ToolRegistry) {}

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const instrument = request.context?.instrument as any;

    if (!instrument) {
      return {
        success: true,
        agent: this.name,
        summary: "Documentation Agent identified no target instrument for request.",
        data: {
          technicalDocumentation: {
            recommendedProcedure: null,
            manufacturerManual: null,
            installationGuide: null,
            safetyNotes: null,
            troubleshootingGuide: null,
            relatedDrawings: [],
          },
        },
      };
    }

    try {
      const searchTool = this.tools?.get("searchDocumentation");
      if (!searchTool) {
        throw new Error("searchDocumentation tool not found in tool registry");
      }

      const searchResult = await searchTool.execute({
        input: {
          instrumentId: instrument.id,
          instrumentType: instrument.instrumentType,
          manufacturer: instrument.manufacturer,
          model: instrument.model,
          tags: [instrument.tagNumber],
        },
      });

      const docs: any[] = searchResult.success && Array.isArray(searchResult.data?.documents) 
        ? searchResult.data.documents 
        : [];

      // Map doc to BriefingDocumentationItem helper
      const mapToBriefItem = (doc: any): BriefingDocumentationItem => ({
        id: doc.id,
        title: doc.title,
        documentNumber: doc.documentNumber,
        revision: doc.revision,
        fileLocation: doc.fileLocation,
        documentType: doc.documentType,
      });

      // Filter and categorize documents
      const activeDocs = docs.filter(d => d.status === "ACTIVE");

      const recommendedProcedureDoc = activeDocs.find(d => 
        d.documentType === "Calibration Procedures" || 
        d.documentType === "SOPs" || 
        d.documentType === "Maintenance Procedures"
      );

      const manufacturerManualDoc = activeDocs.find(d => 
        d.documentType === "Manufacturer Manuals"
      );

      const installationGuideDoc = activeDocs.find(d => 
        d.documentType === "Installation Guides"
      );

      const safetyNotesDoc = activeDocs.find(d => 
        d.documentType === "Safety Procedures"
      );

      const troubleshootingGuideDoc = activeDocs.find(d => 
        d.documentType === "Troubleshooting Guides"
      );

      const drawingDocs = activeDocs.filter(d => 
        d.documentType === "Wiring Diagrams" || 
        d.documentType === "P&IDs" || 
        d.documentType === "Loop Drawings"
      );

      const technicalDocumentation: BriefingTechnicalDocumentation = {
        recommendedProcedure: recommendedProcedureDoc ? mapToBriefItem(recommendedProcedureDoc) : null,
        manufacturerManual: manufacturerManualDoc ? mapToBriefItem(manufacturerManualDoc) : null,
        installationGuide: installationGuideDoc ? mapToBriefItem(installationGuideDoc) : null,
        safetyNotes: safetyNotesDoc ? mapToBriefItem(safetyNotesDoc) : null,
        troubleshootingGuide: troubleshootingGuideDoc ? mapToBriefItem(troubleshootingGuideDoc) : null,
        relatedDrawings: drawingDocs.map(mapToBriefItem),
      };

      const recommendations: string[] = [];
      if (recommendedProcedureDoc) {
        recommendations.push(
          `📖 Reference approved procedure ${recommendedProcedureDoc.documentNumber} Rev ${recommendedProcedureDoc.revision} during calibration.`
        );
      } else {
        recommendations.push(
          "⚠️ Warning: No official Calibration Procedure or SOP is linked to this instrument."
        );
      }

      if (safetyNotesDoc) {
        recommendations.push(
          `🔒 Review safety procedures in ${safetyNotesDoc.title} before work.`
        );
      }

      return {
        success: true,
        agent: this.name,
        summary: `Retrieved and categorized ${activeDocs.length} active engineering document(s) for ${instrument.tagNumber}.`,
        data: {
          technicalDocumentation,
        },
        recommendations,
      };
    } catch (error: any) {
      return {
        success: false,
        agent: this.name,
        summary: `Error in documentation agent: ${error.message}`,
        data: {
          technicalDocumentation: {
            recommendedProcedure: null,
            manufacturerManual: null,
            installationGuide: null,
            safetyNotes: null,
            troubleshootingGuide: null,
            relatedDrawings: [],
          },
        },
      };
    }
  }
}