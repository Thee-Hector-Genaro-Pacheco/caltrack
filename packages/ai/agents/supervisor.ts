import { Agent, AgentRequest, AgentResponse } from "../types/agent";
import { AgentRegistry } from "../core/registry";
import { ToolRegistry } from "../core/tool-registry";

export class SupervisorAgent implements Agent {
  readonly name = "supervisor";
  readonly description =
    "Coordinates CalTrack AI workflows by routing requests to specialized agents.";

  constructor(
    private readonly registry: AgentRegistry,
    private readonly tools: ToolRegistry
  ) {}

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const instrumentId = request.context?.instrumentId as string;

    if (!instrumentId) {
      return {
        success: false,
        agent: this.name,
        summary: "Instrument ID is required in the request context.",
      };
    }

    try {
      // 1. Execute GetInstrumentTool
      const getInstrumentTool = this.tools.get("getInstrument");
      if (!getInstrumentTool) {
        throw new Error("getInstrument tool not found in tool registry");
      }

      const instResponse = await getInstrumentTool.execute({
        input: { instrumentId },
      });

      if (!instResponse.success || !instResponse.data?.instrument) {
        return {
          success: false,
          agent: this.name,
          summary: instResponse.message || "Failed to retrieve instrument information.",
        };
      }

      const instrument = instResponse.data.instrument as any;

      // 2. Execute GetCalibrationHistoryTool
      const getCalHistoryTool = this.tools.get("getCalibrationHistory");
      if (!getCalHistoryTool) {
        throw new Error("getCalibrationHistory tool not found in tool registry");
      }

      const historyResponse = await getCalHistoryTool.execute({
        input: { instrumentId },
      });

      const calibrationHistory =
        historyResponse.success && Array.isArray(historyResponse.data?.calibrationHistory)
          ? historyResponse.data.calibrationHistory
          : [];

      // 3. Execute SearchReferenceStandardTool
      const searchRefStandardTool = this.tools.get("searchReferenceStandard");
      if (!searchRefStandardTool) {
        throw new Error("searchReferenceStandard tool not found in tool registry");
      }

      const refResponse = await searchRefStandardTool.execute({
        input: {
          instrumentType: instrument.instrumentType,
          signalType: instrument.signalType,
        },
      });

      const referenceStandards =
        refResponse.success && Array.isArray(refResponse.data?.referenceStandards)
          ? refResponse.data.referenceStandards
          : [];

      // 4. Delegate to CalibrationAgent for targets, checklists, and agent recommendations
      const calibrationAgent = this.registry.get("calibration");
      if (!calibrationAgent) {
        throw new Error("calibration agent not found in agent registry");
      }

      const calAgentResponse = await calibrationAgent.execute({
        goal: `Analyze target calibration parameters for ${instrument.tagNumber}`,
        context: { instrument },
      });

      const calAgentData = calAgentResponse.data || {};
      const testPoints = calAgentData.testPoints || [];
      const checklist = calAgentData.checklist || [];

      // 4b. Delegate to DocumentationAgent for relevant drawings and procedures
      const documentationAgent = this.registry.get("documentation");
      if (!documentationAgent) {
        throw new Error("documentation agent not found in agent registry");
      }

      const docAgentResponse = await documentationAgent.execute({
        goal: `Retrieve technical documentation for ${instrument.tagNumber}`,
        context: { instrument },
      });

      const docAgentData = docAgentResponse.data || {};
      const technicalDocumentation = docAgentData.technicalDocumentation || {
        recommendedProcedure: null,
        manufacturerManual: null,
        installationGuide: null,
        safetyNotes: null,
        troubleshootingGuide: null,
        relatedDrawings: [],
      };

      // 5. Build History Metrics
      const sortedHistory = [...calibrationHistory].sort(
        (a: any, b: any) =>
          new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime()
      );

      let lastCalibrationDate = "Never Calibrated";
      let passFail = "N/A";
      let previousTechnician = "N/A";

      if (sortedHistory.length > 0) {
        const lastRecord = sortedHistory[0];
        lastCalibrationDate = new Date(lastRecord.calibrationDate).toLocaleDateString();
        passFail = lastRecord.passFail ? "PASS" : "FAIL";
        previousTechnician = lastRecord.technicianName || "Unknown";
      }

      // 6. Build Standards List & Warnings
      const formattedStandards = referenceStandards.map((std: any) => {
        const isExpired =
          std.status === "EXPIRED" ||
          new Date(std.calibrationDueDate).getTime() < Date.now();
        return {
          assetTag: std.assetTag,
          equipmentType: std.equipmentType,
          manufacturer: std.manufacturer,
          model: std.model,
          calibrationDueDate: new Date(std.calibrationDueDate).toLocaleDateString(),
          status: std.status,
          isExpired,
          accuracyClass: std.accuracyClass,
        };
      });

      // 7. Apply Deterministic Business Rules for Recommendations
      const recommendations: string[] = [];

      // Instrument specific rules
      if (instrument.status === "OVERDUE") {
        recommendations.push(
          "🚨 Calibration is OVERDUE. Schedule calibration immediately to prevent measurement drift."
        );
      } else if (instrument.status === "CALIBRATION_DUE") {
        recommendations.push(
          "⚠️ Calibration is due soon. Schedule verification before the deadline."
        );
      }

      if (instrument.maxPermissibleError <= 0.25) {
        recommendations.push(
          `🎯 Precision device (MPE ±${instrument.maxPermissibleError}%): Use high-accuracy standards and minimize environment noise.`
        );
      }

      // History specific rules
      const lastCalFailed = calibrationHistory.some(
        (rec: any, idx: number) => idx === 0 && !rec.passFail
      );
      if (lastCalFailed) {
        recommendations.push(
          "🔍 The last calibration failed. Conduct thorough visual checks and test connections for leakage."
        );
      }

      // Reference standards specific rules
      if (formattedStandards.length === 0) {
        recommendations.push(
          "🚫 No active reference standards were found matching this instrument category. Check standard inventory."
        );
      } else {
        const anyExpired = formattedStandards.some((s) => s.isExpired);
        if (anyExpired) {
          recommendations.push(
            "🛑 Warning: One or more recommended reference standards are expired. Use only valid active equipment."
          );
        }

        const dueSoonThresholdDays = 30;
        const dueSoonMs = dueSoonThresholdDays * 24 * 3600000;
        const anyDueSoon = formattedStandards.some(
          (s) =>
            !s.isExpired &&
            new Date(s.calibrationDueDate).getTime() - Date.now() < dueSoonMs
        );
        if (anyDueSoon) {
          recommendations.push(
            "⏳ Note: Some recommended reference standards are due for calibration within 30 days."
          );
        }
      }

      // Add subagent specific recommendations
      if (calAgentResponse.recommendations) {
        recommendations.push(...calAgentResponse.recommendations);
      }
      if (docAgentResponse.recommendations) {
        recommendations.push(...docAgentResponse.recommendations);
      }

      // 8. Assemble structured briefing
      const processAreaStr = instrument.processArea
        ? `${instrument.processArea.areaCode} - ${instrument.processArea.name}`
        : "N/A";
      const controlLoopStr = instrument.controlLoop
        ? `${instrument.controlLoop.loopTag} (${instrument.controlLoop.loopNumber})`
        : "N/A";

      // 7b. Calculate Predictive Intelligence metrics for AI Briefing
      const totalCalibrations = sortedHistory.length;
      
      // Consecutive failed calibrations starting from most recent
      let repeatedFailures = 0;
      for (const cal of sortedHistory) {
        if (!cal.passFail) {
          repeatedFailures++;
        } else {
          break;
        }
      }

      // Gathering all test points
      const allTestPoints = sortedHistory.flatMap((c: any) => c.testPoints || []);
      let worstTestPointError = 0;
      if (allTestPoints.length > 0) {
        worstTestPointError = Math.max(
          ...allTestPoints.map((tp: any) =>
            Math.max(Math.abs(tp.asFoundError || 0), Math.abs(tp.asLeftError || 0))
          )
        );
      }

      // Drift calculation
      let driftDirection: 'UPWARD' | 'DOWNWARD' | 'STABLE' | 'NONE' = 'NONE';
      let avgDrift = 0;
      if (sortedHistory.length >= 2) {
        const cal0 = sortedHistory[0];
        const cal1 = sortedHistory[1];
        const pts0 = cal0.testPoints || [];
        const pts1 = cal1.testPoints || [];
        const N = Math.min(pts0.length, pts1.length);
        if (N > 0) {
          let totalDiff = 0;
          for (let i = 0; i < N; i++) {
            totalDiff += ((pts0[i].asFoundError || 0) - (pts1[i].asLeftError || 0));
          }
          avgDrift = totalDiff / N;
          if (avgDrift > 0.05) {
            driftDirection = 'UPWARD';
          } else if (avgDrift < -0.05) {
            driftDirection = 'DOWNWARD';
          } else {
            driftDirection = 'STABLE';
          }
        }
      }

      // Deterministic risk scoring
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      const isOverdue = instrument.status === 'OVERDUE';
      const isDueSoon = instrument.status === 'CALIBRATION_DUE';
      const lastRecordFailed = sortedHistory[0] && !sortedHistory[0].passFail;

      if (isOverdue && lastRecordFailed) {
        riskLevel = 'CRITICAL';
      } else if (repeatedFailures >= 2 || (sortedHistory[0] && worstTestPointError > instrument.maxPermissibleError * 1.5)) {
        riskLevel = 'HIGH';
      } else if (isDueSoon || isOverdue || driftDirection === 'UPWARD' || driftDirection === 'DOWNWARD') {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }

      const driftSummary = driftDirection === 'NONE'
        ? 'No historical test point data exists to compute drift.'
        : `Drift trend is classified as ${driftDirection} (average absolute offset: ${Math.abs(avgDrift).toFixed(2)}% of span).`;

      const repeatedFailureWarning = repeatedFailures >= 2
        ? `Warning: ${repeatedFailures} consecutive failed calibrations detected on this tag.`
        : null;

      const attentionItems: string[] = [];
      if (riskLevel === 'CRITICAL') {
        attentionItems.push('CRITICAL: Device past validation deadline and has failed recent checks. Inspect for mechanical failure.');
      }
      if (repeatedFailures >= 2) {
        attentionItems.push(`Investigate repeated failures (${repeatedFailures} consecutive). Check process compatibility.`);
      }
      if (sortedHistory[0] && worstTestPointError > instrument.maxPermissibleError * 1.5) {
        attentionItems.push(`Review severe error (${worstTestPointError.toFixed(2)}% observed) against ±${instrument.maxPermissibleError}% MPE spec.`);
      }
      if (isOverdue && !lastRecordFailed) {
        attentionItems.push('Schedule routine calibration check immediately.');
      }
      if (isDueSoon) {
        attentionItems.push('Calibration due soon. Schedule validation window.');
      }
      if (driftDirection === 'UPWARD' || driftDirection === 'DOWNWARD') {
        attentionItems.push(`Monitor drift trend (${driftDirection}). Adjust calibration trim if deviation persists.`);
      }
      if (attentionItems.length === 0) {
        attentionItems.push('Perform standard calibration checks according to procedural checklist.');
      }

      const briefing = {
        instrumentInfo: {
          tagNumber: instrument.tagNumber,
          manufacturer: instrument.manufacturer,
          model: instrument.model,
          instrumentType: instrument.instrumentType,
          range: `${instrument.rangeMin} - ${instrument.rangeMax} ${instrument.engineeringUnits}`,
          signalType: instrument.signalType,
          location: instrument.location,
          processArea: processAreaStr,
          controlLoop: controlLoopStr,
        },
        calibrationHistory: {
          lastCalibrationDate,
          passFail,
          previousTechnician,
          numberOfHistoricalCalibrations: calibrationHistory.length,
        },
        referenceStandards: formattedStandards,
        calibrationChecklist: checklist,
        testPoints, // Include testPoints for the modal targets rendering
        recommendations: Array.from(new Set(recommendations)), // Deduplicate
        technicalDocumentation,
        riskLevel,
        driftSummary,
        repeatedFailureWarning,
        recommendedTechnicianAttentionItems: attentionItems,
      };

      return {
        success: true,
        agent: this.name,
        summary: `Successfully generated calibration briefing for ${instrument.tagNumber}.`,
        data: briefing,
      };
    } catch (error: any) {
      return {
        success: false,
        agent: this.name,
        summary: `Error executing supervisor agent: ${error.message}`,
      };
    }
  }
}