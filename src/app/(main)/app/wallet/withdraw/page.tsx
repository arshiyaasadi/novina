"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { ArrowLeft, ArrowUpFromLine } from "lucide-react";
import { CoinIcon } from "@/shared/components/coin-icon";
import { getWalletState, setWalletBalances, formatBtcDisplay, type WalletBalances } from "../lib/wallet-storage";
import { normalizeNumericInput } from "@/shared/lib/number-utils";
import { cn } from "@/shared/lib/utils";

type AssetTab = "usdt" | "btc";

export default function WalletWithdrawPage() {
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [activeTab, setActiveTab] = useState<AssetTab>("usdt");
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const state = getWalletState();
    if (!state.walletRegistered) {
      setBalances(null);
      return;
    }
    setBalances(state.walletBalances);
  }, []);

  const currentBalance = activeTab === "usdt"
    ? (balances?.usdt != null ? Number(balances.usdt) : 0)
    : (balances?.btc != null ? Number(balances.btc) : 0);

  const handleWithdraw = () => {
    setError("");
    const rawAmount = normalizeNumericInput(amount);
    const numAmount = rawAmount ? Number(rawAmount) : 0;
    if (numAmount <= 0) {
      setError("مبلغ باید بزرگ‌تر از صفر باشد.");
      return;
    }
    const dest = destinationAddress.trim();
    if (!dest) {
      setError("آدرس مقصد را وارد کنید.");
      return;
    }
    if (numAmount > currentBalance) {
      setError("موجودی کافی نیست.");
      return;
    }

    if (balances) {
      const newBalances: WalletBalances = { ...balances };
      if (activeTab === "usdt") {
        newBalances.usdt = String(Math.max(0, currentBalance - numAmount));
      } else {
        newBalances.btc = String(Math.max(0, currentBalance - numAmount));
      }
      setWalletBalances(newBalances);
      setBalances(newBalances);
    }
    setAmount("");
    setDestinationAddress("");
    setSuccessOpen(true);
  };

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[40vh]">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!balances) {
    return (
      <div className="flex flex-col p-4 space-y-6 max-w-md mx-auto">
        <div className="flex justify-end">
          <Button variant="ghost" asChild>
            <Link href="/app/wallet" className="gap-2">
              <ArrowLeft className="w-5 h-5" />
              بازگشت
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-center">ولت یافت نشد.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ArrowUpFromLine className="w-6 h-6" />
          برداشت
        </h1>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/wallet" className="shrink-0" aria-label="بازگشت">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      <div className="flex rounded-lg border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("usdt")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors",
            activeTab === "usdt"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CoinIcon symbol="USDT" size={18} />
          تتر (USDT)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("btc")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors",
            activeTab === "btc"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CoinIcon symbol="BTC" size={18} />
          بیت‌کوین (BTC)
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinIcon symbol={activeTab === "usdt" ? "USDT" : "BTC"} size={20} />
            برداشت {activeTab === "usdt" ? "تتر" : "بیت‌کوین"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            موجودی قابل برداشت: {activeTab === "usdt" ? currentBalance.toLocaleString("fa-IR") : formatBtcDisplay(String(currentBalance))}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">مبلغ</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(normalizeNumericInput(e.target.value))}
              placeholder="۰"
              className="text-left font-mono"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">آدرس مقصد</Label>
            <Input
              id="address"
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="آدرس ولت مقصد را وارد کنید"
              className="font-mono text-sm"
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" size="lg" onClick={handleWithdraw}>
            برداشت
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-full" asChild>
        <Link href="/app/wallet">بازگشت به ولت</Link>
      </Button>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>برداشت با موفقیت ثبت شد</DialogTitle>
            <DialogDescription>
              درخواست برداشت شما ثبت شد. (این یک نمایش فرانت‌اند است؛ در محیط واقعی تراکنش روی شبکه انجام می‌شود.)
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>بستن</Button>
            <Button asChild onClick={() => setSuccessOpen(false)}>
              <Link href="/app/wallet">بازگشت به ولت</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
