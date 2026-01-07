"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { questions, calculateRiskProfile, type RiskResult } from "../data/questions";
import { StepIndicator } from "./step-indicator";
import { QuestionStep } from "./question-step";
import { AnswerOptions } from "./answer-options";
import { TextAnswerInput } from "./text-answer-input";
import { NavigationButtons } from "./navigation-buttons";
import { ResultPage } from "./result-page";
import { IntroPage } from "./intro-page";
import { AllocationPage } from "./allocation-page";
import { cn } from "@/shared/lib/utils";

const TOTAL_STEPS = questions.length;

type WizardStep = "intro" | number | "result" | "allocation";
type AnswerMode = "standard" | "ai";

export function RiskWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get step and mode from URL or default to intro/standard
  const urlStep = searchParams.get("step");
  const urlMode = searchParams.get("mode") as AnswerMode | null;
  
  const getInitialStep = (): WizardStep => {
    if (urlStep === "intro" || !urlStep) return "intro";
    if (urlStep === "result") return "result";
    if (urlStep === "allocation") return "allocation";
    const stepNum = parseInt(urlStep, 10);
    if (!isNaN(stepNum) && stepNum >= 0 && stepNum < TOTAL_STEPS) return stepNum;
    return "intro";
  };

  const getInitialMode = (): AnswerMode => {
    return urlMode === "ai" ? "ai" : "standard";
  };

  const [currentStep, setCurrentStep] = useState<WizardStep>(getInitialStep());
  const [isAiMode, setIsAiMode] = useState<boolean>(getInitialMode() === "ai");
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(TOTAL_STEPS).fill(null)
  );
  const [textAnswers, setTextAnswers] = useState<string[]>(
    new Array(TOTAL_STEPS).fill("")
  );
  const [result, setResult] = useState<RiskResult | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedFundIds, setSelectedFundIds] = useState<number[]>([]);

  // Sync URL when step or mode changes (but not on initial mount to avoid conflicts)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const params = new URLSearchParams();
    if (currentStep === "intro") {
      params.set("step", "intro");
    } else if (currentStep === "result") {
      params.set("step", "result");
    } else if (currentStep === "allocation") {
      params.set("step", "allocation");
    } else if (typeof currentStep === "number") {
      params.set("step", currentStep.toString());
    }
    params.set("mode", isAiMode ? "ai" : "standard");
    router.replace(`/risk-assessment?${params.toString()}`, { scroll: false });
  }, [currentStep, isAiMode, router]);

  // Reset state when URL changes to intro (e.g., when restart button is clicked)
  useEffect(() => {
    const urlStep = searchParams.get("step");
    if (urlStep === "intro" || !urlStep) {
      // Reset all state when navigating to intro
      setCurrentStep("intro");
      setAnswers(new Array(TOTAL_STEPS).fill(null));
      setTextAnswers(new Array(TOTAL_STEPS).fill(""));
      setResult(null);
      setSelectedFundIds([]);
      setIsAiMode(false);
    }
  }, [searchParams]);

  const isIntro = currentStep === "intro";
  const isOnResultsPage = currentStep === "result";
  const isOnAllocationPage = currentStep === "allocation";
  const isOnQuestionPage = typeof currentStep === "number";
  const currentAnswer = isOnQuestionPage ? answers[currentStep] : null;
  const currentTextAnswer = isOnQuestionPage ? textAnswers[currentStep] : "";
  
  // Validate text answer for AI mode - minimum 5 characters, maximum 50
  const isTextAnswerValid = currentTextAnswer.length >= 5 && currentTextAnswer.length <= 50;

  // Calculate result when all questions are answered
  useEffect(() => {
    if (isOnResultsPage && answers.every((a) => a !== null)) {
      const validAnswers = answers.filter((a) => a !== null) as number[];
      const calculatedResult = calculateRiskProfile(validAnswers);
      setResult(calculatedResult);
    }
  }, [isOnResultsPage, answers]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (!isOnQuestionPage) return;
    const newAnswers = [...answers];
    newAnswers[currentStep] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleTextAnswerChange = (value: string) => {
    if (!isOnQuestionPage) return;
    const newTextAnswers = [...textAnswers];
    newTextAnswers[currentStep] = value;
    setTextAnswers(newTextAnswers);
  };

  const handleStart = () => {
    setIsAiMode(false);
    setCurrentStep(0);
  };

  const handleStartAi = () => {
    setIsAiMode(true);
    setCurrentStep(0);
  };


  const handleNext = () => {
    if (!isOnQuestionPage) return;
    
    // Validate based on mode
    if (isAiMode) {
      if (!isTextAnswerValid) return;
    } else {
      if (currentAnswer === null) return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      if (currentStep < TOTAL_STEPS - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Move to results page
        setCurrentStep("result");
      }
      setIsTransitioning(false);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 150);
  };

  const handlePrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (isOnQuestionPage) {
        if (currentStep === 0) {
          // Go back to intro
          setCurrentStep("intro");
        } else {
          setCurrentStep(currentStep - 1);
        }
      } else if (isOnResultsPage) {
        // Go back to last question
        setCurrentStep(TOTAL_STEPS - 1);
      }
      setIsTransitioning(false);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 150);
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {isOnQuestionPage && (
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      )}

      <div
        className={cn(
          "flex-1 transition-opacity duration-300 overflow-y-auto",
          isTransitioning && "opacity-0"
        )}
      >
        {isIntro ? (
          <IntroPage onStart={handleStart} onStartAi={handleStartAi} />
        ) : isOnResultsPage ? (
          <ResultPage 
            result={result} 
            isAiMode={isAiMode}
            textAnswers={textAnswers}
            questions={questions}
            answers={answers}
            selectedFundIds={selectedFundIds}
            onSelectedFundsChange={setSelectedFundIds}
            onContinue={(fundIds) => {
              setSelectedFundIds(fundIds);
              setCurrentStep("allocation");
            }}
          />
        ) : isOnAllocationPage ? (
          <AllocationPage
            selectedFundIds={selectedFundIds}
            onBack={() => setCurrentStep("result")}
          />
        ) : isOnQuestionPage ? (
          <>
            <QuestionStep
              question={questions[currentStep]}
              className={cn(
                "transition-all duration-300",
                isTransitioning && "opacity-0 translate-y-4"
              )}
            />
            <div className="h-[280px]" /> {/* Spacer for sticky bottom section */}
            
            {/* Bottom section with progress bar, answers and navigation - similar to auth layout */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-10 pb-safe-area-inset-bottom">
              {/* Progress bar with max-width */}
              <div className="max-w-2xl mx-auto relative">
                <div
                  className={cn(
                    "absolute top-0 left-0 h-[1px] transition-all duration-1000 ease-linear bg-primary"
                  )}
                  style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
              
              <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {isAiMode ? (
                  <TextAnswerInput
                    question={questions[currentStep]}
                    value={currentTextAnswer}
                    onValueChange={handleTextAnswerChange}
                  />
                ) : (
                  <AnswerOptions
                    question={questions[currentStep]}
                    selectedAnswer={currentAnswer}
                    onSelect={handleAnswerSelect}
                  />
                )}
                <NavigationButtons
                  currentStep={currentStep}
                  totalSteps={TOTAL_STEPS}
                  hasAnswer={isAiMode ? isTextAnswerValid : currentAnswer !== null}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

