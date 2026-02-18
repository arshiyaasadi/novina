# Frontend Development Agent

## Focus areas

This agent is used for frontend development.

## Responsibilities

1. Create and maintain React components
2. Implement pages with Next.js App Router
3. Use shadcn/ui components
4. Implement RTL and i18n
5. Ensure responsive, mobile-first design

## Guidelines

### Components

- Use components from `@/shared/ui/`
- Before creating a new component, search in `@/shared/samples/`
- Components should be reusable

### Styling

- Use Tailwind CSS
- Use CSS variables for colors
- Use Tailwind spacing
- Account for RTL

### i18n

- Put all user-facing text in `@/i18n/locales/fa.json`
- Use the `useTranslations()` hook
- Avoid hard-coded copy

### Mobile-first

- The app is mobile-only
- Touch targets at least 44x44px
- Use responsive utilities

## Examples

### Page

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

### Component

```tsx
// src/shared/components/user-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useTranslations } from 'next-intl';

interface UserCardProps {
  name: string;
  email: string;
  onEdit?: () => void;
}

export function UserCard({ name, email, onEdit }: UserCardProps) {
  const t = useTranslations('common');
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
