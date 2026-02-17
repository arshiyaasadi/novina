import { getRequestConfig as getRequestConfigWrapper } from "next-intl/server";
import { routing } from "../src/i18n/routing";

// Internal implementation returned by next-intl
const innerGetRequestConfig = getRequestConfigWrapper(async (params) => {
  const locale =
    (params && (await params.requestLocale)) ?? routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../src/i18n/locales/${locale}.json`)).default,
    timeZone: "Asia/Tehran",
  };
});

// Public wrapper with a permissive signature so it can be called
// without arguments in layout.tsx (TypeScript will now accept 0 args).
export default function getRequestConfig(...args: any[]) {
  return (innerGetRequestConfig as any)(...args);
}
