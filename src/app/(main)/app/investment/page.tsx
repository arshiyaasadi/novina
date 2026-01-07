"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { cn } from "@/shared/lib/utils";
import { convertToEnglishDigits } from "@/shared/lib/number-utils";
import { useTranslations } from "next-intl";

const MIN_AMOUNT = 500000; // 500,000 Toman

type LoanPeriod = 3 | 6 | 9 | null;

function InvestmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("app.investment");
  
  const LOAN_OPTIONS = [
    { months: 3 as const, interest: 3.5, label: t("loanOptions.3months") },
    { months: 6 as const, interest: 6, label: t("loanOptions.6months") },
    { months: 9 as const, interest: 11, label: t("loanOptions.9months") },
  ];
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  const [useLoan, setUseLoan] = useState(false);
  const [loanPeriod, setLoanPeriod] = useState<LoanPeriod>(null);

  useEffect(() => {
    // Load portfolio from localStorage
    try {
      const savedPortfolio = localStorage.getItem("portfolio");
      if (savedPortfolio) {
        const parsed = JSON.parse(savedPortfolio);
        setPortfolio(parsed);
      }
    } catch (error) {
      console.error("Failed to load portfolio from localStorage:", error);
    }
  }, []);

  // Check URL parameter for loan and update state
  useEffect(() => {
    const loanFromUrl = searchParams.get("loan") === "true";
    setUseLoan(loanFromUrl);
    if (!loanFromUrl) {
      setLoanPeriod(null);
    }
  }, [searchParams]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Persian/Arabic digits to English
    const converted = convertToEnglishDigits(e.target.value);
    // Remove commas and non-numeric characters
    const value = converted.replace(/[^\d]/g, "");
    
    setAmount(value);
    
    // Validate
    if (value) {
      const numericAmount = parseInt(value, 10);
      if (isNaN(numericAmount)) {
        setError(t("errors.invalidNumber"));
      } else if (numericAmount < MIN_AMOUNT) {
        setError(t("errors.minAmount", { amount: formatNumber(MIN_AMOUNT) }));
      } else {
        setError("");
      }
    } else {
      setError("");
    }
  };

  const formatNumber = (num: string | number): string => {
    const numStr = typeof num === "string" ? num : num.toString();
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleContinue = () => {
    const numericAmount = parseInt(amount.replace(/,/g, ""), 10);
    
    if (!amount || isNaN(numericAmount)) {
      setError(t("errors.required"));
      return;
    }

    if (numericAmount < MIN_AMOUNT) {
      setError(t("errors.minAmount", { amount: formatNumber(MIN_AMOUNT) }));
      return;
    }

    // Save investment data to localStorage
    try {
      localStorage.setItem("investmentAmount", numericAmount.toString());
      if (useLoan && loanPeriod) {
        localStorage.setItem("useLoan", "true");
        localStorage.setItem("loanAmount", loanAmount.toString());
        localStorage.setItem("loanPeriod", loanPeriod.toString());
        const selectedOption = LOAN_OPTIONS.find(opt => opt.months === loanPeriod);
        if (selectedOption) {
          localStorage.setItem("loanInterest", selectedOption.interest.toString());
        }
      } else {
        localStorage.setItem("useLoan", "false");
      }
      router.push("/app/investment/invoice");
    } catch (error) {
      console.error("Failed to save investment data:", error);
      setError(t("errors.saveError"));
    }
  };

  const numericAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT;
  const loanAmount = useLoan ? Math.round((numericAmount * 70) / 100) : 0;
  
  // Validation: if useLoan is true, loanPeriod must be selected
  const isLoanValid = !useLoan || (useLoan && loanPeriod !== null);
  const canContinue = isValidAmount && isLoanValid;

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col p-4 space-y-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("noPortfolioMessage")}
              </p>
              <Button
                onClick={() => router.push("/app")}
                variant="outline"
                className="w-full"
              >
                {t("backToHome")}
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guide Text */}
            <p className="text-sm text-muted-foreground text-center">
              {t("guideText")}
            </p>

            {/* Portfolio List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{t("portfolioTitle")}</h3>
              <div className="space-y-2">
                {portfolio.map((item) => (
                  <div
                    key={item.fundId}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.fundName}</p>
                    </div>
                    <div className="flex-shrink-0 mr-3">
                      <span className="text-sm font-bold tabular-nums">
                        {Math.round(item.percentage)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">{t("amountLabel")}</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder={t("amountPlaceholder")}
                value={formatNumber(amount)}
                onChange={handleAmountChange}
                className={cn(
                  "text-center font-mono text-lg",
                  error && "border-destructive"
                )}
                dir="ltr"
              />
              {error && (
                <p className="text-xs text-destructive text-right">{error}</p>
              )}
              {!error && amount && (
                <p className="text-xs text-muted-foreground text-right">
                  {t("minAmount", { amount: formatNumber(MIN_AMOUNT) })}
                </p>
              )}
            </div>

            {/* Loan Checkbox */}
            <div className="space-y-3 pt-2 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLoan}
                  onChange={(e) => {
                    setUseLoan(e.target.checked);
                    if (!e.target.checked) {
                      setLoanPeriod(null);
                    }
                  }}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm font-medium">
                  {t("loanCheckbox")}
                </span>
              </label>

              {/* Loan Details */}
              {useLoan && numericAmount > 0 && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t("loanAmount")}</span>
                      <span className="text-lg font-bold tabular-nums font-mono">
                        {formatNumber(loanAmount)} تومان
                      </span>
                    </div>
                  </div>

                  {/* Loan Period Selection */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium">{t("loanPeriodTitle")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {LOAN_OPTIONS.map((option) => (
                        <button
                          key={option.months}
                          type="button"
                          onClick={() => setLoanPeriod(option.months)}
                          className={cn(
                            "p-3 rounded-lg border text-sm font-medium transition-colors",
                            loanPeriod === option.months
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-input hover:bg-muted"
                          )}
                        >
                          <div className="text-center">
                            <div className="font-semibold">{option.label}</div>
                            <div className="text-xs opacity-90 mt-1">
                              ({t("interest", { interest: option.interest })})
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full"
              size="lg"
            >
              {t("continue")}
              <ArrowLeft className="w-4 h-4 ml-2" />
            </Button>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function InvestmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <InvestmentPageContent />
    </Suspense>
  );
}

