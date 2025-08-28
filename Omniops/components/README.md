# Components Directory

Reusable React components for the Customer Service Agent application, built with React, TypeScript, and Tailwind CSS.

## Architecture Overview

The component architecture follows a modular design pattern with clear separation of concerns:

- **UI Components**: Base design system components (shadcn/ui)
- **Feature Components**: Business logic components organized by domain
- **Layout Components**: Application structure and navigation
- **Utility Components**: Cross-cutting concerns (error handling, theming)

## Directory Structure

```
components/
├── ui/                 # Base UI components (shadcn/ui design system)
│   ├── alert.tsx      # Alert notifications with variants
│   ├── avatar.tsx     # User avatar with fallback support
│   ├── badge.tsx      # Status badges and labels
│   ├── button.tsx     # Interactive buttons with variants
│   ├── card.tsx       # Content containers with header/content/footer
│   ├── collapsible.tsx # Expandable/collapsible content
│   ├── dropdown-menu.tsx # Dropdown menus with keyboard navigation
│   ├── input.tsx      # Form input fields with validation states
│   ├── label.tsx      # Accessible form labels
│   ├── progress.tsx   # Progress bars and loading indicators
│   ├── radio-group.tsx # Radio button selection groups
│   ├── scroll-area.tsx # Custom scrollable containers
│   ├── select.tsx     # Dropdown selection menus
│   ├── separator.tsx  # Visual dividers and separators
│   ├── switch.tsx     # Toggle switches for boolean values
│   ├── tabs.tsx       # Tab navigation components
│   ├── textarea.tsx   # Multi-line text input areas
│   ├── theme-toggle.tsx # Dark/light mode toggle with system preference
│   └── tooltip.tsx    # Hover-triggered information tooltips
├── auth/              # Authentication components
│   └── auth-provider.tsx   # Supabase auth context and hooks
├── chat/              # Chat-specific components
│   └── MessageContent.tsx  # Message rendering with markdown/link support
├── dashboard/         # Dashboard data visualization components
│   └── dashboard-data-loader.tsx # Async data loading with error handling
├── forms/             # Form components (reserved for future use)
├── layout/            # Layout components (reserved for future use)  
├── shared/            # Shared utility components (reserved for future use)
├── ChatWidget.tsx     # Embeddable chat widget with privacy controls
├── cookie-consent.tsx # GDPR-compliant cookie consent banner
├── error-boundary.tsx # React error boundary with development tools
└── theme-provider.tsx # Next.js theme provider wrapper
```

## Component Categories

### UI Components (`/ui/`)
Base design system components built on shadcn/ui and Radix UI:

**Key Features:**
- Full WCAG AA accessibility compliance
- Tailwind CSS styling with CSS variables
- Dark mode support via next-themes
- TypeScript interfaces for all props
- Consistent focus management and keyboard navigation

**Components:**
- `alert` - Contextual notifications (success, error, warning, info)
- `avatar` - User profile images with text/icon fallbacks
- `badge` - Status indicators with variant styling
- `button` - Interactive buttons (default, outline, ghost, destructive)
- `card` - Flexible content containers with header/body/footer
- `collapsible` - Animated expand/collapse content sections
- `dropdown-menu` - Accessible context menus with keyboard navigation
- `input` - Form input fields with validation states
- `label` - Semantic form labels with proper associations
- `progress` - Progress bars with animated state changes
- `radio-group` - Mutually exclusive selection groups
- `scroll-area` - Custom styled scrollable containers
- `select` - Dropdown selection with search/filter capabilities
- `separator` - Visual dividers with orientation support
- `switch` - Toggle switches with smooth animations
- `tabs` - Tab navigation with keyboard arrow support
- `textarea` - Multi-line text inputs with auto-resize
- `theme-toggle` - System/light/dark theme selector
- `tooltip` - Hover/focus-triggered information overlays

### Authentication Components (`/auth/`)
Supabase-based authentication system:

**`auth-provider.tsx`:**
- Context provider for authentication state
- Supabase client integration
- Authentication methods (signIn, signUp, signOut)
- Real-time auth state synchronization
- TypeScript interfaces for user data
- Error handling for auth operations

