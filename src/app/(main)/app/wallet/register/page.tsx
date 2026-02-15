"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ArrowLeft, Wallet, ShieldCheck } from "lucide-react";
import { completeWalletRegistration } from "../lib/wallet-storage";

const DEMO_MNEMONIC = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident",
];

export default function WalletRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [confirmIndices] = useState(() => {
    const indices: number[] = [];
    while (indices.length < 3) {
      const r = Math.floor(Math.random() * 12);
      if (!indices.includes(r)) indices.push(r);
    }
    return indices.sort((a, b) => a - b);
  });
  const [confirmSelectedOrder, setConfirmSelectedOrder] = useState<number[]>([]);
  const [error, setError] = useState("");
  const isConfirmValid = useMemo(() => {
    if (confirmSelectedOrder.length !== 3) return false;
    return (
      confirmSelectedOrder[0] === confirmIndices[0] &&
      confirmSelectedOrder[1] === confirmIndices[1] &&
      confirmSelectedOrder[2] === confirmIndices[2]
    );
  }, [confirmIndices, confirmSelectedOrder]);

  const handleComplete = () => {
    if (!isConfirmValid) {
      setError("لطفاً سه کلمه را به ترتیب درست انتخاب کنید.");
      return;
    }
    setError("");
    completeWalletRegistration();
    router.push("/app/wallet");
  };

  const handleConfirmWordClick = (index: number) => {
    if (confirmSelectedOrder.includes(index)) {
      setConfirmSelectedOrder((prev) => prev.filter((i) => i !== index));
      setError("");
      return;
    }
    if (confirmSelectedOrder.length >= 3) return;
    setConfirmSelectedOrder((prev) => [...prev, index]);
    setError("");
  };

  const removeConfirmSelection = (slotIndex: number) => {
    setConfirmSelectedOrder((prev) => prev.filter((_, i) => i !== slotIndex));
  };

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          ساخت ولت
        </h1>
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0" aria-label="بازگشت">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              ولت ارز دیجیتال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              با ساخت ولت، یک عبارت بازیابی ۱۲ کلمه‌ای دریافت می‌کنید. این عبارت را در جای امن یادداشت کنید؛ تنها راه بازیابی دسترسی به ولت شماست.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              پس از تأیید عبارت، امکان واریز و برداشت تتر و بیت‌کوین برای شما فعال می‌شود.
            </p>
            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              شروع
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>عبارت بازیابی (۱۲ کلمه)</CardTitle>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
              عبارت را در جای امن یادداشت کنید. نمایش مجدد ممکن نیست.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {DEMO_MNEMONIC.map((word, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                  <span className="font-mono text-sm dir-ltr" dir="ltr">{word}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" size="lg" onClick={() => setStep(3)}>
              ادامه
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>تأیید عبارت</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              به ترتیب روی کلمات شماره {confirmIndices[0] + 1}، {confirmIndices[1] + 1} و {confirmIndices[2] + 1} کلیک کنید. با کلیک دوباره روی هر کلمه، از انتخاب خارج می‌شود.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1.5 p-6 pt-0">
              <p className="text-sm font-medium text-muted-foreground">
                ترتیب انتخاب شما:
              </p>
              <div className="flex flex-wrap gap-2 min-h-[44px]">
                {[0, 1, 2].map((slot) => (
                  <div
                    key={slot}
                    className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 min-w-[100px]"
                  >
                    <span className="text-xs text-muted-foreground">
                      {slot + 1}.
                    </span>
                    {confirmSelectedOrder[slot] !== undefined ? (
                      <button
                        type="button"
                        onClick={() => removeConfirmSelection(slot)}
                        className="font-mono text-sm dir-ltr hover:underline"
                        dir="ltr"
                      >
                        {DEMO_MNEMONIC[confirmSelectedOrder[slot]]}
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_MNEMONIC.map((word, index) => {
                const isSelected = confirmSelectedOrder.includes(index);
                const selectedAt = confirmSelectedOrder.indexOf(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleConfirmWordClick(index)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <span className="font-mono text-sm dir-ltr" dir="ltr">
                      {word}
                    </span>
                    {selectedAt !== -1 && (
                      <span className="mr-auto text-xs text-muted-foreground">
                        #{selectedAt + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleComplete}
              disabled={!isConfirmValid}
            >
              تأیید و ساخت ولت
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
