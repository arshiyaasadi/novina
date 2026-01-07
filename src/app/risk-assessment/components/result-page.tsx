"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RiskResult, Question, getRiskResultByProfile } from "../data/questions";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { API_ROUTES } from "@/shared/constants";
import { FundList } from "./fund-list";
import { getFundsByCategory } from "../data/funds";
import { RotateCcw } from "lucide-react";

interface ResultPageProps {
  result?: RiskResult | null;
  isAiMode?: boolean;
  textAnswers?: string[];
  questions?: Question[];
  answers?: (number | null)[];
  selectedFundIds?: number[];
  onSelectedFundsChange?: (fundIds: number[]) => void;
  onContinue?: (fundIds: number[]) => void;
  className?: string;
}


interface CleanAnswerData {
  question: string;
  answer: string;
}

function generateAnswerData(
  questions: Question[],
  textAnswers: string[],
  answers: (number | null)[]
): CleanAnswerData[] {
  const result: CleanAnswerData[] = [];
  
  questions.forEach((question, index) => {
    const textAnswer = textAnswers[index];
    const selectedAnswerIndex = answers[index];
    
    let answerText = "";
    
    // If there's a text answer, use it; otherwise use selected option
    if (textAnswer && textAnswer.trim().length > 0) {
      answerText = textAnswer;
    } else if (selectedAnswerIndex !== null && selectedAnswerIndex !== undefined) {
      const selectedOption = question.options[selectedAnswerIndex];
      answerText = `(#${selectedAnswerIndex + 1} گزینه): ${selectedOption.text}`;
    } else {
      answerText = "پاسخی ثبت نشده است";
    }
    
    result.push({
      question: question.question,
      answer: answerText,
    });
  });
  
  return result;
}

