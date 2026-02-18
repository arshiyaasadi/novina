"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Slider } from "@/shared/ui/slider";
import { getAllFunds, Fund } from "@/app/risk-assessment/data/funds";
import { getFundPrice } from "../lib/fund-prices";
import {
  getTradeOrders,
  addTradeOrder,
  type StoredTradeOrder,
  type TradeOrderType,
} from "../lib/trade-orders-storage";
import { FundSelectModal } from "../components/fund-select-modal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { appendMainWalletJournalEntry } from "../../wallet/lib/main-wallet-storage";
import { useMainWalletStore } from "../../wallet/store/main-wallet-store";
import { handlerBank, maskPanHandler } from "@/shared/lib/bank-card";
import Image from "next/image";
import { updateTradeOrderStatus } from "../lib/trade-orders-storage";
import { cn } from "@/shared/lib/utils";

type TabType = "issue" | "redeem";

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCardNumberForDisplay(card: string): string {
  const digits = card.replace(/\D/g, "");
  if (digits.length !== 16) return card;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
}

function getCardBankMeta(card: string) {
  const pan = card.replace(/\D/g, "");
  const bank = handlerBank(pan);
  const masked = maskPanHandler(pan);
  return { bank, pan, masked };
}

function normalizeAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  return Math.floor(Number(digits)) || 0;
}

/** Normalize units input: digits and at most one decimal point, one decimal place */
function normalizeUnitsInput(value: string): string {
  const en = value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const hasDot = en.includes(".");
  const [intPart, decPart] = en.split(".");
  const cleanInt = (intPart ?? "").replace(/\D/g, "");
  const cleanDec = (decPart ?? "").replace(/\D/g, "").slice(0, 1);
  if (!hasDot && !decPart) return cleanInt;
  return cleanInt + "." + cleanDec;
}

const ORDER_STATUS_LABEL: Record<StoredTradeOrder["status"], string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار",
  completed: "تکمیل شده",
  expired: "منقضی شده",
  cancelled: "لغو شده",
};

function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "همین الان";
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  if (diffDays < 2) return "دیروز";
  if (diffDays < 7) return `${diffDays} روز پیش`;
  return d.toLocaleDateString("fa-IR", { month: "short", day: "numeric", year: "numeric" });
}

