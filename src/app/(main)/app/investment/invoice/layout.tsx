"use client";

import { TopNavbar } from "@/shared/components/navigation/top-navbar";

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] h-[100dvh] items-center justify-center p-4">
      <div className="flex w-full max-w-[480px] h-full flex-col overflow-hidden bg-background">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Content Area - scrollable, no bottom nav */}
        <main className="flex-1 overflow-y-auto pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}

