import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/shared/components/theme-provider";
import getRequestConfig from "../../i18n/request";
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
  const { messages, locale } = await getRequestConfig();

  return (
    <html lang={locale} dir="rtl" suppressHydrationWarning className="h-full overflow-hidden">
      <head>
        <link rel="stylesheet" href="/fonts/IRANSans/Iransansx.css" />
      </head>
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

