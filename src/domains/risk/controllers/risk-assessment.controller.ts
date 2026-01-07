import { NextRequest, NextResponse } from "next/server";
import { RiskAssessmentService } from "../services/risk-assessment.service";
import { EvaluateRiskRequest, evaluateRiskSchema } from "../types";
import { logger } from "@/infrastructure/logging";
import { ErrorResponses } from "@/shared/types/errors";

export class RiskAssessmentController {
  private riskAssessmentService: RiskAssessmentService;

  constructor() {
    this.riskAssessmentService = new RiskAssessmentService();
  }

  async evaluate(request: NextRequest) {
    try {
      const body = await request.json();

      logger.info("Risk assessment evaluation request received", {
        answersCount: body?.answers?.length || 0,
        hasAnswers: !!body?.answers,
      });

      // Validate input
      const validationResult = evaluateRiskSchema.safeParse(body);
      if (!validationResult.success) {
        logger.warn("Risk assessment validation failed", {
          errors: validationResult.error.errors,
        });
        const errorResponse = ErrorResponses.validation(validationResult.error.errors);
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      const evaluateRequest: EvaluateRiskRequest = validationResult.data;
      
      logger.info("Risk assessment request validated", {
        answersCount: evaluateRequest.answers.length,
        firstAnswer: evaluateRequest.answers[0]?.question?.substring(0, 50) + "...",
      });

      const result = await this.riskAssessmentService.evaluateRisk(evaluateRequest);

      logger.info("Risk assessment evaluation completed", {
        profile: result.profile,
      });

      return NextResponse.json(result);
    } catch (error) {
      logger.error("Risk assessment controller error", { 
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      // Check if it's an environment variable error
      if (error instanceof Error && error.message.includes("environment variables")) {
        const errorResponse = ErrorResponses.internalServerError(
          "سرویس ارزیابی ریسک در حال حاضر در دسترس نیست"
        );
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      const errorResponse = ErrorResponses.internalServerError(
        "خطا در ارزیابی ریسک. لطفاً دوباره تلاش کنید."
      );
      return NextResponse.json(errorResponse.error, { status: errorResponse.status });
    }
  }
}

