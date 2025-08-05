# PWA Icons - Hook Line Studio

This document describes the PWA icon generation system for Hook Line Studio.

## Generated Icons

The following PWA icons are automatically generated using brand colors from the design system:

### Icon Files
- `/public/icons/icon-192x192.png` - Main PWA icon (192x192)
- `/public/icons/icon-512x512.png` - High-res PWA icon (512x512)
- `/public/favicon-32x32.png` - Standard favicon (32x32)
- `/public/favicon-16x16.png` - Small favicon (16x16)
- `/public/apple-touch-icon.png` - Apple touch icon (180x180)

### Design Details
- **Logo**: Professional "HL" text representing "Hook Line"
- **Background**: Radial gradient using brand colors (hook-blue → flow-indigo → hook-navy)
- **Typography**: Inter font family with bold weight
- **Effects**: Subtle text shadow and highlight overlay for depth
- **Colors**: Consistent with design system (`src/styles/design-system.css`)

## Regenerating Icons

To regenerate all PWA icons (useful after design system updates):

```bash
# Using npm script (recommended)
npm run generate-icons

# Or directly
node generate-icons.js
```

## Technical Implementation

The icon generation uses:
- **Sharp** - High-performance image processing
- **SVG** - Vector-based design for crisp rendering at all sizes
- **Programmatic generation** - Consistent branding across all icon sizes

### Dependencies
- `sharp` - Image processing library
- Node.js ES modules

### Script Features
- Responsive sizing (font size scales with icon dimensions)
- High-quality PNG output with optimization
- Automatic directory creation
- File verification and logging
- Brand color consistency

## Manifest Configuration

Icons are properly configured in `/public/manifest.json` with:
- Multiple sizes for optimal PWA support
- `purpose: "any maskable"` for adaptive icons
- Proper MIME types and paths

## Browser Support

Generated icons support:
- Progressive Web App installation
- Browser tab favicons
- iOS home screen icons
- Android adaptive icons
- Windows tile icons

## File Sizes

Typical generated file sizes:
- 16x16: ~0.7KB
- 32x32: ~1.7KB
- 180x180: ~8.7KB
- 192x192: ~9.5KB
- 512x512: ~38KB

All files are optimized PNG format with quality settings balanced for size and visual fidelity.