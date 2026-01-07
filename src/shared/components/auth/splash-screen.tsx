"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { SplashSlide } from "./splash-slide";

interface SplashScreenProps {
  onComplete: () => void;
}

const TOTAL_SLIDES = 3;

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const t = useTranslations("auth.splash");
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const projectNameT = useTranslations("auth.initialLoading");

  const slides = [
    {
      title: t("slide1.title"),
      showLogo: true,
      projectName: projectNameT("projectName"),
    },
    {
      title: t("slide2.title"),
      showLogo: false,
      prefix: "الف",
    },
    {
      title: t("slide3.title"),
      showLogo: false,
      prefix: "اعتبار",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Slides container - takes full height, content centered */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
              index === currentSlide
                ? "translate-x-0 opacity-100"
                : index < currentSlide
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
            }`}
          >
            <SplashSlide
              title={slide.title}
              showLogo={slide.showLogo}
              projectName={slide.projectName}
              prefix={slide.prefix}
              isActive={index === currentSlide}
            />
          </div>
        ))}
      </div>

      {/* Navigation - fixed at bottom with padding */}
      <div className="border-t border-border bg-background pb-6 pt-6">
        {/* Dots indicator - RTL: dots appear in reverse order visually */}
        <div className="mb-6 flex flex-row-reverse justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Buttons - RTL: Next on left, Skip/Previous on right */}
        <div className="flex items-center justify-between gap-4 px-6">
          <Button
            onClick={handleNext}
            className="min-h-[44px] min-w-[100px]"
          >
            {currentSlide === TOTAL_SLIDES - 1 ? t("continue") : t("next")}
          </Button>

          {currentSlide === 0 ? (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="min-h-[44px]"
            >
              {t("skip")}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="min-h-[44px] min-w-[100px]"
            >
              {t("previous")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

