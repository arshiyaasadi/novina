import { z } from "zod";
import { RiskProfile } from "@/app/risk-assessment/data/questions";

export interface EvaluateRiskRequest {
  answers: Array<{
    question: string;
    answer: string;
  }>;
}

export interface EvaluateRiskResponse {
  profile: RiskProfile;
}

/**
 * Validation schema for risk evaluation request
 */
export const evaluateRiskSchema = z.object({
  answers: z.array(
    z.object({
      question: z.string().min(1, "Question cannot be empty"),
      answer: z.string().min(1, "Answer cannot be empty"),
    })
  ).min(1, "At least one answer is required"),
});

