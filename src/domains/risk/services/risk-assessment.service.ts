import OpenAI from "openai";
import { RiskProfile } from "@/app/risk-assessment/data/questions";
import { questions } from "@/app/risk-assessment/data/questions";
import { EvaluateRiskRequest, EvaluateRiskResponse } from "../types";
import { logger } from "@/infrastructure/logging";

export class RiskAssessmentService {
  private openaiClient: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GAPGPT_API_KEY;
    const baseURL = process.env.GAPGPT_BASE_URL;
    const model = process.env.GAPGPT_MODEL;

    if (!apiKey || !baseURL || !model) {
      throw new Error(
        "Missing required environment variables: GAPGPT_API_KEY, GAPGPT_BASE_URL, or GAPGPT_MODEL"
      );
    }

    this.model = model;
    this.openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async evaluateRisk(request: EvaluateRiskRequest): Promise<EvaluateRiskResponse> {
    try {
      logger.info("Building prompt for risk assessment", {
        answersCount: request.answers.length,
        model: this.model,
      });

      const prompt = this.buildPrompt(request.answers);
      
      logger.info("Sending risk assessment request to AI", {
        answersCount: request.answers.length,
        model: this.model,
        promptLength: prompt.length,
      });

      const requestPayload = {
        model: this.model,
        messages: [
          {
            role: "system" as const,
            content: "شما یک ارزیاب حرفه‌ای ریسک سرمایه‌گذاری هستید. وظیفه شما تحلیل پاسخ‌های کاربر و تعیین سطح ریسک‌پذیری او است.",
          },
          {
            role: "user" as const,
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      };

      logger.debug("AI API request payload", {
        model: requestPayload.model,
        messagesCount: requestPayload.messages.length,
        systemMessageLength: requestPayload.messages[0].content.length,
        userMessageLength: requestPayload.messages[1].content.length,
      });

      const response = await this.openaiClient.chat.completions.create(requestPayload);

      logger.info("AI API response received", {
        responseId: response.id,
        model: response.model,
        usage: response.usage,
      });

      const aiResponse = response.choices[0]?.message?.content?.trim() || "";
      
      logger.info("AI raw response", {
        rawResponse: aiResponse,
        responseLength: aiResponse.length,
      });

      const profile = this.extractProfile(aiResponse);

      logger.info("Risk assessment completed successfully", { 
        profile,
        extractedFrom: aiResponse.substring(0, 50),
      });

      return { profile };
    } catch (error) {
      logger.error("Risk assessment service error", { 
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private buildPrompt(userAnswers: Array<{ question: string; answer: string }>): string {
    // Build questions and options section
    const questionsSection = questions
      .map((q, index) => {
        const optionsText = q.options
          .map((opt, optIndex) => `  ${optIndex + 1}. ${opt.text} (امتیاز: ${opt.score})`)
          .join("\n");
        return `سوال ${index + 1}: ${q.question}\nگزینه‌ها:\n${optionsText}`;
      })
      .join("\n\n");

    // Build user answers section
    const answersSection = userAnswers
      .map((ans, index) => `سوال ${index + 1}: ${ans.question}\nپاسخ کاربر: ${ans.answer}`)
      .join("\n\n");

    // Build scoring rules section
    const scoringRules = `
قوانین امتیازدهی:
- هر گزینه امتیاز 1، 2 یا 3 دارد
- امتیاز 1: محافظه‌کار (conservative)
- امتیاز 2: متعادل (balanced)
- امتیاز 3: جسور (aggressive)

قوانین دسته‌بندی بر اساس مجموع امتیازها:
- امتیاز 5 تا 8: محافظه‌کار (conservative)
- امتیاز 9 تا 12: متعادل (balanced)
- امتیاز 13 تا 15: جسور (aggressive)
`;

    return `
${scoringRules}

سوال‌ها و گزینه‌های موجود:

${questionsSection}

پاسخ‌های کاربر:

${answersSection}

لطفاً با توجه به پاسخ‌های کاربر و قوانین دسته‌بندی، سطح ریسک‌پذیری او را تعیین کنید.

فقط و فقط یکی از این سه کلمه را برگردانید (بدون هیچ توضیح اضافی):
- conservative (برای محافظه‌کار)
- balanced (برای متعادل)
- aggressive (برای جسور)
`;
  }

  private extractProfile(aiResponse: string): RiskProfile {
    const normalizedResponse = aiResponse.toLowerCase().trim();

    if (normalizedResponse.includes("conservative") || normalizedResponse.includes("محافظه")) {
      return "conservative";
    }
    if (normalizedResponse.includes("balanced") || normalizedResponse.includes("متعادل")) {
      return "balanced";
    }
    if (normalizedResponse.includes("aggressive") || normalizedResponse.includes("جسور")) {
      return "aggressive";
    }

    // Default fallback - try to extract from response
    logger.warn("Could not extract clear profile from AI response", { aiResponse });
    
    // Try to find any of the keywords
    if (normalizedResponse.match(/\bconservative\b/)) return "conservative";
    if (normalizedResponse.match(/\bbalanced\b/)) return "balanced";
    if (normalizedResponse.match(/\baggressive\b/)) return "aggressive";

    // If still not found, default to balanced
    logger.warn("Defaulting to balanced profile", { aiResponse });
    return "balanced";
  }
}

