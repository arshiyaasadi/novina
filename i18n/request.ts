import { getRequestConfig as getRequestConfigWrapper } from "next-intl/server";
import { routing } from "../src/i18n/routing";

export default getRequestConfigWrapper(async (params) => {
  const locale =
    (params && (await params.requestLocale)) ?? routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../src/i18n/locales/${locale}.json`)).default,
    timeZone: "Asia/Tehran",
  };
});
