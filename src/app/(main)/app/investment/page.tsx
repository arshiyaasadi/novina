"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { PortfolioItem } from "@/shared/components/portfolio/portfolio-pie-chart";
import { CoinIcon } from "@/shared/components/coin-icon";
import { cn } from "@/shared/lib/utils";
import { normalizeNumericInput } from "@/shared/lib/number-utils";
import { useTranslations } from "next-intl";
import { getWalletState } from "../wallet/lib/wallet-storage";

const MIN_AMOUNT = 500000; // 500,000 Toman
const USDT_TO_TOMAN = 50_000;
const BTC_PRICE_USD = 100_000;
const USD_TO_TOMAN = 50_000;
const COLLATERAL_MAX_PERCENT = 80;

type LoanPeriod = 3 | 6 | 9 | null;
type FinancingType = "none" | "loan" | "collateral";
type CollateralAsset = "usdt" | "btc";

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
  const [financingType, setFinancingType] = useState<FinancingType>("none");
  const [loanPeriod, setLoanPeriod] = useState<LoanPeriod>(null);
  const [walletBalances, setWalletBalances] = useState<{ usdt: string; btc: string } | null>(null);
  const [collateralAsset, setCollateralAsset] = useState<CollateralAsset | null>(null);
  const [collateralPercent, setCollateralPercent] = useState(0);

  // Allocation of investment amount from each wallet
  const [allocationUsdt, setAllocationUsdt] = useState<string>("");
  const [allocationBtc, setAllocationBtc] = useState<string>("");
  const [allocationError, setAllocationError] = useState<string>("");

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

  useEffect(() => {
    const state = getWalletState();
    if (state.walletRegistered && state.walletBalances) {
      setWalletBalances(state.walletBalances);
    } else {
      setWalletBalances(null);
    }
  }, []);

  // Check URL parameter for loan and update state
  useEffect(() => {
    const loanFromUrl = searchParams.get("loan") === "true";
    if (loanFromUrl) {
      setFinancingType("loan");
    }
  }, [searchParams]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert Persian/Arabic digits to English
    const value = normalizeNumericInput(e.target.value);
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

    setAllocationError("");

    // If wallet balances are available, validate allocation before continuing
    let allocUsdt = 0;
    let allocBtc = 0;
    if (walletBalances) {
      allocUsdt = parseInt(allocationUsdt.replace(/,/g, ""), 10) || 0;
      allocBtc = parseInt(allocationBtc.replace(/,/g, ""), 10) || 0;
      const allocatedTotal = allocUsdt + allocBtc;
      if (allocatedTotal !== numericAmount) {
        setAllocationError(t("allocation.errors.totalMismatch"));
        return;
      }
    }

    // Save investment data to localStorage
    try {
      localStorage.setItem("investmentAmount", numericAmount.toString());

      // Persist allocation info only when wallets are being used
      if (walletBalances) {
        localStorage.setItem(
          "investmentAllocation",
          JSON.stringify({
            fromUsdt: allocUsdt,
            fromBtc: allocBtc,
          })
        );
      } else {
        localStorage.removeItem("investmentAllocation");
      }
      if (financingType === "none") {
        localStorage.setItem("loanType", "none");
        localStorage.setItem("useLoan", "false");
      } else if (financingType === "loan" && loanPeriod) {
        localStorage.setItem("loanType", "cash");
        localStorage.setItem("useLoan", "true");
        localStorage.setItem("loanAmount", cashLoanAmount.toString());
        localStorage.setItem("loanPeriod", loanPeriod.toString());
        const selectedOption = LOAN_OPTIONS.find(opt => opt.months === loanPeriod);
        if (selectedOption) {
          localStorage.setItem("loanInterest", selectedOption.interest.toString());
        }
      } else if (financingType === "collateral" && collateralAsset && collateralPercent > 0) {
        const valueToman = collateralAssetValueToman(collateralAsset);
        const loanAmt = Math.round((valueToman * collateralPercent) / 100);
        localStorage.setItem("loanType", "collateral");
        localStorage.setItem("useLoan", "true");
        localStorage.setItem("collateralAsset", collateralAsset);
        localStorage.setItem("collateralValueToman", valueToman.toString());
        localStorage.setItem("collateralLoanPercent", collateralPercent.toString());
        localStorage.setItem("loanAmount", loanAmt.toString());
        localStorage.setItem("loanPeriod", "12");
        localStorage.setItem("repaymentType", "lumpSum");
      }
      router.push("/app/investment/invoice");
    } catch (error) {
      console.error("Failed to save investment data:", error);
      setError(t("errors.saveError"));
    }
  };

  const numericAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT;
  const cashLoanAmount = financingType === "loan" ? Math.round((numericAmount * 70) / 100) : 0;

  const numericAllocationUsdt = parseInt(allocationUsdt.replace(/,/g, ""), 10) || 0;
  const numericAllocationBtc = parseInt(allocationBtc.replace(/,/g, ""), 10) || 0;
  const allocatedTotal = numericAllocationUsdt + numericAllocationBtc;
  const remainingToAllocate = Math.max(0, numericAmount - allocatedTotal);

  function collateralAssetValueToman(asset: CollateralAsset): number {
    if (!walletBalances) return 0;
    if (asset === "usdt") {
      return (Number(walletBalances.usdt) || 0) * USDT_TO_TOMAN;
    }
    return (Number(walletBalances.btc) || 0) * BTC_PRICE_USD * USD_TO_TOMAN;
  }

  const collateralLoanAmount =
    financingType === "collateral" && collateralAsset && collateralPercent > 0
      ? Math.round((collateralAssetValueToman(collateralAsset) * collateralPercent) / 100)
      : 0;

  const hasWalletAssets =
    walletBalances &&
    ((Number(walletBalances.usdt) || 0) > 0 || (Number(walletBalances.btc) || 0) > 0);

  const isFinancingValid =
    financingType === "none" ||
    (financingType === "loan" && loanPeriod !== null) ||
    (financingType === "collateral" && collateralAsset !== null && collateralPercent > 0 && collateralPercent <= COLLATERAL_MAX_PERCENT);
  const shouldUseAllocation = !!walletBalances;
  const canContinue =
    isValidAmount &&
    isFinancingValid &&
    (!shouldUseAllocation ||
      (allocationError === "" && numericAmount > 0 && allocatedTotal === numericAmount));

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

            {/* Wallet balances & allocation */}
            {walletBalances && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("walletSummary.title")}</p>
                  <div className="rounded-lg border bg-muted/40 divide-y">
                    <div className="flex items-center justify-between p-3 text-sm">
                      <span className="flex items-center gap-2">
                        <CoinIcon symbol="USDT" size={18} />
                        {t("walletSummary.usdt")}
                      </span>
                      <span className="font-mono text-sm">
                        {formatNumber(walletBalances.usdt || "0")} {t("walletSummary.tomanUnit")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 text-sm">
                      <span className="flex items-center gap-2">
                        <CoinIcon symbol="BTC" size={18} />
                        {t("walletSummary.btc")}
                      </span>
                      <span className="font-mono text-sm">
                        {formatNumber(walletBalances.btc || "0")} {t("walletSummary.tomanUnit")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("allocation.title")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("allocation.description")}
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t("allocation.usdtLabel")}
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatNumber(allocationUsdt)}
                        onChange={(e) => setAllocationUsdt(normalizeNumericInput(e.target.value))}
                        placeholder="0"
                        className="text-left font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t("allocation.btcLabel")}
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={formatNumber(allocationBtc)}
                        onChange={(e) => setAllocationBtc(normalizeNumericInput(e.target.value))}
                        placeholder="0"
                        className="text-left font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">{t("allocation.remainingLabel")}</span>
                    <span className="font-mono">
                      {formatNumber(remainingToAllocate)} {t("walletSummary.tomanUnit")}
                    </span>
                  </div>

                  {allocationError && (
                    <p className="text-xs text-destructive text-right">{allocationError}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={remainingToAllocate <= 0}
                    onClick={() => {
                      // Placeholder: in real flow, navigate to wallet deposit or open top-up modal
                      // Here we simply simulate that user will top up the missing amount.
                      window.location.href = "/app/wallet/deposit";
                    }}
                  >
                    {t("allocation.topupButton")}
                  </Button>
                </div>
              </div>
            )}

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

