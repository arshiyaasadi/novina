"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

function ReceiptPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [callbackUrl, setCallbackUrl] = useState<string>("/app");

  useEffect(() => {
    // Get amount and status from URL
    const urlAmount = searchParams.get("amount");
    const urlStatus = searchParams.get("status");
    const urlCallback = searchParams.get("callback");

    if (urlAmount) {
      setAmount(urlAmount);
    }

    if (urlStatus) {
      setStatus(urlStatus);
    }

    if (urlCallback) {
      setCallbackUrl(urlCallback);
    }
  }, [searchParams]);

  const formatNumber = (num: string | number): string => {
    const numStr = typeof num === "string" ? num : num.toString();
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const isSuccess = status === "success" || status === "موفق";

  const handleContinue = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Status Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isSuccess ? "پرداخت موفق" : "پرداخت ناموفق"}
          </h1>
          <p className="text-muted-foreground">
            {isSuccess
              ? "پرداخت شما با موفقیت انجام شد"
              : "متأسفانه پرداخت شما انجام نشد. لطفاً دوباره تلاش کنید."}
          </p>
        </div>

        {/* Amount */}
        {amount && (
          <div className="p-6 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground mb-2">مبلغ پرداختی:</p>
            <p className="text-3xl font-bold tabular-nums">
              {formatNumber(amount)} تومان
            </p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full"
          size="lg"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          ادامه
        </Button>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ReceiptPageContent />
    </Suspense>
  );
}

