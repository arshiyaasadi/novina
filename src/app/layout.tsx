import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { routing } from "@/i18n/routing";
import "./globals.css";

export const metadata: Metadata = {
  title: "نوینآ | پلتفرم مدیریت پورتفوی مالی",
  description: "پلتفرم هوشمند مدیریت پورتفوی مالی و سرمایه‌گذاری",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const locale = routing.defaultLocale;

  return (
    <html lang={locale} dir="rtl" suppressHydrationWarning className="h-full overflow-hidden">
      <body className="h-full overflow-hidden">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

