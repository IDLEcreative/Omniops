# Components Directory

Reusable React components for the Customer Service Agent application.

## Structure

```
components/
├── ui/                 # Base UI components (shadcn/ui)
│   ├── button.tsx     # Button component
│   ├── card.tsx       # Card component  
│   ├── input.tsx      # Input component
│   └── ...            # Other UI primitives
├── chat/              # Chat-specific components
│   └── MessageContent.tsx  # Message rendering
├── auth/              # Authentication components
│   └── auth-provider.tsx   # Auth context provider
├── layout/            # Layout components
├── forms/             # Form components
└── shared/            # Shared/common components
```

## Component Categories

### UI Components (`/ui`)
Base components from shadcn/ui library:
- Fully accessible (WCAG AA compliant)
- Tailwind CSS styling
- Radix UI primitives
- Dark mode support

Common components:
- `button`, `card`, `input`, `label`
- `select`, `switch`, `tabs`, `textarea`
- `alert`, `badge`, `tooltip`
- `dropdown-menu`, `avatar`, `progress`
- `scroll-area`, `separator`, `collapsible`

### Chat Components (`/chat`)
- `MessageContent.tsx` - Renders chat messages with markdown support
- Future: MessageList, InputArea, TypingIndicator

### Auth Components (`/auth`)
- `auth-provider.tsx` - Authentication context and hooks

### Widget Components
- `ChatWidget.tsx` - Main embeddable widget component
- `cookie-consent.tsx` - GDPR cookie consent banner
- `theme-provider.tsx` - Theme context provider

### Utility Components
- `error-boundary.tsx` - Error boundary wrapper
- `theme-toggle` - Light/dark mode toggle

## Usage Examples

### Button Component
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

### Card Component
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Chat Widget
```tsx
import ChatWidget from "@/components/ChatWidget"

<ChatWidget config={widgetConfig} />
```

## Component Guidelines

### Creating New Components

1. **Location**: Place in appropriate subdirectory
2. **Naming**: Use PascalCase for component files
3. **Exports**: Use named exports for UI components
4. **Types**: Include TypeScript types/interfaces
5. **Styling**: Use Tailwind classes via `cn()` utility

### Best Practices

1. **Composition**: Build complex components from simple ones
2. **Props**: Use TypeScript interfaces for prop types
3. **Accessibility**: Include ARIA labels and keyboard support
4. **Performance**: Use React.memo for expensive components
5. **Testing**: Write tests for business logic components

### Styling Convention

Use the `cn()` utility for conditional classes:
```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Allow className override
)} />
```

## Component Library

We use shadcn/ui as our component library:
- Not installed as dependency
- Copy components as needed
- Fully customizable
- Built on Radix UI

To add new shadcn components:
```bash
npx shadcn@latest add [component-name]
```

## Accessibility

All components follow WCAG AA standards:
- Proper ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast compliance

## Dark Mode

Components support dark mode via:
- `next-themes` package
- CSS variables in globals.css
- Tailwind dark: modifier

## Performance

Optimization strategies:
- Lazy load heavy components
- Use React.memo for pure components
- Virtualize long lists
- Optimize re-renders with proper keys