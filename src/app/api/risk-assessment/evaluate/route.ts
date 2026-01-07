import { NextRequest } from "next/server";
import { RiskAssessmentController } from "@/domains/risk/controllers/risk-assessment.controller";

const riskAssessmentController = new RiskAssessmentController();

export async function POST(request: NextRequest) {
  return riskAssessmentController.evaluate(request);
}

