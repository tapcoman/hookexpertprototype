import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import HookCard from '../../../src/components/hook/HookCard'
import { testHooks } from '../../../tests/fixtures/hooks.fixture'

// Mock hooks and utilities
jest.mock('../../../src/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('../../../src/lib/analytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
  }),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

describe('HookCard', () => {
  const mockProps = {
    hook: testHooks[0],
    platform: 'tiktok',
    objective: 'watch_time',
    showDetails: true,
    isFavorite: false,
    isConnected: true,
    onFavoriteToggle: jest.fn(),
    onCopy: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders hook content correctly', () => {
    render(<HookCard {...mockProps} />)

    expect(screen.getByText(testHooks[0].text)).toBeInTheDocument()
    expect(screen.getByText(`Formula: ${testHooks[0].formula}`)).toBeInTheDocument()
    expect(screen.getByText(`${testHooks[0].confidence}%`)).toBeInTheDocument()
  })

  it('displays platform and objective badges', () => {
    render(<HookCard {...mockProps} />)

    expect(screen.getByText('TikTok')).toBeInTheDocument()
    expect(screen.getByText('Watch Time')).toBeInTheDocument()
  })

  it('shows psychological drivers', () => {
    render(<HookCard {...mockProps} />)

    testHooks[0].psychologicalDrivers.forEach(driver => {
      const formattedDriver = driver.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      expect(screen.getByText(formattedDriver)).toBeInTheDocument()
    })
  })

  it('calls onCopy when copy button is clicked', async () => {
    const user = userEvent.setup()
    render(<HookCard {...mockProps} />)

    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    expect(mockProps.onCopy).toHaveBeenCalled()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testHooks[0].text)
  })

  it('calls onFavoriteToggle when favorite button is clicked', async () => {
    const user = userEvent.setup()
    render(<HookCard {...mockProps} />)

    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    await user.click(favoriteButton)

    expect(mockProps.onFavoriteToggle).toHaveBeenCalled()
  })

  it('shows different favorite icon when hook is favorited', () => {
    render(<HookCard {...mockProps} isFavorite={true} />)

    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    expect(favoriteButton).toHaveClass('text-red-500') // Assuming favorited state has red color
  })

  it('displays confidence level with appropriate styling', () => {
    // Test high confidence
    render(<HookCard {...mockProps} hook={{ ...testHooks[0], confidence: 95 }} />)
    expect(screen.getByText('95%')).toBeInTheDocument()

    // Test medium confidence
    const { rerender } = render(<HookCard {...mockProps} hook={{ ...testHooks[0], confidence: 70 }} />)
    expect(screen.getByText('70%')).toBeInTheDocument()

    // Test low confidence
    rerender(<HookCard {...mockProps} hook={{ ...testHooks[0], confidence: 40 }} />)
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('shows risk level indicator', () => {
    render(<HookCard {...mockProps} />)
    
    // Should show risk level badge
    const riskLevel = testHooks[0].riskLevel || 'medium'
    expect(screen.getByText(riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1))).toBeInTheDocument()
  })

  it('displays effectiveness rating', () => {
    render(<HookCard {...mockProps} />)
    
    const effectiveness = testHooks[0].effectiveness || 8.0
    expect(screen.getByText(`${effectiveness}/10`)).toBeInTheDocument()
  })

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      hook: testHooks[0],
    }

    render(<HookCard {...minimalProps} />)
    
    expect(screen.getByText(testHooks[0].text)).toBeInTheDocument()
  })

  it('shows reasoning when details are enabled', () => {
    render(<HookCard {...mockProps} showDetails={true} />)
    
    expect(screen.getByText(testHooks[0].reasoning!)).toBeInTheDocument()
  })

  it('hides reasoning when details are disabled', () => {
    render(<HookCard {...mockProps} showDetails={false} />)
    
    expect(screen.queryByText(testHooks[0].reasoning!)).not.toBeInTheDocument()
  })

  it('shows dropdown menu with additional options', async () => {
    const user = userEvent.setup()
    render(<HookCard {...mockProps} />)

    const menuButton = screen.getByRole('button', { name: /more options/i })
    await user.click(menuButton)

    expect(screen.getByText('View Details')).toBeInTheDocument()
    expect(screen.getByText('Share')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-hook-card'
    render(<HookCard {...mockProps} className={customClass} />)

    const hookCard = screen.getByRole('article') // Assuming the card has article role
    expect(hookCard).toHaveClass(customClass)
  })

  it('handles long hook text with proper truncation', () => {
    const longHook = {
      ...testHooks[0],
      text: 'This is a very long hook text that should be truncated when displayed in the card component to ensure proper layout and readability',
    }

    render(<HookCard {...mockProps} hook={longHook} />)
    
    expect(screen.getByText(longHook.text)).toBeInTheDocument()
  })

  it('shows platform-specific adaptations when available', () => {
    const hookWithAdaptations = {
      ...testHooks[0],
      adaptations: {
        instagram: 'Instagram version of the hook',
        youtube: 'YouTube version of the hook',
      },
    }

    render(<HookCard {...mockProps} hook={hookWithAdaptations} showDetails={true} />)
    
    expect(screen.getByText('Platform Adaptations')).toBeInTheDocument()
    expect(screen.getByText('Instagram version of the hook')).toBeInTheDocument()
    expect(screen.getByText('YouTube version of the hook')).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<HookCard {...mockProps} />)

    const copyButton = screen.getByRole('button', { name: /copy/i })
    const favoriteButton = screen.getByRole('button', { name: /favorite/i })

    // Tab to copy button
    await user.tab()
    expect(copyButton).toHaveFocus()

    // Tab to favorite button
    await user.tab()
    expect(favoriteButton).toHaveFocus()

    // Press Enter on favorite button
    await user.keyboard('{Enter}')
    expect(mockProps.onFavoriteToggle).toHaveBeenCalled()
  })

  it('displays loading state when disconnected', () => {
    render(<HookCard {...mockProps} isConnected={false} />)
    
    // Should show some loading indicator or disabled state
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })
})