### Chat Components (`/chat/`)
Real-time chat functionality:

**`MessageContent.tsx`:**
- Markdown-style link rendering ([text](url))
- Automatic URL detection and linkification
- XSS protection with secure link handling
- React.memo optimization for performance
- Text overflow and word-breaking support
- Accessible link targets with rel="noopener noreferrer"

### Dashboard Components (`/dashboard/`)
Data visualization and analytics:

**`dashboard-data-loader.tsx`:**
- Parallel API data fetching (Promise.allSettled)
- Individual loading states per data section
- Comprehensive error handling with partial data display
- Auto-refresh functionality (30-second intervals)
- Performance monitoring with timing metrics
- Custom hook (useDashboardData) for reusable data access
- TypeScript interfaces for all data structures

### Root Level Components

**`ChatWidget.tsx`** - Embeddable chat interface:
- Fully self-contained with configurable props
- Privacy compliance with consent management
- Accessibility features (ARIA labels, keyboard navigation)
- High contrast mode toggle
- Font size accessibility options
- Auto-scrolling message display
- Responsive design (mobile-first)
- WooCommerce integration support
- PostMessage API for parent window communication

**`cookie-consent.tsx`** - GDPR compliance:
- LocalStorage-based consent tracking
- Accept/decline functionality
- Privacy policy integration
- Responsive banner design
- Tailwind CSS styling

**`error-boundary.tsx`** - Error handling:
- React class component with error catching
- Development vs production error display
- Component stack trace in development
- User-friendly error recovery options
- Integration with external error reporting services

**`theme-provider.tsx`** - Theme management:
- Next-themes integration wrapper
- System preference detection
- Persistent theme selection
- SSR-safe theme switching

## Design Patterns

### Component Composition
Components follow composition over inheritance:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Props Interface Design
Consistent TypeScript interfaces:
```tsx
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
}
```

### Styling Approach
Utility-first CSS with Tailwind:
```tsx
// Using cn() utility for conditional classes
<div className={cn(
  "base-classes",
  variant === 'destructive' && "destructive-classes",
  className // Allow prop-based overrides
)} />
```

### State Management Patterns
- Local state with useState for component-specific data
- Context providers for shared authentication/theme state
- Custom hooks for reusable data fetching logic
- Error boundaries for graceful failure handling

## Accessibility Standards

All components implement WCAG AA compliance:

**Keyboard Navigation:**
- Tab order management
- Arrow key navigation in menus/tabs
- Enter/Space activation
- Escape key dismissal

**Screen Reader Support:**
- Semantic HTML elements
- ARIA labels and descriptions
- Role attributes where appropriate
- Focus management announcements

**Visual Accessibility:**
- High contrast mode support
- Configurable font sizes
- Color-blind friendly indicators
- Proper focus indicators

## Performance Optimizations

**Rendering Performance:**
- React.memo for expensive components
- useMemo for computed values
- useCallback for stable references
- Proper React keys for list items

**Bundle Optimization:**
- Tree-shaking compatible exports
- Dynamic imports for heavy components
- Minimal external dependencies
- Code splitting at route level

**Runtime Performance:**
- Debounced input handlers
- Virtualized long lists
- Lazy loading for images
- Optimistic UI updates

## Testing Strategy

**Component Testing:**
- Jest + React Testing Library
- Accessibility testing with jest-axe
- Visual regression testing
- User interaction simulation

**Integration Testing:**
- API integration tests
- Authentication flow tests
- Error boundary verification
- Theme switching validation

## Development Workflow

### Adding New Components
1. Create component file with TypeScript interface
2. Implement with accessibility in mind
3. Add to appropriate directory
4. Export from index files
5. Write tests and documentation
6. Update this README

### Styling Guidelines
- Use Tailwind utility classes
- Leverage CSS variables for theming
- Follow mobile-first responsive design
- Use cn() utility for conditional styling
- Maintain consistent spacing/sizing scales

### Component API Design
- Keep props interface minimal and focused
- Support className prop for style overrides
- Use proper TypeScript generics for flexibility
- Follow React patterns for ref forwarding
- Provide sensible default values

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