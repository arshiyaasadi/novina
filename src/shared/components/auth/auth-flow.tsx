"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InitialLoading } from "./initial-loading";
import { SplashScreen } from "./splash-screen";

type AuthStep = "loading" | "splash" | "complete";

export function AuthFlow() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("loading");

  const handleLoadingComplete = () => {
    setStep("splash");
  };

  const handleSplashComplete = () => {
    // Navigate to login page after splash screen
    router.push("/login");
  };

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-[480px] h-full overflow-hidden">
        {step === "loading" && (
          <InitialLoading onComplete={handleLoadingComplete} />
        )}
        {step === "splash" && <SplashScreen onComplete={handleSplashComplete} />}
      </div>
    </div>
  );
}

