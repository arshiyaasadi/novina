# Design system

## Colors and themes

The project uses CSS variables for colors, defined in `src/app/globals.css`.

### Main colors

- **Primary**: `hsl(var(--primary))` — main brand color
- **Secondary**: `hsl(var(--secondary))` — secondary color
- **Accent**: `hsl(var(--accent))` — accent color
- **Destructive**: `hsl(var(--destructive))` — for destructive actions

### Themes

Two themes are supported:
- **Light mode**: default
- **Dark mode**

Themes are managed with `next-themes`.

## Typography

### Font

**IRANSans** is used, defined in `public/fonts/IRANSans/Iransansx.css` and imported in `globals.css`. It is applied by default across the project.

### Text sizes

- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px) — default
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Font weight

- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

## Spacing

Use the Tailwind spacing scale:

- `p-1`: 0.25rem (4px)
- `p-2`: 0.5rem (8px)
- `p-4`: 1rem (16px)
- `p-6`: 1.5rem (24px)
- `p-8`: 2rem (32px)

Use `m-*` for margin and `p-*` for padding.

## Component guidelines

### Using shadcn/ui

UI components come from shadcn/ui and live in `src/shared/ui/`.

### Sample components

Tailwind sample components are in `src/shared/samples/`. Use them as reference.

### Creating a new component

1. Check for a similar component in `shared/samples/`
2. Move or copy to `shared/components/` or `shared/ui/`
3. Combine with shadcn/ui if needed

## RTL guidelines

The app is RTL for Persian.

### Notes

1. **Direction**: Use `dir="rtl"` on HTML
2. **Spacing**: In RTL, `mr-*` and `ml-*` are flipped automatically
3. **Icons**: Icons should work in RTL
4. **Text alignment**: Use `text-right` for RTL

### Tailwind RTL

Tailwind supports RTL. Use:

- `rtl:` — RTL-specific styles
- `ltr:` — LTR-specific styles

Example:
```tsx
<div className="mr-4 rtl:mr-0 rtl:ml-4">
  Content
</div>
```

## Mobile-first design

The app is designed for mobile only.

### Breakpoints

- **Mobile**: default (no prefix)
- **Tablet**: `md:` (768px+)
- **Desktop**: not used

### Best practices

1. Use responsive design
2. Touch targets at least 44x44px
3. Use appropriate spacing for mobile
4. Keep text readable (at least 16px)

## Component examples

### Button

```tsx
import { Button } from "@/shared/ui/button";

<Button variant="default" size="default">
  Click
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Input

```tsx
import { Input } from "@/shared/ui/input";

<Input type="email" placeholder="Email" />
```

## Accessibility

1. Use semantic HTML
2. Add labels to inputs
3. Use ARIA attributes where needed
4. Ensure sufficient color contrast
