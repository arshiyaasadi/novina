"use client";

import { cn } from "@/shared/lib/utils";

interface LoanBannerProps {
  className?: string;
}

export function LoanBanner({ className }: LoanBannerProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden p-4 sm:p-6",
        "bg-gradient-to-r from-blue-100 via-blue-50 to-green-100",
        "dark:from-blue-900/30 dark:via-blue-800/20 dark:to-green-900/30",
        "border border-blue-200/50 dark:border-blue-800/50",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Icons - Growth Arrow with Plant and Shield */}
        <div className="flex-shrink-0 flex items-center">
          <div className="relative w-12 h-16 sm:w-14 sm:h-20">
            {/* Zigzag Arrow - thicker at top, thinner at bottom */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 40 50"
              className="text-blue-500 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M5 45 L15 30 L25 20 L35 5"
                strokeWidth="3"
                style={{
                  strokeDasharray: "none",
                }}
              />
            </svg>
            {/* Plant Sprout - at middle peak */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                className="text-green-500 dark:text-green-400"
                fill="currentColor"
              >
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C7.5 17 9.5 12 17 10c-1.5-1.5-3-4.5-3-6 0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.5-1.5 4.5-3 6z" />
              </svg>
            </div>
            {/* Shield with Checkmark - above plant */}
            <div className="absolute top-[25%] left-1/2 -translate-x-1/2">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                className="text-green-500 dark:text-green-400"
                fill="currentColor"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 16.5l-4.5-4.5 1.41-1.41L10.5 14.67l6.59-6.59L18.5 9.5l-8 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Center Text */}
        <div className="flex-1 text-center space-y-0.5 sm:space-y-1 px-2">
          <p className="text-base sm:text-lg font-semibold text-teal-700 dark:text-teal-300">
            "وام تا ۷۰٪ مبلغ"
          </p>
          <p className="text-sm sm:text-base font-medium text-teal-600 dark:text-teal-400">
            سرمایه‌گذاری شما
          </p>
        </div>

        {/* Right Icons - Handshake, Smartphone, Coins */}
        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
          {/* Handshake */}
          <div className="relative">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="text-teal-600 dark:text-teal-400"
              fill="currentColor"
            >
              <path d="M9.5 2c-1.82 0-3.24.5-4.5 1.5v2c1.26-.5 2.68-1 4.5-1s3.24.5 4.5 1v-2c-1.26-1-2.68-1.5-4.5-1.5zm0 4c-1.82 0-3.24.5-4.5 1.5v2c1.26-.5 2.68-1 4.5-1s3.24.5 4.5 1v-2c-1.26-1-2.68-1.5-4.5-1.5zm5 0c-1.82 0-3.24.5-4.5 1.5v2c1.26-.5 2.68-1 4.5-1s3.24.5 4.5 1v-2c-1.26-1-2.68-1.5-4.5-1.5z" />
            </svg>
          </div>

          {/* Smartphone with Chart */}
          <div className="relative">
            <svg
              width="22"
              height="32"
              viewBox="0 0 24 40"
              className="text-teal-600 dark:text-teal-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {/* Phone outline */}
              <rect x="6" y="2" width="12" height="36" rx="2" />
              {/* Screen content - bar chart */}
              <rect x="9" y="28" width="2" height="4" fill="currentColor" />
              <rect x="12" y="24" width="2" height="8" fill="currentColor" />
              <rect x="15" y="26" width="2" height="6" fill="currentColor" />
              {/* Trend line */}
              <path
                d="M9 30 L11 28 L13 26 L15 28 L17 24"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Coins Stack - three coins offset */}
          <div className="flex flex-col items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <svg
                key={i}
                width="18"
                height="7"
                viewBox="0 0 24 12"
                className="text-green-500 dark:text-green-400"
                fill="currentColor"
                style={{ marginLeft: `${i * 2}px` }}
              >
                <circle cx="12" cy="6" r="5" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

