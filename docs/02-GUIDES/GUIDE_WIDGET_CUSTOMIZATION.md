# Widget Customization Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Verified For:** v0.1.0
**Dependencies:** [Widget Setup Guide](./GUIDE_WIDGET_SETUP.md)
**Estimated Read Time:** 10 minutes

## Purpose
This guide explains how to fully customize your chat widget using the new image upload and animation features, enabling complete brand alignment with your website.

## Quick Links
- [EssentialsSection Component](../../app/dashboard/customize/sections/EssentialsSection.tsx)
- [Upload API](../../app/api/widget-assets/upload/route.ts)
- [Animation Styles](../../app/dashboard/customize/components/AnimationStyles.tsx)

## Table of Contents
- [Overview](#overview)
- [Custom Icon Upload](#custom-icon-upload)
- [Multiple Icon States](#multiple-icon-states)
- [Animation Options](#animation-options)
- [Storage Architecture](#storage-architecture)
- [Troubleshooting](#troubleshooting)

---

## Overview

The widget customization system now supports:
- **Custom Icon Upload**: Replace the default message bubble with your brand's icon
- **Multiple Icon States**: Different icons for normal, hover, and active states
- **Animations**: Eye-catching animations with configurable speed and intensity
- **Image Optimization**: Automatic optimization to WebP and PNG formats
- **Multi-tenant Storage**: Secure, organization-isolated file storage

## Custom Icon Upload

### Basic Icon Upload

1. Navigate to **Dashboard → Customize**
2. In the **Appearance** section, find **Minimized Widget Icon**
3. Click **Upload** or paste an image URL
4. The system will:
   - Validate file type (images only)
   - Check file size (max 2MB)
   - Optimize to 128x128 pixels
   - Generate WebP and PNG versions
   - Store securely in Supabase

### Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- SVG
- WebP
- ICO

### Optimization Details
```
Original Image → Sharp Processing →
  ├── WebP (90% quality, ~75% smaller)
  └── PNG (lossless fallback)
```

## Multiple Icon States

Create interactive experiences with different icons for each interaction state:

### Normal State
The default icon shown when the widget is minimized:
```typescript
minimizedIconUrl: "https://storage.../icon-normal.webp"
```

### Hover State
Icon displayed when users hover over the widget:
```typescript
minimizedIconHoverUrl: "https://storage.../icon-hover.webp"
```
- Falls back to normal state if not set
- Creates engaging hover effects

### Active/Clicked State
Icon shown when users click the widget:
```typescript
minimizedIconActiveUrl: "https://storage.../icon-active.webp"
```
- Falls back to normal state if not set
- Provides visual feedback on interaction

### State Preview
The interface shows all three states side-by-side:
- Normal (gray background)
- Hover (blue background)
- Active (green background)

Each state can be individually uploaded or removed.

## Animation Options

Add eye-catching animations to draw attention to your widget:

### Animation Types

1. **Pulse**: Subtle scale and fade effect
   ```css
   animation: pulse 2s infinite
   ```

2. **Bounce**: Vertical bouncing motion
   ```css
   animation: bounce 2s infinite
   ```

3. **Rotate**: Continuous rotation
   ```css
   animation: rotate 2s linear infinite
   ```

4. **Fade**: Opacity pulsing effect
   ```css
   animation: fade 2s infinite
   ```

5. **Wiggle**: Gentle side-to-side rotation
   ```css
   animation: wiggle 2s infinite
   ```

### Animation Speed
- **Slow**: 4 seconds per cycle
- **Normal**: 2 seconds per cycle (default)
- **Fast**: 1 second per cycle

### Animation Intensity
- **Subtle**: 50% of standard effect
- **Normal**: 100% standard effect (default)
- **Strong**: 150% of standard effect

### Accessibility
Animations automatically respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .widget-icon-animated {
    animation: none !important;
  }
}
```

## Storage Architecture

### File Structure
```
storage/widget-assets/
└── organizations/
    └── {organization_id}/
        └── widgets/
            ├── minimized-icon-normal-{timestamp}-{random}.webp
            ├── minimized-icon-normal-{timestamp}-{random}.png
            ├── minimized-icon-hover-{timestamp}-{random}.webp
            ├── minimized-icon-hover-{timestamp}-{random}.png
            ├── minimized-icon-active-{timestamp}-{random}.webp
            └── minimized-icon-active-{timestamp}-{random}.png
```

### Security
- **RLS Policies**: Organization-level isolation
- **Service Role**: Upload via secure API
- **Public Access**: Read-only for widget display
- **Path Validation**: Regex checks on all operations

### Image Delivery
```html
<picture>
  <source srcset="icon.webp" type="image/webp">
  <img src="icon.png" alt="Chat">
</picture>
```
- Modern browsers use WebP (smaller)
- Older browsers fall back to PNG
- Automatic format selection

## API Integration

### Upload Endpoint
```typescript
POST /api/widget-assets/upload

FormData:
- file: File (required)
- type: "minimized-icon-normal" | "minimized-icon-hover" | "minimized-icon-active"
- customerConfigId: string (required)
- organizationId?: string

Response:
{
  success: true,
  data: {
    webpUrl: string,
    pngUrl: string,
    originalSize: number,
    optimizedSize: {
      webp: number,
      png: number
    },
    dimensions: {
      width: 128,
      height: 128
    }
  }
}
```

### Delete Endpoint
```typescript
DELETE /api/widget-assets/upload?path={filepath}

Response:
{
  success: true,
  message: "File deleted successfully"
}
```

## Configuration Storage

Settings are saved in the database and loaded dynamically:

```typescript
widget_configs.branding_settings = {
  customLogoUrl: string,
  minimizedIconUrl: string,
  minimizedIconHoverUrl: string,
  minimizedIconActiveUrl: string
}

widget_configs.behavior_settings = {
  animationType: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle',
  animationSpeed: 'slow' | 'normal' | 'fast',
  animationIntensity: 'subtle' | 'normal' | 'strong'
}
```

## Troubleshooting

### Upload Fails
- **Check file size**: Must be under 2MB
- **Verify format**: Only image files supported
- **Select website**: Must have a customer config selected

### Icon Not Displaying
- **Check URL**: Verify the URL is accessible
- **Clear cache**: Force refresh the widget
- **Fallback**: System falls back to default MessageCircle icon

### Animation Not Working
- **Check browser**: Ensure CSS animations are supported
- **Reduced motion**: Check system accessibility settings
- **Animation type**: Verify animation type is not set to "none"

### Storage Issues
- **Quota**: Check Supabase storage quota
- **RLS policies**: Verify user has organization membership
- **Network**: Check for CORS or network issues

## Best Practices

1. **Icon Design**
   - Use transparent backgrounds
   - Keep designs simple at 64x64 display size
   - Test on both light and dark backgrounds

2. **State Variations**
   - Make hover state 10-20% brighter
   - Active state should show clear interaction
   - Maintain consistent style across states

3. **Animation Usage**
   - Use subtle animations for professional sites
   - Strong animations for attention-grabbing
   - Consider user accessibility preferences

4. **Performance**
   - Icons are cached by CDN
   - WebP reduces bandwidth by 75%
   - Lazy loading prevents initial load impact

## Example Implementation

```typescript
// Complete configuration example
const widgetConfig = {
  essentials: {
    // Custom icons for each state
    minimizedIconUrl: "https://storage.../icon-normal.webp",
    minimizedIconHoverUrl: "https://storage.../icon-hover.webp",
    minimizedIconActiveUrl: "https://storage.../icon-active.webp",

    // Animation settings
    animationType: "pulse",
    animationSpeed: "normal",
    animationIntensity: "subtle",

    // Other appearance settings
    primaryColor: "#3b82f6",
    position: "bottom-right"
  }
}
```

## Next Steps

- [Configure AI Personality](./GUIDE_AI_CONFIGURATION.md)
- [Enable WooCommerce Integration](./GUIDE_WOOCOMMERCE_SETUP.md)
- [Set Up Analytics](./GUIDE_ANALYTICS_SETUP.md)

---

**Need Help?** Contact support or check the [FAQ](../05-TROUBLESHOOTING/TROUBLESHOOTING_WIDGET_ISSUES.md).