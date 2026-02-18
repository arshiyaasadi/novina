# کاربر لاگین‌شده و DTO گلوبال

## تعریف

کاربری که وارد اپلیکیشن شده است با یک **DTO (Data Transfer Object)** واحد در سطح گلوبال نمایش داده می‌شود. این DTO در **Zustand store** (`useUserStore`) نگهداری می‌شود و در صورت نیاز در `localStorage` با کلید `loggedInUser` ذخیره می‌شود.

## فیلدهای LoggedInUserDto

| فیلد        | نوع   | توضیح                          |
|-------------|------|---------------------------------|
| `mobile`    | string | شماره همراه                    |
| `nationalId`| string | کد ملی                         |
| `firstName` | string | نام                            |
| `lastName`  | string | نام خانوادگی                   |
| `birthDate` | string | تاریخ تولد به صورت **شمسی** (مثلاً `1370/05/15`) |

ورود تاریخ تولد در UI به صورت شمسی (سال/ماه/روز) انجام می‌شود.

## محل پیاده‌سازی

- **نوع (TypeScript):** `src/domains/auth/types/index.ts` — `LoggedInUserDto`
- **استور (Zustand):** `src/shared/store/user-store.ts` — `useUserStore`
  - `user`: مقدار فعلی کاربر یا `null`
  - `setUser(user)`: تنظیم کاربر و ذخیره در localStorage
  - `clearUser()`: خالی کردن کاربر و حذف از localStorage
  - `hydrate()`: خواندن از localStorage و پر کردن استور (مثلاً بعد از لود صفحه)

## استفاده در کامپوننت‌ها

```ts
import { useUserStore } from "@/shared/store/user-store";

// خواندن
const user = useUserStore((s) => s.user);

// به‌روزرسانی بعد از لاگین یا تکمیل احراز هویت
useUserStore.getState().setUser({
  mobile: "09123456789",
  nationalId: "1234567890",
  firstName: "علی",
  lastName: "احمدی",
  birthDate: "1370/05/15",
});

// خروج
useUserStore.getState().clearUser();
```

## هیدرات کردن استور

در صفحاتی که به کاربر لاگین‌شده نیاز دارند (مثلاً پروفایل، داشبورد)، یک بار در `useEffect` فراخوانی کنید:

```ts
useEffect(() => {
  useUserStore.getState().hydrate();
}, []);
```

با این کار اگر کاربر در تب دیگری یا در رفرش قبلی لاگین کرده باشد، مقدار از localStorage خوانده و در استور قرار می‌گیرد.
