# Hook Line Studio - UI Components Library

## Overview

This document provides comprehensive documentation for the UI components library implemented for Hook Line Studio. The library includes Radix UI-based components, custom application components, form components, mobile-optimized interfaces, and advanced hook display components.

## Component Categories

### 1. Base UI Components (`/components/ui/`)

#### Form Components
- **Button** - Versatile button component with multiple variants (default, outline, ghost, etc.)
- **Input** - Text input with proper focus states and accessibility
- **Textarea** - Multi-line text input with resize controls
- **Label** - Form labels with proper association
- **Select** - Dropdown selection with search and keyboard navigation
- **Checkbox** - Checkbox input with custom styling
- **Switch** - Toggle switch component

#### Layout Components
- **Card** - Container component with header, content, and footer sections
- **Dialog** - Modal dialogs with overlay and close functionality
- **Tabs** - Tabbed interface with keyboard navigation
- **DropdownMenu** - Context menus with nested items and shortcuts

#### Feedback Components
- **Toast** - Notification system with multiple variants (success, error, warning)
- **Toaster** - Toast container and management system
- **Progress** - Progress bars for loading states
- **Badge** - Status indicators and labels
- **Skeleton** - Loading placeholders

#### Display Components
- **Avatar** - User profile images with fallbacks
- **ErrorBoundary** - Error handling wrapper
- **LoadingSpinner** - Loading indicators

### 2. Layout Components (`/components/layout/`)

#### Core Layout
- **Container** - Responsive container with multiple size options
- **NavBar** - Main navigation with user menu and mobile support
- **Footer** - Footer with links, social media, and company information
- **Hero** - Landing page hero section with animations

### 3. Hook Display Components (`/components/hook/`)

#### Hook Visualization
- **HookCard** - Individual hook display with psychology analysis
  - Quality score visualization
  - Psychological driver indicators
  - Risk assessment badges
  - Tri-modal component display (verbal, visual, textual)
  - Framework attribution
  - Copy and favorite functionality

- **HookResults** - Comprehensive hook results management
  - Filtering by category, risk level, psychology
  - Sorting by score, word count, risk
  - Grid and list view modes
  - Export functionality
  - Batch operations

- **TriModalHookResults** - Specialized tri-modal hook display
  - Side-by-side verbal, visual, and textual components
  - Platform-specific optimization display
  - Quality metrics breakdown
  - Framework analysis section

### 4. Form Components (`/components/forms/`)

#### Hook Generation
- **HookGenerationForm** - Multi-step form for hook generation
  - Platform selection (TikTok, Instagram, YouTube)
  - Objective selection (watch time, shares, saves, CTR, follows)
  - Topic input with character counting
  - Model selection (GPT-4o, GPT-4o Mini)
  - Credit usage display
  - Step-by-step progression

### 5. Onboarding Components (`/components/onboarding/`)

#### User Setup
- **OnboardingFlow** - Complete 3-step onboarding process
- **OnboardingStep1** - Business and audience information
  - Company/brand name
  - Industry selection
  - Role identification
  - Target audience description

- **OnboardingStep2** - Brand voice and content guidelines
  - Voice selection (8 different personalities)
  - Safety mode configuration
  - Banned terms management

- **OnboardingStep3** - Content strategy and platforms
  - Platform selection
  - Content goals (up to 3)
  - Successful hook examples

### 6. Authentication Components (`/components/auth/`)

#### User Authentication
- **AuthForm** - Complete authentication interface
  - Email/password sign in and sign up
  - Google OAuth integration
  - Form validation
  - Error handling
  - Feature highlights

### 7. Mobile Components (`/components/mobile/`)

#### Mobile Optimization
- **MobileHookCard** - Touch-optimized hook display
  - Swipe gestures for actions
  - Expandable details
  - Touch-friendly controls
  - Gesture hints

- **MobileBottomNav** - Mobile navigation bar
  - Tab-based navigation
  - Credit counter badge
  - Active state indicators
  - Safe area support

## Design System

### Color System
- **Primary**: Blue-based color scheme for main actions
- **Secondary**: Gray-based colors for secondary elements
- **Success**: Green for positive feedback
- **Warning**: Yellow for caution states
- **Destructive**: Red for errors and dangerous actions

