"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { cn } from "@/shared/lib/utils";
import { convertToEnglishDigits } from "@/shared/lib/number-utils";

const MIN_AMOUNT = 500000; // 500,000 تومان

type LoanPeriod = 3 | 6 | 9 | null;

const LOAN_OPTIONS = [
  { months: 3 as const, interest: 3.5, label: "۳ ماه" },
  { months: 6 as const, interest: 6, label: "۶ ماه" },
  { months: 9 as const, interest: 11, label: "۹ ماه" },
];

export default function InvestmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
        setError("لطفاً فقط عدد وارد کنید");
      } else if (numericAmount < MIN_AMOUNT) {
        setError(`حداقل مبلغ سرمایه‌گذاری ${formatNumber(MIN_AMOUNT)} تومان است`);
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
      setError("لطفاً مبلغ را وارد کنید");
      return;
    }

    if (numericAmount < MIN_AMOUNT) {
      setError(`حداقل مبلغ سرمایه‌گذاری ${formatNumber(MIN_AMOUNT)} تومان است`);
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
      setError("خطا در ذخیره اطلاعات");
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
              <CardTitle>سرمایه‌گذاری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                لطفاً ابتدا پورتفوی خود را در صفحه اصلی تنظیم کنید.
              </p>
              <Button
                onClick={() => router.push("/app")}
                variant="outline"
                className="w-full"
              >
                بازگشت به صفحه اصلی
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
            <CardTitle>سرمایه‌گذاری</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guide Text */}
            <p className="text-sm text-muted-foreground text-center">
              مبلغ سرمایه گذاری رو وارد کن
            </p>

            {/* Portfolio List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">پورتفوی انتخابی:</h3>
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
              <Label htmlFor="amount">مبلغ سرمایه‌گذاری (تومان)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
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
                  حداقل مبلغ: {formatNumber(MIN_AMOUNT)} تومان
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
                  ۷۰ درصد مبلغ رو وام دریافت کن
                </span>
              </label>

              {/* Loan Details */}
              {useLoan && numericAmount > 0 && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">مبلغ وام:</span>
                      <span className="text-lg font-bold tabular-nums font-mono">
                        {formatNumber(loanAmount)} تومان
                      </span>
                    </div>
                  </div>

                  {/* Loan Period Selection */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium">مدت زمان بازپرداخت:</p>
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
                              ({option.interest}% سود)
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
              ادامه
              <ArrowLeft className="w-4 h-4 ml-2" />
            </Button>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

