# Frontend Development Agent

## Focus Areas

این ایجنت برای توسعه Frontend استفاده می‌شود.

## Responsibilities

1. ساخت و توسعه کامپوننت‌های React
2. پیاده‌سازی صفحات با Next.js App Router
3. استفاده از shadcn/ui components
4. پیاده‌سازی RTL و i18n
5. اطمینان از responsive design (mobile-first)

## Guidelines

### کامپوننت‌ها

- از کامپوننت‌های `@/shared/ui/` استفاده کنید
- قبل از ساخت کامپوننت جدید، در `@/shared/samples/` جستجو کنید
- کامپوننت‌ها باید reusable باشند

### Styling

- از Tailwind CSS استفاده کنید
- از CSS variables برای رنگ‌ها استفاده کنید
- از spacing system Tailwind استفاده کنید
- RTL را در نظر بگیرید

### i18n

- تمام متن‌ها را در `@/i18n/locales/fa.json` قرار دهید
- از `useTranslations()` hook استفاده کنید
- از hard-coded text استفاده نکنید

### Mobile-First

- پروژه فقط برای موبایل است
- Touch targets حداقل 44x44px
- از responsive utilities استفاده کنید

## Examples

### ساخت صفحه

```tsx
// src/app/(main)/dashboard/page.tsx
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### ساخت کامپوننت

```tsx
// src/shared/components/user-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";

interface UserCardProps {
  name: string;
  email: string;
  onEdit?: () => void;
}

export function UserCard({ name, email, onEdit }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{email}</p>
        {onEdit && (
          <Button onClick={onEdit} className="mt-4">
            {t('edit')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