export function ResultPage({ 
  result, 
  isAiMode = false, 
  textAnswers, 
  questions,
  answers,
  selectedFundIds: externalSelectedFundIds,
  onSelectedFundsChange,
  onContinue,
  className 
}: ResultPageProps) {
  const router = useRouter();
  const [aiResult, setAiResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRequestedRef = useRef(false);
  const [internalSelectedFundIds, setInternalSelectedFundIds] = useState<number[]>([]);
  const hasInitializedFundsRef = useRef<string | null>(null);
  
  // Use external state if provided, otherwise use internal state
  const selectedFundIds = externalSelectedFundIds ?? internalSelectedFundIds;
  const setSelectedFundIds = useCallback((value: React.SetStateAction<number[]>) => {
    if (onSelectedFundsChange) {
      const newValue = typeof value === 'function' ? value(selectedFundIds) : value;
      onSelectedFundsChange(newValue);
    } else {
      setInternalSelectedFundIds(value);
    }
  }, [onSelectedFundsChange, selectedFundIds]);

  // Generate clean answer data JSON for AI - memoized to prevent loop
  const answerData = useMemo(() => {
    if (!questions || !textAnswers || !answers) return [];
    return generateAnswerData(questions, textAnswers, answers);
  }, [questions, textAnswers, answers]);
  
  const answerDataJson = JSON.stringify(answerData, null, 2);

  // Reset refs when mode changes
  useEffect(() => {
    hasRequestedRef.current = false;
    hasInitializedFundsRef.current = null;
    setAiResult(null);
    setError(null);
    setSelectedFundIds([]);
  }, [isAiMode, setSelectedFundIds]);

  // Mock AI API call when in AI mode - only once
  useEffect(() => {
    if (isAiMode && answerData.length > 0 && !hasRequestedRef.current && !isLoading) {
      hasRequestedRef.current = true;
      setIsLoading(true);
      setError(null);

      const requestBody = {
        answers: answerData,
      };

      console.log("[Risk Assessment] Mock Request Input:", {
        endpoint: API_ROUTES.RISK_ASSESSMENT.EVALUATE,
        method: "POST",
        body: requestBody,
        answersCount: answerData.length,
      });

      // Mock API call with realistic delay (2-3 seconds)
      const mockDelay = 2000 + Math.random() * 1000; // 2000-3000ms

      const timeoutId = setTimeout(() => {
        // Always return "balanced" profile
        const mockData: { profile: "conservative" | "balanced" | "aggressive" } = {
          profile: "balanced",
        };

        console.log("[Risk Assessment] Mock Success Response:", mockData);
        
        // Convert profile to RiskResult using helper function
        const validAnswers = answers?.filter((a): a is number => a !== null) as number[] || [];
        const riskResult = getRiskResultByProfile(
          mockData.profile,
          undefined,
          validAnswers
        );
        
        console.log("[Risk Assessment] Converted Result:", riskResult);
        setAiResult(riskResult);
        setIsLoading(false);
      }, mockDelay);

      // Cleanup timeout on unmount
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isAiMode, answerData.length]); // Only depend on length, not the array itself

  // Default result - balanced profile
  const defaultResult: RiskResult = {
    profile: "balanced",
    score: 10,
    emoji: "⚖️",
    title: "متعادل",
    description: "تعادل بین رشد و ریسک",
    recommendation: "سبد ترکیبی از سهام، طلا و درآمد ثابت",
  };

  // Determine which result to display
  const displayResult = isAiMode 
    ? (aiResult || (isLoading ? null : defaultResult))
    : (result || defaultResult);

  // Initialize selected funds with recommended funds when result is available
  useEffect(() => {
    if (displayResult && displayResult.profile) {
      // Reset initialization if profile changed
      if (hasInitializedFundsRef.current !== displayResult.profile) {
        const recommendedFunds = getFundsByCategory(displayResult.profile);
        const recommendedFundIds = recommendedFunds.map(f => f.id);
        setSelectedFundIds(recommendedFundIds);
        hasInitializedFundsRef.current = displayResult.profile;
      }
    }
  }, [displayResult?.profile, setSelectedFundIds]);

  const handleToggleFund = (fundId: number) => {
    setSelectedFundIds((prev: number[]) => 
      prev.includes(fundId)
        ? prev.filter(id => id !== fundId)
        : [...prev, fundId]
    );
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedFundIds);
    }
  };

  const handleRestart = () => {
    // Use window.location for full page refresh to reset all state
    window.location.href = "/risk-assessment";
  };

  return (
    <>
      <div className={cn("flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto pb-32", className)}>
        <div className="w-full max-w-2xl space-y-6">
          <Card className="border-2 relative">
          {/* Restart Button - Absolute positioned top right */}
          {displayResult && !isLoading && !error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="absolute top-4 left-4 z-10 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              تکرار ارزیابی
            </Button>
          )}
          <CardHeader className="text-center pb-4">
            {isLoading ? (
              <>
                <div className="text-6xl mb-4">⏳</div>
                <CardTitle className="text-3xl font-bold">در حال ارزیابی...</CardTitle>
                <p className="text-muted-foreground mt-2">لطفاً صبر کنید</p>
              </>
            ) : error ? (
              <>
                <div className="text-6xl mb-4">⚠️</div>
                <CardTitle className="text-3xl font-bold">خطا</CardTitle>
                <p className="text-muted-foreground mt-2 text-red-500">{error}</p>
              </>
            ) : displayResult ? (
              <>
                <div className="text-6xl mb-4">{displayResult.emoji}</div>
                <CardTitle className="text-3xl font-bold">{displayResult.title}</CardTitle>
                <p className="text-muted-foreground mt-2">{displayResult.description}</p>
              </>
            ) : null}
          </CardHeader>
          {displayResult && !isLoading && !error && (
            <CardContent className="space-y-6 pb-8">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">پیشنهاد سرمایه‌گذاری:</h3>
                <p className="text-muted-foreground leading-relaxed">{displayResult.recommendation}</p>
              </div>
              
              {/* Guide Text */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">صندوق‌های خودت رو انتخاب کن</p>
                <p className="text-sm text-muted-foreground">
                  می‌تونید از صندوق‌های دیگه هم انتخاب کنی و به پورتفوی خودت اضافه کنی
                </p>
              </div>
              
              {/* Fund List */}
              <FundList
                profile={displayResult.profile}
                selectedFundIds={selectedFundIds}
                onToggleFund={handleToggleFund}
              />
            </CardContent>
          )}
        </Card>
        </div>
      </div>
      
      {/* Fixed Continue Button */}
      {displayResult && !isLoading && !error && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-10 pb-safe-area-inset-bottom">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Button
              onClick={handleContinue}
              disabled={selectedFundIds.length === 0}
              className="w-full"
              size="lg"
            >
              ادامه
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

