export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-[480px] h-full overflow-hidden">{children}</div>
    </div>
  );
}

