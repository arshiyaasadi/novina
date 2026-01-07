"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface InitialLoadingProps {
  onComplete: () => void;
}

export function InitialLoading({ onComplete }: InitialLoadingProps) {
  const t = useTranslations("auth.initialLoading");
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fade-in animation for logo and name
    setShowContent(true);

    // Auto transition after 2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo placeholder */}
        <div
          className={`h-24 w-24 rounded-2xl border-2 border-primary bg-card transition-opacity duration-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Project name */}
        <h1
          className={`text-3xl font-bold transition-opacity duration-500 delay-200 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          {t("projectName")}
        </h1>

        {/* Loading indicator */}
        <div
          className={`mt-8 transition-opacity duration-500 delay-300 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="h-1 w-32 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full animate-[loading_2s_ease-in-out] bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

