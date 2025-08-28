# Styling Guide - Customer Service Agent

## Overview

This project uses shadcn/ui components with Tailwind CSS for styling. This guide ensures consistent styling and prevents common issues.

## Core Dependencies

The following dependencies are required for proper styling:

### CSS Framework
- `tailwindcss` - Core CSS framework
- `tailwindcss-animate` - Animation utilities
- `autoprefixer` - PostCSS plugin for vendor prefixes

### Utility Libraries
- `clsx` - Conditional class name construction
- `tailwind-merge` - Merge Tailwind classes without conflicts
- `class-variance-authority` - Component variant management

### Radix UI (for shadcn/ui components)
All `@radix-ui/react-*` packages are required for their respective components.

## File Structure

```
├── app/
│   └── globals.css          # Global styles and CSS variables
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   └── utils.ts            # cn() utility function
├── tailwind.config.js      # Tailwind configuration
└── postcss.config.mjs      # PostCSS configuration
```

## CSS Variables

All theming is handled through CSS variables defined in `globals.css`:

```css
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring, --radius
```

## Common Issues and Solutions

### 1. Missing Animations
**Issue**: Dropdown menus or modals don't animate properly
**Solution**: Ensure all animation keyframes are defined in `globals.css`

### 2. Dark Mode Not Working
**Issue**: Dark mode styles not applying
**Solution**: Check that the `dark` class is added to the HTML element and dark mode variables are defined

### 3. Component Styling Broken
**Issue**: shadcn/ui components look unstyled
**Solution**: Run `npm run check:deps` to verify all dependencies are installed

### 4. Build Errors
**Issue**: CSS-related build errors
**Solution**: Ensure PostCSS and Tailwind configs are properly set up

## Maintenance Commands

```bash
# Check all dependencies
npm run check:deps

# Run full check (deps + lint + typecheck)
npm run check:all

# Install missing Radix UI dependency
npm install @radix-ui/react-[component-name]
```

## Adding New shadcn/ui Components

When adding new shadcn/ui components:

1. Install the required Radix UI dependency:
   ```bash
   npm install @radix-ui/react-[component-name]
   ```

2. Create the component file in `components/ui/`

3. Import and use the `cn()` utility from `lib/utils`

4. Follow the existing component patterns for consistency

## Troubleshooting Steps

1. **Run dependency check**: `npm run check:deps`
2. **Clear Next.js cache**: `rm -rf .next`
3. **Reinstall dependencies**: `rm -rf node_modules package-lock.json && npm install`
4. **Check browser console** for CSS loading errors
5. **Verify imports** in component files

## Best Practices

1. Always use the `cn()` utility for combining classes
2. Keep component-specific styles in the component file
3. Use CSS variables for theming consistency
4. Test in both light and dark modes
5. Run `npm run check:all` before committing

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Documentation](https://radix-ui.com)