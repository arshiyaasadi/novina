# فرایند دریافت وام (اعتبار نقدی)

این سند رفتار و ذخیره‌سازی فرایند دریافت وام را شرح می‌دهد.

## مراحل فلو (۵ مرحله)

| مرحله | عنوان | دیتای پرسیست‌شده |
|-------|--------|-------------------|
| ۱ | مبلغ وام و شرایط بازپرداخت | `loanAmount`, `selectedPeriod` |
| ۲ | اقساط | (مشتق از مبلغ و دوره) |
| ۳ | دریافت گزارش اعتبار سنجی | `videoVerificationNationalId`, `creditReportRequested` |
| ۴ | احراز هویت ویدیویی | `videoVerificationSuccess` |
| ۵ | دریافت وام و تایید قرارداد | `isAgreementAccepted` |

همه‌ی این فیلدها به‌همراه `step` و `updatedAt` در هر تغییر در **پیش‌نویس** ذخیره می‌شوند.

## پرسیست (localStorage)

### کلیدها

- **`loanFlowDraft`**: پیش‌نویس درخواست در حال تکمیل. هر بار که کاربر داخل فلو است و state عوض می‌شود، این شیء به‌روز می‌شود.
- **`loanRequests`**: آرایه‌ی درخواست‌های ثبت‌شده (بعد از امضای قرارداد).

### ساختار پیش‌نویس (`LoanFlowDraft`)

```ts
{
  loanAmount: number;
  selectedPeriod: LoanPeriod | null;
  step: 1 | 2 | 3 | 4 | 5;
  videoVerificationNationalId: string;
  creditReportRequested: boolean;
  videoVerificationSuccess: boolean;
  isAgreementAccepted: boolean;
  updatedAt: string; // ISO
}
```

### زمان ذخیره و پاک‌سازی

- **ذخیره:** هر بار که کاربر داخل فلو است (`showFlow === true`) و یکی از فیلدهای بالا یا `step` عوض شود، `loanFlowDraft` در localStorage نوشته می‌شود.
- **پاک‌سازی:** بعد از «امضای قرارداد» (ثبت درخواست)، `loanFlowDraft` پاک می‌شود و درخواست جدید به `loanRequests` اضافه می‌شود.

## لیست «درخواست‌های وام»

- **پیش‌نویس:** اگر `loanFlowDraft` وجود داشته باشد، به‌صورت اولین آیتم با برچسب «در حال تکمیل – مرحله X از ۵» و مبلغ و تاریخ آخرین به‌روزرسانی نمایش داده می‌شود. با کلیک روی آن، فلو از همان مرحله و با همان دیتا باز می‌شود.
- **درخواست‌های ثبت‌شده:** از `loanRequests` (localStorage) بارگذاری می‌شوند. اگر خالی باشد، برای نمایش دمو از `MOCK_LOAN_REQUESTS` استفاده می‌شود.
- **دکمه «دریافت وام جدید»:** اگر پیش‌نویس وجود داشته باشد، با کلیک، همان پیش‌نویس بازیابی و فلو از مرحلهٔ ذخیره‌شده ادامه می‌یابد؛ در غیر این صورت فلو از مرحله ۱ با مبلغ/دورهٔ فعلی شروع می‌شود.

## فایل‌های مرتبط

- **صفحه فلو:** `src/app/(main)/app/credit/loan/page.tsx`
- **ذخیره/بازیابی:** `src/app/(main)/app/credit/loan/lib/loan-flow-storage.ts`
- **مرحله گزارش اعتبار سنجی:** `src/shared/components/credit/credit-report-step.tsx`
- **مودال احراز ویدیویی:** `src/shared/components/credit/video-verification-modal.tsx`

## وضعیت فیچر

فرایند دریافت وام با پرسیست پیش‌نویس و نمایش در لیست درخواست‌ها به‌صورت فیچر تکمیل‌شده در نظر گرفته می‌شود. اتصال به API واقعی برای استعلام رتبه و آپلود ویدیو در نسخه‌های بعد قابل افزودن است.
