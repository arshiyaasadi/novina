# سیستم طراحی

## رنگ‌ها و تم‌ها

پروژه از CSS variables برای مدیریت رنگ‌ها استفاده می‌کند که در `src/app/globals.css` تعریف شده‌اند.

### رنگ‌های اصلی

- **Primary**: `hsl(var(--primary))` - رنگ اصلی پروژه
- **Secondary**: `hsl(var(--secondary))` - رنگ ثانویه
- **Accent**: `hsl(var(--accent))` - رنگ تاکیدی
- **Destructive**: `hsl(var(--destructive))` - برای عملیات‌های خطرناک

### تم‌ها

پروژه از دو تم پشتیبانی می‌کند:
- **Light Mode**: تم روشن (پیش‌فرض)
- **Dark Mode**: تم تاریک

تم‌ها با `next-themes` مدیریت می‌شوند.

## Typography

### فونت

از فونت **IRANSans** استفاده می‌شود که در `public/fonts/IRANSans/Iransansx.css` تعریف شده و در `globals.css` import شده است. این فونت به صورت پیش‌فرض در تمام پروژه اعمال می‌شود.

### اندازه‌های متن

- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px) - پیش‌فرض
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### وزن فونت

- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

## Spacing System

از Tailwind spacing scale استفاده می‌شود:

- `p-1`: 0.25rem (4px)
- `p-2`: 0.5rem (8px)
- `p-4`: 1rem (16px)
- `p-6`: 1.5rem (24px)
- `p-8`: 2rem (32px)

برای margin از `m-*` و برای padding از `p-*` استفاده کنید.

## Component Guidelines

### استفاده از shadcn/ui

کامپوننت‌های UI از shadcn/ui استفاده می‌کنند که در `src/shared/ui/` قرار دارند.

### نمونه کامپوننت‌ها

نمونه کامپوننت‌های Tailwind در `src/shared/samples/` قرار دارند. می‌توانید از آن‌ها به عنوان مرجع استفاده کنید.

### ساخت کامپوننت جدید

1. اگر کامپوننت مشابهی در `shared/samples/` وجود دارد، از آن استفاده کنید
2. کامپوننت را به `shared/components/` یا `shared/ui/` منتقل کنید
3. در صورت نیاز، با shadcn/ui ترکیب کنید

## RTL Guidelines

پروژه برای زبان فارسی RTL است.

### نکات مهم

1. **Direction**: از `dir="rtl"` در HTML استفاده می‌شود
2. **Spacing**: در RTL، `mr-*` و `ml-*` به صورت خودکار معکوس می‌شوند
3. **Icons**: آیکون‌ها باید برای RTL مناسب باشند
4. **Text Alignment**: از `text-right` برای RTL استفاده کنید

### Tailwind RTL Support

Tailwind به صورت خودکار RTL را پشتیبانی می‌کند. از کلاس‌های زیر استفاده کنید:

- `rtl:` - برای استایل‌های RTL خاص
- `ltr:` - برای استایل‌های LTR خاص

مثال:
```tsx
<div className="mr-4 rtl:mr-0 rtl:ml-4">
  Content
</div>
```

## Mobile-First Design

پروژه فقط برای موبایل طراحی شده است.

### Breakpoints

- **Mobile**: پیش‌فرض (بدون prefix)
- **Tablet**: `md:` (768px+)
- **Desktop**: استفاده نشده

### Best Practices

1. از responsive design استفاده کنید
2. Touch targets باید حداقل 44x44px باشند
3. از spacing مناسب برای موبایل استفاده کنید
4. متن باید خوانا باشد (حداقل 16px)

## Component Examples

### Button

```tsx
import { Button } from "@/shared/ui/button";

<Button variant="default" size="default">
  کلیک کنید
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

<Card>
  <CardHeader>
    <CardTitle>عنوان</CardTitle>
  </CardHeader>
  <CardContent>
    محتوا
  </CardContent>
</Card>
```

### Input

```tsx
import { Input } from "@/shared/ui/input";

<Input type="email" placeholder="ایمیل" />
```

## Accessibility

1. از semantic HTML استفاده کنید
2. Labels را برای input ها اضافه کنید
3. از ARIA attributes استفاده کنید
4. رنگ‌ها باید contrast مناسب داشته باشند

