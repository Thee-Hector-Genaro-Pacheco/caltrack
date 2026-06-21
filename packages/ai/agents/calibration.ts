import { Agent, AgentRequest, AgentResponse } from "../types/agent";

export class CalibrationAgent implements Agent {
  readonly name = "calibration";
  readonly description =
    "Analyzes calibration requirements, test points, MPE, and pass/fail logic.";

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const instrument = request.context?.instrument as any;

    if (!instrument) {
      return {
        success: true,
        agent: this.name,
        summary:
          "Calibration Agent prepared calibration-focused guidance based on the request.",
        data: {
          goal: request.goal,
          focusAreas: [
            "5-point calibration targets",
            "4-20 mA expected outputs",
            "MPE tolerance checks",
            "As Found / As Left comparison",
          ],
        },
        recommendations: [
          "Verify instrument range and signal type before calibration.",
          "Use approved site procedures and valid reference standards.",
          "Review failed points before submitting for approval.",
        ],
      };
    }

    const testPoints: { percent: number; targetInput: number; expectedOutput: number }[] = [];
    const percents = [0, 25, 50, 75, 100];
    for (const p of percents) {
      const percentDecimal = p / 100;
      const targetInput = instrument.rangeMin + percentDecimal * (instrument.rangeMax - instrument.rangeMin);
      let expectedOutput = targetInput;
      if (instrument.signalType === "4-20 mA") {
        expectedOutput = 4 + 16 * percentDecimal;
      }
      testPoints.push({
        percent: p,
        targetInput: Math.round(targetInput * 100) / 100,
        expectedOutput: Math.round(expectedOutput * 100) / 100,
      });
    }

    const checklist = [
      "Verify isolation",
      "Verify zero",
      "Perform 5-point calibration",
      "Record As Found",
      "Record As Left",
      "Verify MPE",
      "Submit for QA Review"
    ];

    const recommendations: string[] = [];
    if (instrument.maxPermissibleError < 0.5) {
      recommendations.push(`Precision device (MPE ±${instrument.maxPermissibleError}%): Handle with care and ensure reference standard accuracy is adequate.`);
    }
    if (instrument.status === "OVERDUE") {
      recommendations.push("This instrument is currently OVERDUE. Prioritize this calibration immediately.");
    }

    return {
      success: true,
      agent: this.name,
      summary: `Successfully calculated calibration targets and checklist for instrument ${instrument.tagNumber}.`,
      data: {
        testPoints,
        checklist,
      },
      recommendations,
    };
  }
}