### Typography
- **Font Family**: Inter for UI, Fira Code for monospace
- **Scale**: Consistent type scale from xs to 7xl
- **Weight**: Regular, medium, semibold, bold variants

### Spacing
- **Scale**: 4px base unit with standard multipliers
- **Custom**: Additional 18 (4.5rem) and 88 (22rem) units

### Animations
- **Duration**: 200-500ms for UI transitions
- **Easing**: Ease-out for entrances, ease-in for exits
- **Types**: Fade, slide, scale, and custom animations

## Psychological Framework Integration

### Hook Categories
- Question-based hooks
- Statement-based hooks
- Narrative hooks
- Urgency/exclusivity hooks
- Efficiency hooks

### Psychological Drivers
- Curiosity gap
- Pain point
- Value hit
- Surprise/shock
- Social proof
- Urgency/FOMO
- Authority/credibility
- Emotional connection

### Risk Assessment
- **Low Risk**: Family-friendly, safe content
- **Medium Risk**: Balanced approach with some edge
- **High Risk**: Bold, provocative content

## Responsive Design

### Breakpoints
- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Desktops
- **xl**: 1280px - Large desktops
- **2xl**: 1536px - Extra large screens

### Mobile-First Approach
- All components designed mobile-first
- Progressive enhancement for larger screens
- Touch-friendly interfaces
- Swipe gestures for mobile interactions

## Accessibility Features

### WCAG Compliance
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility

### Interactive States
- Focus indicators
- Hover states
- Active states
- Disabled states
- Loading states

## Performance Optimizations

### Code Splitting
- Component-level splitting
- Lazy loading for non-critical components
- Bundle size optimization

### Animations
- GPU-accelerated transforms
- Reduced motion support
- Performance-conscious animations

## Usage Examples

### Basic Hook Display
```tsx
import { HookCard } from '@/components'

<HookCard
  hook={hookData}
  platform="tiktok"
  objective="watch_time"
  isFavorite={false}
  onFavoriteToggle={() => handleFavorite()}
  onCopy={() => handleCopy()}
/>
```

### Hook Generation Form
```tsx
import { HookGenerationForm } from '@/components'

<HookGenerationForm
  onSubmit={(data) => generateHooks(data)}
  isLoading={isGenerating}
  creditsRemaining={userCredits}
/>
```

### Mobile Hook Interface
```tsx
import { MobileHookCard, MobileBottomNav } from '@/components'

<MobileHookCard
  hook={hookData}
  onSwipeLeft={() => copyHook()}
  onSwipeRight={() => favoriteHook()}
/>
<MobileBottomNav creditsRemaining={credits} />
```

## Component Props Interface

### HookCard Props
```typescript
interface HookCardProps {
  hook: HookObject
  platform?: string
  objective?: string
  showDetails?: boolean
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  onCopy?: () => void
  className?: string
}
```

### HookGenerationForm Props
```typescript
interface HookGenerationFormProps {
  onSubmit: (data: FormData) => void
  isLoading?: boolean
  creditsRemaining?: number
  className?: string
}
```

## Testing Guidelines

### Component Testing
- Unit tests for all interactive components
- Integration tests for form flows
- Accessibility testing with axe-core
- Visual regression testing

### Mobile Testing
- Touch interaction testing
- Gesture recognition testing
- Performance testing on devices
- Cross-browser mobile testing

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Browsers
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

## Future Enhancements

### Planned Features
- Dark mode improvements
- Additional animation options
- More psychological frameworks
- Enhanced mobile gestures
- Improved accessibility features

### Performance Improvements
- Virtual scrolling for large hook lists
- Image optimization
- Lazy loading enhancements
- Bundle size reduction

## Implementation Status

✅ **Completed Components**
- All base UI components (18 components)
- Layout components (4 components)
- Hook display components (3 components)
- Form components (1 component)
- Onboarding flow (4 components)
- Authentication components (1 component)
- Mobile components (2 components)

✅ **Features Implemented**
- Responsive design across all components
- Accessibility compliance
- Toast notification system
- Mobile-optimized interfaces
- Psychological framework integration
- Animation system
- Dark mode support

This comprehensive UI components library provides the foundation for Hook Line Studio's user interface, ensuring consistent design, excellent user experience, and scalable component architecture.