export default function AssetsTradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get("tab") === "redeem" ? "redeem" : "issue") as TabType;
  const fundIdParam = searchParams.get("fundId");
  const isCommitMode = searchParams.get("mode") === "commit";

  const [activeTab, setActiveTab] = useState<TabType>(tabParam);
  const [funds] = useState<Fund[]>(() => getAllFunds());
  const [selectedFundId, setSelectedFundId] = useState<string | null>(fundIdParam ? String(fundIdParam) : null);
  const [amountRaw, setAmountRaw] = useState("");
  const [unitsRaw, setUnitsRaw] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<StoredTradeOrder | null>(null);
  const mainWalletBalance = useMainWalletStore((s) => s.mainWalletBalance);
  const walletCreditsFromStore = useMainWalletStore((s) => s.walletCredits);
  const setStoreBalance = useMainWalletStore((s) => s.setMainWalletBalance);
  const setStoreCredits = useMainWalletStore((s) => s.setWalletCredits);
  const [latestInvestment, setLatestInvestment] = useState<{
    investmentAmount: number;
    portfolio: Array<{ fundId: number; percentage: number }>;
  } | null>(null);
  const [redeemConfirmModalOpen, setRedeemConfirmModalOpen] = useState(false);
  const [redeemSuccessReceipt, setRedeemSuccessReceipt] = useState(false);
  const [redeemReceiptCountdown, setRedeemReceiptCountdown] = useState(0);
  const [issueSuccessReceipt, setIssueSuccessReceipt] = useState(false);
  const [issueReceiptCountdown, setIssueReceiptCountdown] = useState(0);
  const [lastCompletedIssueOrder, setLastCompletedIssueOrder] = useState<StoredTradeOrder | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [mainWalletCards, setMainWalletCards] = useState<string[]>([]);
  const [selectedCardForDeposit, setSelectedCardForDeposit] = useState<string | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositAmountRial, setDepositAmountRial] = useState(0);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);

  const priceInfo = selectedFundId ? getFundPrice(Number(selectedFundId)) : undefined;
  const pricePerUnit = priceInfo?.currentPrice ?? 0;
  const selectedFund = selectedFundId ? funds.find((f) => f.id === Number(selectedFundId)) : null;

  /** For redeem: number of units available to the user for this fund (from latestInvestment) */
  const availableUnitsForRedeem =
    activeTab === "redeem" && selectedFundId && pricePerUnit > 0 && latestInvestment
      ? (() => {
          const item = latestInvestment.portfolio.find(
            (p) => p.fundId === Number(selectedFundId)
          );
          if (!item) return 0;
          const fundAmount = (latestInvestment.investmentAmount * item.percentage) / 100;
          return fundAmount / pricePerUnit;
        })()
      : 0;
  const hasRedeemUnits = availableUnitsForRedeem > 0;

  useEffect(() => {
    const t = searchParams.get("tab");
    const f = searchParams.get("fundId");
    const viewId = searchParams.get("view");
    if (t === "redeem") setActiveTab("redeem");
    else setActiveTab("issue");
    if (f) setSelectedFundId(f);
    if (viewId) {
      const list = getTradeOrders();
      const order = list.find((o) => o.id === viewId);
      if (order) {
        setViewingOrder(order);
        setStep(2);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    useMainWalletStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!depositModalOpen) return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("mainWalletCards") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMainWalletCards(parsed);
        else setMainWalletCards([]);
      } else setMainWalletCards([]);
    } catch {
      setMainWalletCards([]);
    }
    setSelectedCardForDeposit(null);
    setDepositAmountInput("");
    setDepositAmountRial(0);
  }, [depositModalOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("latestInvestment");
      if (saved) {
        const parsed = JSON.parse(saved) as {
          investmentAmount?: number;
          portfolio?: Array<{ fundId: number; percentage: number }>;
        };
        if (
          parsed &&
          typeof parsed.investmentAmount === "number" &&
          Array.isArray(parsed.portfolio)
        ) {
          setLatestInvestment({
            investmentAmount: parsed.investmentAmount,
            portfolio: parsed.portfolio,
          });
          return;
        }
      }
    } catch {
      // ignore
    }
    setLatestInvestment(null);
  }, []);

  const amountNum = useCallback(() => normalizeAmountInput(amountRaw), [amountRaw]);
  const unitsNum = useCallback(() => parseFloat(unitsRaw) || 0, [unitsRaw]);
  /** Redeem slider: percentage of available units (0–100) */
  const redeemPercent = hasRedeemUnits
    ? Math.min(100, (unitsNum() / availableUnitsForRedeem) * 100)
    : 0;
  const amountValue = amountNum();
  const sliderAmount = mainWalletBalance > 0 ? Math.min(amountValue, mainWalletBalance) : 0;
  const step10Percent = mainWalletBalance > 0 ? Math.max(1, Math.floor(mainWalletBalance / 10)) : 1;
  const SLIDER_MARKS = 10; // دایره هر ۱۰٪

  const handleAmountChange = (value: string) => {
    setAmountRaw(value);
    const amount = normalizeAmountInput(value);
    if (!pricePerUnit) return;
    const units = amount / pricePerUnit;
    setUnitsRaw(units.toFixed(1).replace(/(\.\d?)0*$/, "$1"));
  };

  const handleAmountBlur = () => {
    const amount = amountNum();
    if (amount === 0) setAmountRaw("");
    else setAmountRaw(formatNumber(amount));
  };

  const handleUnitsChange = (value: string) => {
    const normalized = normalizeUnitsInput(value);
    setUnitsRaw(normalized);
    if (!pricePerUnit) return;
    const units = parseFloat(normalized) || 0;
    const amount = Math.round(units * pricePerUnit);
    setAmountRaw(formatNumber(amount));
  };

  useEffect(() => {
    if (!pricePerUnit || !amountRaw) return;
    const amount = amountNum();
    if (amount <= 0) return;
    const units = amount / pricePerUnit;
    setUnitsRaw(units.toFixed(1).replace(/(\.\d?)0*$/, "$1"));
  }, [selectedFundId, pricePerUnit]);

  useEffect(() => {
    if (activeTab === "redeem" && !hasRedeemUnits) {
      setUnitsRaw("");
      setAmountRaw("");
    }
  }, [activeTab, hasRedeemUnits]);

  useEffect(() => {
    if (!redeemSuccessReceipt) return;
    setRedeemReceiptCountdown(5);
    const id = setInterval(() => {
      setRedeemReceiptCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setRedeemSuccessReceipt(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [redeemSuccessReceipt]);

  useEffect(() => {
    if (!issueSuccessReceipt) return;
    setIssueReceiptCountdown(5);
    const id = setInterval(() => {
      setIssueReceiptCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setIssueSuccessReceipt(false);
          setLastCompletedIssueOrder(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [issueSuccessReceipt]);

  const handleContinueToInvoice = () => {
    if (!selectedFund || !priceInfo) return;
    const amount = amountNum();
    const units = unitsNum();
    if (amount <= 0 || units <= 0) return;
    const created = addTradeOrder({
      type: activeTab,
      fundId: selectedFund.id,
      fundName: selectedFund.name,
      pricePerUnit: priceInfo.currentPrice,
      units,
      amount,
      status: "draft",
    });
    setViewingOrder(created);
    setStep(2);
  };

  const handleBackFromInvoice = () => {
    setViewingOrder(null);
    setStep(1);
  };

  const displayAmount = amountNum();
  const displayUnits = unitsNum();
  const isInvoiceStep = step === 2;
  const showTabs = !isInvoiceStep;

  const currentInvoiceOrder = viewingOrder ?? (isInvoiceStep && selectedFund && priceInfo
    ? {
        id: "",
        type: activeTab as TradeOrderType,
        fundId: selectedFund.id,
        fundName: selectedFund.name,
        pricePerUnit: priceInfo.currentPrice,
        units: displayUnits,
        amount: displayAmount,
        status: "draft" as const,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      }
    : null);

  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Tab bar — hidden on invoice step */}
        {!isInvoiceStep && (
        <div className="flex flex-row rounded-xl border bg-muted/30 p-1.5" dir="rtl">
          <button
            type="button"
            className={cn(
              "order-1 flex-1 min-w-0 shrink-0 basis-0 rounded-lg py-2.5 text-sm font-medium transition-colors",
              !isCommitMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => router.push("/app/assets/trade?tab=issue")}
          >
            معامله
          </button>
          <button
            type="button"
            className={cn(
              "order-2 flex-1 min-w-0 shrink-0 basis-0 rounded-lg py-2.5 text-sm font-medium transition-colors",
              isCommitMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => router.push("/app/assets/trade?mode=commit&tab=issue")}
          >
            معامله تعهدی
          </button>
          <button
            type="button"
            className="order-3 flex-1 min-w-0 shrink-0 basis-0 rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => router.push("/app/assets?tab=funds")}
          >
            صندوق‌ها
          </button>
        </div>
        )}

        {isCommitMode && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-right space-y-1">
            <p className="font-medium">معامله تعهدی (X2)</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              می‌توانی تا سقف ۱۰۰ میلیون تومان معامله خود را تعهدی کنی و با ضریب X2 به دوبرابر برسانی. در زمان ست
              شدن معامله، تعداد واحد (سهم) دریافتی‌ات دو برابر محاسبه می‌شود.
            </p>
          </div>
        )}

        {showTabs && (
          <div className="flex rounded-xl border bg-muted/30 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("issue")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors min-w-0",
                activeTab === "issue"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              صدور
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("redeem")}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors min-w-0",
                activeTab === "redeem"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              ابطال
            </button>
          </div>
        )}

        {(activeTab === "issue" || activeTab === "redeem") && step === 1 && (
          <>
          <Card>
            <CardContent className="space-y-4 pt-6">
              {activeTab === "issue" && issueSuccessReceipt && lastCompletedIssueOrder ? (
                <>
                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-medium text-center">رسید صدور موفق</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">صندوق</span>
                        <span className="font-medium">{lastCompletedIssueOrder.fundName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مبلغ هر واحد</span>
                        <span className="tabular-nums">
                          {formatNumber(lastCompletedIssueOrder.pricePerUnit)} تومان
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تعداد واحد</span>
                        <span className="tabular-nums">{Number(lastCompletedIssueOrder.units).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">مبلغ قابل پرداخت</span>
                        <span className="font-bold tabular-nums">
                          {formatNumber(lastCompletedIssueOrder.amount)} تومان
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-medium">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm">
                        ✓
                      </span>
                      وضعیت: موفق
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIssueSuccessReceipt(false);
                      setIssueReceiptCountdown(0);
                      setLastCompletedIssueOrder(null);
                    }}
                  >
                    بازگشت به معامله
                    {issueReceiptCountdown > 0 ? ` (${issueReceiptCountdown})` : ""}
                  </Button>
                </>
              ) : activeTab === "redeem" && redeemSuccessReceipt ? (
                <>
                  <div className="space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-medium text-center">رسید درخواست ابطال</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">صندوق</span>
                        <span className="font-medium">{selectedFund?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مبلغ هر واحد</span>
                        <span className="tabular-nums">
                          {priceInfo ? formatNumber(priceInfo.currentPrice) : "—"} تومان
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تعداد واحد</span>
                        <span className="tabular-nums">{displayUnits.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">مبلغ قابل دریافت</span>
                        <span className="font-bold tabular-nums">
                          {formatNumber(displayAmount)} تومان
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-medium">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-sm">
                        ✓
                      </span>
                      وضعیت: موفق
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setRedeemSuccessReceipt(false);
                      setRedeemReceiptCountdown(0);
                    }}
                  >
                    بازگشت به معامله
                    {redeemReceiptCountdown > 0 ? ` (${redeemReceiptCountdown})` : ""}
                  </Button>
                </>
              ) : (
                <>
              <div className="space-y-2">
                <Label>صندوق</Label>
                <button
                  type="button"
                  onClick={() => setFundModalOpen(true)}
                  className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                  <span className={cn("flex-1 text-right", !selectedFund && "text-muted-foreground")}>
                    {selectedFund ? selectedFund.name : "انتخاب صندوق"}
                  </span>
                </button>
              </div>

              <FundSelectModal
                open={fundModalOpen}
                onOpenChange={setFundModalOpen}
                funds={funds}
                selectedFundId={selectedFundId}
                onSelect={(id) => {
                  setSelectedFundId(id);
                  setAmountRaw("");
                  setUnitsRaw("");
                }}
              />

              {selectedFund && priceInfo && (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <span className="text-xs text-muted-foreground">مبلغ هر واحد</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(priceInfo.currentPrice)} تومان
                      </span>
                      {priceInfo.change24h >= 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{priceInfo.change24h.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {priceInfo.change24h.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>تعداد واحد تقریبی</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      value={unitsRaw}
                      onChange={(e) => handleUnitsChange(e.target.value)}
                      placeholder="0"
                      className="font-mono text-left"
                      disabled={activeTab === "redeem" && !hasRedeemUnits}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">در دسترس</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold tabular-nums">
                          {activeTab === "redeem"
                            ? `${formatNumber(Math.round(availableUnitsForRedeem * 10) / 10)} واحد`
                            : `${formatNumber(mainWalletBalance)} تومان`}
                        </span>
                        {activeTab === "issue" && (
                          <button
                            type="button"
                            onClick={() => setDepositModalOpen(true)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors"
                            aria-label="افزایش موجودی"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative w-full">
                      <div className="relative h-6 flex items-center">
                        {activeTab === "issue" ? (
                          <>
                            <Slider
                              dir="ltr"
                              min={0}
                              max={mainWalletBalance || 1}
                              step={step10Percent}
                              value={[sliderAmount]}
                              onValueChange={(value) =>
                                handleAmountChange(formatNumber(value[0] ?? 0))
                              }
                              className="w-full"
                              aria-label="انتخاب مبلغ از موجودی"
                            />
                            <div
                              className="absolute inset-0 pointer-events-none flex items-center"
                              aria-hidden
                            >
                              <div className="relative h-2 w-full">
                                {Array.from({ length: SLIDER_MARKS }, (_, i) => {
                                  const pct = ((i + 1) / SLIDER_MARKS) * 100;
                                  return (
                                    <span
                                      key={i}
                                      className="absolute top-1/2 h-2 w-2 rounded-full bg-white"
                                      style={{
                                        left: `${pct}%`,
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Slider
                              dir="ltr"
                              min={0}
                              max={100}
                              step={10}
                              value={[redeemPercent]}
                              onValueChange={(value) => {
                                const pct = value[0] ?? 0;
                                const u = (availableUnitsForRedeem * pct) / 100;
                                setUnitsRaw(u > 0 ? u.toFixed(1).replace(/(\.\d?)0*$/, "$1") : "");
                                setAmountRaw(
                                  u > 0 ? formatNumber(Math.round(u * pricePerUnit)) : ""
                                );
                              }}
                              className="w-full"
                              aria-label="انتخاب درصد از واحد در دسترس"
                              disabled={!hasRedeemUnits}
                            />
                            <div
                              className="absolute inset-0 pointer-events-none flex items-center"
                              aria-hidden
                            >
                              <div className="relative h-2 w-full">
                                {Array.from({ length: SLIDER_MARKS }, (_, i) => {
                                  const pct = ((i + 1) / SLIDER_MARKS) * 100;
                                  return (
                                    <span
                                      key={i}
                                      className="absolute top-1/2 h-2 w-2 rounded-full bg-white"
                                      style={{
                                        left: `${pct}%`,
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>مبلغ درخواستی (تومان)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={amountRaw}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      onBlur={handleAmountBlur}
                      placeholder="0"
                      className="font-mono text-left"
                      disabled={activeTab === "redeem" && !hasRedeemUnits}
                    />
                  </div>
                </>
              )}

              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full bg-transparent",
                  activeTab === "redeem"
                    ? "border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                    : "border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                )}
                disabled={
                  !selectedFundId ||
                  !pricePerUnit ||
                  displayAmount <= 0 ||
                  (activeTab === "redeem" && !hasRedeemUnits)
                }
                onClick={
                  activeTab === "redeem"
                    ? () => setRedeemConfirmModalOpen(true)
                    : handleContinueToInvoice
                }
              >
                <span>
                  {activeTab === "redeem" ? "درخواست ابطال" : "ادامه مشاهده فاکتور"}
                </span>
              </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">آخرین معاملات</h3>
                <button
                  type="button"
                  onClick={() => router.push("/app/activities?type=trade")}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  مشاهده همه
                </button>
              </div>
              {(() => {
                const recentOrders = getTradeOrders().slice(0, 3);
                return recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">هنوز معامله‌ای ثبت نشده است.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentOrders.map((order) => (
                      <li key={order.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingOrder(order);
                            setStep(2);
                          }}
                          className="w-full text-right rounded-lg border border-border/60 bg-white hover:bg-muted/30 transition-colors p-3"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                order.type === "issue" ? "bg-green-500/15 text-green-700" : "bg-red-500/15 text-red-700"
                              )}
                            >
                              {order.type === "issue" ? "صدور" : "ابطال"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatOrderDate(order.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate mb-1">
                            {order.fundName}
                          </p>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <span className="tabular-nums">
                              {Number(order.units).toFixed(1)} واحد
                            </span>
                            <span className="tabular-nums font-medium text-foreground">
                              {formatNumber(order.amount)} تومان
                            </span>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-border/40 flex justify-end">
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                order.status === "completed" && "text-green-600",
                                order.status === "expired" && "text-amber-600",
                                order.status === "draft" && "text-muted-foreground"
                              )}
                            >
                              {ORDER_STATUS_LABEL[order.status]}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </>
        )}

        <Dialog open={redeemConfirmModalOpen} onOpenChange={setRedeemConfirmModalOpen}>
          <DialogContent
            className="max-w-md mx-4 space-y-6"
            showClose={true}
            onClose={() => setRedeemConfirmModalOpen(false)}
          >
            <DialogHeader className="space-y-1">
              <DialogTitle>جزئیات درخواست ابطال</DialogTitle>
            </DialogHeader>
            {selectedFund && priceInfo && (
              <div className="space-y-4 rounded-lg border p-5 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">صندوق</span>
                  <span className="font-medium">{selectedFund.name}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">مبلغ هر واحد</span>
                  <span className="tabular-nums">
                    {formatNumber(priceInfo.currentPrice)} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">تعداد واحد</span>
                  <span className="tabular-nums">{displayUnits.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t">
                  <span className="font-medium">مبلغ قابل دریافت</span>
                  <span className="font-bold tabular-nums">
                    {formatNumber(displayAmount)} تومان
                  </span>
                </div>
              </div>
            )}
            <DialogFooter className="flex-row gap-3 sm:gap-3 pt-2">
              <Button
                type="button"
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  setRedeemConfirmModalOpen(false);
                  setRedeemSuccessReceipt(true);
                  if (latestInvestment && displayAmount > 0) {
                    const nextAmount = Math.max(
                      0,
                      latestInvestment.investmentAmount - displayAmount
                    );
                    const next = {
                      ...latestInvestment,
                      investmentAmount: nextAmount,
                    };
                    setLatestInvestment(next);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("latestInvestment", JSON.stringify(next));
                    }
                  }
                }}
              >
                ابطال
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setRedeemConfirmModalOpen(false)}
              >
                انصراف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
          <DialogContent onClose={() => setDepositModalOpen(false)}>
            <DialogHeader>
              <DialogTitle>افزایش موجودی</DialogTitle>
              <DialogDescription>
                از بین کارت‌های بانکی خود یک کارت را انتخاب کنید و مبلغ را وارد کنید.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">انتخاب کارت بانکی</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mainWalletCards.map((card) => {
                    const selected = selectedCardForDeposit === card;
                    const { bank, masked } = getCardBankMeta(card);
                    const logoSrc = `/images/bankLogos/${bank.logo}`;
                    return (
                      <button
                        key={card}
                        type="button"
                        onClick={() => setSelectedCardForDeposit(card)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-muted bg-muted/40 hover:bg-muted/70"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 overflow-hidden rounded-full bg-muted">
                            <Image
                              src={logoSrc}
                              alt={bank.bankName || "لوگوی بانک"}
                              fill
                              sizes="24px"
                              className="object-contain"
                            />
                          </div>
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-[11px] font-medium">
                              {bank.bankName || "کارت بانکی"}
                            </span>
                            <span dir="ltr" className="tabular-nums text-[11px] text-muted-foreground">
                              {formatCardNumberForDisplay(masked)}
                            </span>
                          </div>
                        </div>
                        {selected && (
                          <span className="text-xs text-primary font-medium">انتخاب شده</span>
                        )}
                      </button>
                    );
                  })}
                  {mainWalletCards.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      هیچ کارتی ثبت نشده است. از صفحه اصلی کیف پول کارت بانکی اضافه کنید.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="trade-deposit-amount">
                  مبلغ واریز (ریال)
                </label>
                <input
                  id="trade-deposit-amount"
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="مثلاً ۱,۰۰۰,۰۰۰"
                  value={depositAmountInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
                    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
                    let digits = "";
                    for (const ch of raw) {
                      if (ch >= "0" && ch <= "9") digits += ch;
                      else {
                        const pIndex = persianDigits.indexOf(ch);
                        const aIndex = arabicDigits.indexOf(ch);
                        if (pIndex !== -1) digits += String(pIndex);
                        else if (aIndex !== -1) digits += String(aIndex);
                      }
                    }
                    digits = digits.slice(0, 15);
                    const amountRial = digits ? Number(digits) : 0;
                    setDepositAmountRial(amountRial);
                    setDepositAmountInput(digits ? formatNumber(amountRial) : "");
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                موجودی فعلی: {formatNumber(mainWalletBalance)} تومان
              </p>
              <Button
                type="button"
                className="w-full"
                disabled={
                  isProcessingDeposit ||
                  !selectedCardForDeposit ||
                  Math.floor(depositAmountRial / 10) <= 0
                }
                onClick={() => {
                  const depositToman = Math.floor(depositAmountRial / 10);
                  if (!selectedCardForDeposit || depositToman <= 0) return;
                  setIsProcessingDeposit(true);
                  setTimeout(() => {
                    const next = Math.max(0, useMainWalletStore.getState().mainWalletBalance + depositToman);
                    setStoreBalance(next);
                    appendMainWalletJournalEntry({
                      type: "deposit",
                      amount: depositToman,
                      source: "main",
                      description: "واریز به کیف پول",
                    });
                    setIsProcessingDeposit(false);
                    setDepositModalOpen(false);
                    setDepositAmountInput("");
                    setDepositAmountRial(0);
                    setSelectedCardForDeposit(null);
                  }, 1500);
                }}
              >
                {isProcessingDeposit ? "در حال پردازش..." : "پرداخت"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {isInvoiceStep && currentInvoiceOrder && (
          <Card>
            <CardHeader className="space-y-1.5">
              <CardTitle className="text-base">
                {currentInvoiceOrder.type === "issue" ? "فاکتور صدور" : "فاکتور ابطال"}
              </CardTitle>
              {currentInvoiceOrder.id && (
                <p className="text-sm text-muted-foreground">
                  شماره فاکتور: <span className="font-medium tabular-nums text-foreground">{currentInvoiceOrder.id.replace(/^trade-/, "")}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                وضعیت:{" "}
                <span className={currentInvoiceOrder.status === "completed" ? "font-semibold text-green-600" : "font-medium text-foreground"}>
                  {currentInvoiceOrder.type === "issue"
                    ? currentInvoiceOrder.status === "completed"
                      ? "صدور"
                      : "در انتظار صدور"
                    : currentInvoiceOrder.status === "completed"
                      ? "ابطال"
                      : "در انتظار ابطال"}
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {new Date(currentInvoiceOrder.expiresAt) > new Date() ? (
                <p className="text-xs text-amber-600 font-medium">
                  این فاکتور ۲ دقیقه اعتبار دارد.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  این فاکتور منقضی شده است.
                </p>
              )}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">صندوق</span>
                  <span className="font-medium">{currentInvoiceOrder.fundName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مبلغ هر واحد</span>
                  <span className="tabular-nums">
                    {formatNumber(currentInvoiceOrder.pricePerUnit)} تومان
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تعداد واحد</span>
                  <span className="tabular-nums">
                    {Number(currentInvoiceOrder.units).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">
                    {currentInvoiceOrder.type === "issue" ? "مبلغ قابل پرداخت" : "مبلغ قابل دریافت"}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatNumber(currentInvoiceOrder.amount)} تومان
                  </span>
                </div>
              </div>
              {currentInvoiceOrder.type === "issue" && (() => {
                const amount = currentInvoiceOrder.amount;
                const credits = walletCreditsFromStore;
                const mainBalance = mainWalletBalance;
                const cryptoTwin = credits.crypto + credits.twin;
                let takeFromCryptoTwin = Math.min(amount, cryptoTwin);
                let remaining = amount - takeFromCryptoTwin;
                const takeFromLoan = Math.min(remaining, credits.loan);
                remaining -= takeFromLoan;
                const takeFromMain = Math.min(remaining, mainBalance);
                const takeFromCrypto = Math.min(takeFromCryptoTwin, credits.crypto);
                const takeFromTwin = takeFromCryptoTwin - takeFromCrypto;
                const totalCovered = takeFromCryptoTwin + takeFromLoan + takeFromMain;
                const canIssue = totalCovered >= amount;

                const rows: { label: string; balance: number; take: number }[] = [
                  { label: "اعتبار کریپتو + TWIN", balance: cryptoTwin, take: takeFromCryptoTwin },
                  { label: "اعتبار وام", balance: credits.loan, take: takeFromLoan },
                  { label: "موجودی کیف پول", balance: mainBalance, take: takeFromMain },
                ].filter((r) => r.balance > 0);

                return (
                  <>
                    <div className="rounded-xl border border-border bg-muted/30 px-4 py-4 overflow-x-auto">
                      <h3 className="text-sm font-semibold text-foreground mb-3">کیف پول و موجودی‌ها</h3>
                      {rows.length > 0 ? (
                        <table className="w-full min-w-[280px] text-sm border-collapse" dir="rtl">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">نوع اعتبار</th>
                              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">موجودی</th>
                              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">برداشت</th>
                              <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">مانده</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {rows.map((r) => (
                              <tr key={r.label} className="border-b border-border/60 last:border-0">
                                <td className="py-2.5 px-3 text-foreground font-medium">{r.label}</td>
                                <td className="py-2.5 px-3 tabular-nums text-foreground">{formatNumber(r.balance)}</td>
                                <td className="py-2.5 px-3 tabular-nums text-foreground">{r.take > 0 ? formatNumber(r.take) : "—"}</td>
                                <td className="py-2.5 px-3 tabular-nums font-semibold text-foreground">{formatNumber(r.balance - r.take)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-muted-foreground py-3">موجودی قابل استفاده‌ای ثبت نشده است.</p>
                      )}
                      {!canIssue && (
                        <p className="text-sm text-destructive font-medium mt-3">
                          مجموع موجودی‌ها برای این مبلغ کافی نیست.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        className="w-full bg-green-600 hover:bg-green-700 text-white border-0 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
                        disabled={!canIssue || currentInvoiceOrder.status === "completed"}
                        onClick={() => {
                          if (!canIssue || currentInvoiceOrder.status === "completed") return;
                          const creds = useMainWalletStore.getState().walletCredits;
                          const main = useMainWalletStore.getState().mainWalletBalance;
                          setStoreCredits({
                            loan: creds.loan - takeFromLoan,
                            funds: creds.funds,
                            crypto: creds.crypto - takeFromCrypto,
                            twin: creds.twin - takeFromTwin,
                          });
                          setStoreBalance(main - takeFromMain);
                          if (takeFromCrypto > 0) {
                            appendMainWalletJournalEntry({
                              type: "use_for_issue",
                              amount: takeFromCrypto,
                              source: "crypto",
                              description: "استفاده برای صدور",
                              reference: currentInvoiceOrder.fundName,
                            });
                          }
                          if (takeFromTwin > 0) {
                            appendMainWalletJournalEntry({
                              type: "use_for_issue",
                              amount: takeFromTwin,
                              source: "twin",
                              description: "استفاده برای صدور",
                              reference: currentInvoiceOrder.fundName,
                            });
                          }
                          if (takeFromLoan > 0) {
                            appendMainWalletJournalEntry({
                              type: "use_for_issue",
                              amount: takeFromLoan,
                              source: "loan",
                              description: "استفاده برای صدور",
                              reference: currentInvoiceOrder.fundName,
                            });
                          }
                          if (takeFromMain > 0) {
                            appendMainWalletJournalEntry({
                              type: "use_for_issue",
                              amount: takeFromMain,
                              source: "main",
                              description: "استفاده برای صدور",
                              reference: currentInvoiceOrder.fundName,
                            });
                          }
                          if (currentInvoiceOrder.id) {
                            updateTradeOrderStatus(currentInvoiceOrder.id, "completed");
                            const updated = getTradeOrders().find((o) => o.id === currentInvoiceOrder.id);
                            if (updated) {
                              setLastCompletedIssueOrder(updated);
                              setIssueSuccessReceipt(true);
                              handleBackFromInvoice();
                            }
                          }
                        }}
                      >
                        {currentInvoiceOrder.status === "completed" ? "صدور شده" : "صدور"}
                      </Button>
                      <Button type="button" variant="outline" className="w-full" onClick={handleBackFromInvoice}>
                        {viewingOrder ? "بستن" : "بازگشت به ویرایش"}
                      </Button>
                    </div>
                  </>
                );
              })()}
              {currentInvoiceOrder.type !== "issue" && (
                <Button type="button" variant="outline" className="w-full" onClick={handleBackFromInvoice}>
                  {viewingOrder ? "بستن" : "بازگشت به ویرایش"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
