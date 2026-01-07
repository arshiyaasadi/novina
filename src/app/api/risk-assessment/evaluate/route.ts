import { NextRequest } from "next/server";
import { RiskAssessmentController } from "@/domains/risk/controllers/risk-assessment.controller";

// Lazy initialization - only create when needed (at runtime, not build time)
let riskAssessmentController: RiskAssessmentController | null = null;

function getController() {
  if (!riskAssessmentController) {
    riskAssessmentController = new RiskAssessmentController();
  }
  return riskAssessmentController;
}

export async function POST(request: NextRequest) {
  return getController().evaluate(request);
}

