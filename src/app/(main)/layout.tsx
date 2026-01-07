"use client";

import { usePathname } from "next/navigation";
import { TopNavbar } from "@/shared/components/navigation/top-navbar";
import { BottomNav } from "@/shared/components/navigation/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInstallmentsPage = pathname?.includes("/activities/installments");
  const isInvoicePage = pathname?.includes("/investment/invoice");

  // If it's invoice page, don't render this layout (let invoice layout handle it)
  if (isInvoicePage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden p-4">
      <div className="flex w-full max-w-[480px] h-full flex-col overflow-hidden bg-background">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Content Area - scrollable */}
        <main className={`flex-1 overflow-y-auto ${isInstallmentsPage ? "pb-24" : "pb-16"}`}>
          {children}
        </main>

        {/* Bottom Navigation - fixed, hidden on installments page */}
        {!isInstallmentsPage && <BottomNav />}
      </div>
    </div>
  );
}

