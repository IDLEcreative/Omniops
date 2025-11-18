# UI Components Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Radix UI](https://www.radix-ui.com/), [Tailwind CSS](https://tailwindcss.com/), [next-themes](https://github.com/pacocoursey/next-themes), [Class Variance Authority](https://cva.style/)
**Estimated Read Time:** 12 minutes

## Purpose

Base design system components built on shadcn/ui and Radix UI primitives forming the foundation of the application's user interface with full accessibility compliance and themeable styling.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Table of Contents

- [Component Architecture](#component-architecture)
- [Components](#components)
  - [Form Components](#form-components)
  - [Layout Components](#layout-components)
  - [Navigation Components](#navigation-components)
  - [Feedback Components](#feedback-components)
  - [Interactive Components](#interactive-components)
  - [Utility Components](#utility-components)
- [Dependencies](#dependencies)
- [Customization](#customization)
- [Accessibility Features](#accessibility-features)
- [Performance Considerations](#performance-considerations)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

---

## Keywords

UI components, shadcn/ui, Radix UI, design system, accessibility, Tailwind CSS, themeable, form components, navigation

## Overview

The UI components follow the shadcn/ui methodology:
- Copy-paste components (not installed as dependencies)
- Built on Radix UI primitives for accessibility
- Styled with Tailwind CSS using CSS variables
- Fully customizable and composable
- TypeScript-first with complete type safety

## Component Architecture

### Design Principles
- **Accessibility First**: WCAG AA compliant with proper ARIA attributes
- **Composable**: Components work together through composition patterns
- **Themeable**: CSS variables enable easy theming and dark mode
- **Type Safe**: Complete TypeScript interfaces for all props
- **Performance**: Optimized for bundle size and runtime performance

### Styling System
- Tailwind CSS utility classes
- CSS custom properties for theming
- Radix UI state attributes for styling
- Class Variance Authority (CVA) for variants
- `cn()` utility for conditional styling

## Components

### Form Components

#### `button.tsx`
Interactive button component with multiple variants and sizes.

**Props Interface:**
```tsx
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  className?: string;
  disabled?: boolean;
}
```

**Features:**
- Multiple visual variants (default, destructive, outline, secondary, ghost, link)
- Size variants (sm, default, lg, icon)
- Focus ring with proper contrast
- Loading states with disabled pointer events
- Icon support with automatic sizing
- Polymorphic via `asChild` prop using Radix Slot

**Usage:**
```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>

<Button variant="outline" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

#### `input.tsx`
Text input field with validation states and accessibility features.

**Props Interface:**
```tsx
interface InputProps extends React.ComponentProps<'input'> {
  className?: string;
}
```

**Features:**
- Built-in validation state styling (valid, invalid, disabled)
- Focus ring with proper contrast ratios
- Placeholder styling with adequate contrast
- Compatible with form libraries (React Hook Form, Formik)
- Support for all HTML input types

**Usage:**
```tsx
<Input type="email" placeholder="Enter your email" />
<Input type="password" aria-invalid={hasError} />
```

#### `textarea.tsx`
Multi-line text input with auto-resize capabilities.

**Features:**
- Auto-resize functionality
- Consistent styling with input components
- Focus management and validation states
- Proper line height for readability

#### `label.tsx`
Semantic form labels with proper associations.

**Features:**
- Automatic association with form controls
- Accessible styling with proper contrast
- Support for required field indicators

#### `select.tsx`
Dropdown selection component with search capabilities.

**Features:**
- Keyboard navigation (Arrow keys, Enter, Escape)
- Search/filter functionality
- Accessible announcements
- Custom trigger and content styling
- Multi-select support

**Usage:**
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### `radio-group.tsx`
Radio button selection groups with keyboard navigation.

**Features:**
- Arrow key navigation between options
- Automatic exclusivity (single selection)
- Accessible labeling and grouping
- Custom styling for radio indicators

#### `switch.tsx`
Toggle switch for boolean values.

**Features:**
- Smooth animations between states
- Accessible labeling with proper announcements
- Keyboard activation (Space, Enter)
- Consistent sizing and styling

### Layout Components

#### `card.tsx`
Flexible content container with header, body, and footer sections.

**Components:**
- `Card` - Main container
- `CardHeader` - Header section with title/description
- `CardTitle` - Primary heading
- `CardDescription` - Secondary text
- `CardContent` - Main content area
- `CardFooter` - Footer actions/content
- `CardAction` - Header action area

**Features:**
- Flexible grid layout system
- Automatic spacing and alignment
- Shadow and border styling
- Responsive behavior

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardDescription>Manage your account settings</CardDescription>
    <CardAction>
      <Button variant="outline" size="sm">Edit</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

#### `separator.tsx`
Visual dividers and spacers.

**Features:**
- Horizontal and vertical orientations
- Semantic HTML with proper ARIA roles
- Consistent spacing and styling

#### `scroll-area.tsx`
Custom styled scrollable containers.

**Features:**
- Cross-browser consistent scrollbar styling
- Smooth scrolling behavior
- Accessible scroll announcements
- Touch-friendly scrolling on mobile

### Navigation Components

#### `tabs.tsx`
Tab navigation with keyboard support.

**Components:**
- `Tabs` - Root container
- `TabsList` - Tab button container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content panel

**Features:**
- Arrow key navigation between tabs
- Automatic content switching
- Accessible announcements
- Focus management

**Usage:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    <p>Tab 1 content</p>
  </TabsContent>
  <TabsContent value="tab2">
    <p>Tab 2 content</p>
  </TabsContent>
</Tabs>
```

#### `dropdown-menu.tsx`
Context menus and dropdown interfaces.

**Components:**
- `DropdownMenu` - Root container
- `DropdownMenuTrigger` - Trigger button
- `DropdownMenuContent` - Menu container
- `DropdownMenuItem` - Individual menu item
- `DropdownMenuSeparator` - Visual separators
- `DropdownMenuLabel` - Section labels
- `DropdownMenuCheckboxItem` - Checkbox items
- `DropdownMenuRadioGroup` - Radio group container
- `DropdownMenuRadioItem` - Radio items
- `DropdownMenuSub` - Nested submenus

**Features:**
- Full keyboard navigation
- Proper focus management
- Collision detection and positioning
- Animation support
- Nested menu support

### Feedback Components

#### `alert.tsx`
Contextual notifications and messages.

**Props Interface:**
```tsx
interface AlertProps {
  variant?: 'default' | 'destructive';
  className?: string;
}
```

**Components:**
- `Alert` - Container
- `AlertTitle` - Bold title
- `AlertDescription` - Message content

**Features:**
- Semantic HTML with proper roles
- Icon integration with consistent sizing
- Variant styling (default, destructive)
- Accessible color contrast

**Usage:**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>
```

#### `badge.tsx`
Status indicators and labels.

**Features:**
- Multiple variants (default, secondary, destructive, outline)
- Consistent sizing and spacing
- Icon support
- Semantic HTML for screen readers

#### `progress.tsx`
Progress bars and loading indicators.

**Features:**
- Animated progress updates
- Accessible value announcements
- Customizable colors and sizing
- Indeterminate state support

#### `tooltip.tsx`
Hover and focus-triggered information overlays.

**Features:**
- Smart positioning with collision detection
- Keyboard activation (focus/blur)
- Accessible announcements
- Configurable delays and animations

**Usage:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Hover me</Button>
  </TooltipTrigger>
  <TooltipContent>
    <p>This is a tooltip</p>
  </TooltipContent>
</Tooltip>
```

### Interactive Components

#### `collapsible.tsx`
Expandable and collapsible content sections.

**Features:**
- Smooth expand/collapse animations
- Keyboard activation
- Accessible state announcements
- Custom trigger styling

#### `avatar.tsx`
User profile images with fallback support.

**Features:**
- Image loading with fallback states
- Text initials generation
- Icon fallbacks
- Consistent sizing variants
- Accessible alt text handling

### Utility Components

#### `theme-toggle.tsx`
System/light/dark theme selector.

**Features:**
- System preference detection
- Persistent theme storage
- Smooth transitions between themes
- Accessible theme announcements
- Icon state management

**Usage:**
```tsx
<ThemeToggle />
```

## Dependencies

### Core Dependencies
- **@radix-ui/react-\***: Headless UI primitives for accessibility
- **class-variance-authority**: Type-safe variant system
- **clsx**: Conditional class name utility
- **tailwindcss**: Utility-first CSS framework
- **next-themes**: Theme management for Next.js

### Development Dependencies
- **@types/react**: TypeScript definitions
- **tailwind-merge**: Tailwind class merging utility

## Customization

### Theming
Components use CSS custom properties for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Extending Components
Components can be extended through composition:

```tsx
const CustomButton = ({ className, ...props }: ButtonProps) => {
  return (
    <Button 
      className={cn("custom-styles", className)} 
      {...props} 
    />
  );
};
```

### Variant System
Using Class Variance Authority for type-safe variants:

```tsx
const customVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        custom: "custom-classes",
      },
    },
  }
);
```

## Accessibility Features

### Keyboard Navigation
- Tab order management
- Arrow key navigation in composite widgets
- Enter/Space activation
- Escape dismissal for overlays

### Screen Reader Support
- Semantic HTML elements
- Proper ARIA labels and descriptions
- State announcements
- Focus management

### Visual Accessibility
- WCAG AA color contrast compliance
- Focus indicators with proper contrast
- High contrast mode support
- Reduced motion preferences

## Performance Considerations

### Bundle Size
- Tree-shakeable exports
- Minimal runtime dependencies
- Shared utilities across components

### Runtime Performance
- Efficient re-rendering with proper keys
- Memoization where beneficial
- Optimized animations with CSS transforms

## Testing

Components are tested with:
- **Jest**: Unit testing framework
- **React Testing Library**: DOM testing utilities
- **@testing-library/jest-dom**: Custom matchers
- **@axe-core/react**: Accessibility testing

## Best Practices

### Component Usage
1. Always provide accessible labels
2. Use semantic HTML where possible
3. Handle loading and error states
4. Test keyboard navigation
5. Verify color contrast

### Styling
1. Use the `cn()` utility for conditional classes
2. Maintain consistent spacing scales
3. Follow mobile-first responsive design
4. Leverage CSS variables for theming

### Performance
1. Use React.memo for expensive components
2. Implement proper loading states
3. Optimize for bundle size
4. Test with slower devices

## Migration Guide

### From Other UI Libraries
When migrating from other UI libraries:

1. Replace component imports
2. Update prop names to match interfaces
3. Adjust styling classes if needed
4. Test accessibility features
5. Update theme configuration

### Adding New Components
To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

This will:
1. Download the component files
2. Add to the ui directory
3. Update component exports
4. Install required dependencies