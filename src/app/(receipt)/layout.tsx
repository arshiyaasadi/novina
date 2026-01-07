export default function ReceiptGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout only provides the basic container without navbar and bottom nav
  return (
    <div className="flex min-h-[100dvh] h-[100dvh] items-center justify-center p-4">
      <div className="flex w-full max-w-[480px] h-full flex-col overflow-hidden bg-background">
        {/* Content Area - scrollable, no navbar or bottom nav */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

