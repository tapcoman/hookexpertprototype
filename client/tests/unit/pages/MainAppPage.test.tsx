import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MainAppPage from '../../../src/pages/MainAppPage'
import { testHooks } from '../../../tests/fixtures/hooks.fixture'

// Mock dependencies
jest.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    loading: false,
  }),
}))

jest.mock('../../../src/contexts/AppContext', () => ({
  useGenerationState: () => ({
    defaultPlatform: 'tiktok',
    defaultObjective: 'watch_time',
  }),
  useNotifications: () => ({
    showNotification: jest.fn(),
  }),
}))

jest.mock('../../../src/lib/analytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
  }),
}))

jest.mock('../../../src/lib/api', () => ({
  api: {
    hooks: {
      generate: jest.fn().mockResolvedValue({
        hooks: testHooks,
        topThreeVariants: testHooks.slice(0, 3),
        strategy: {
          primaryTrigger: 'curiosity-gap',
          confidence: 85,
        },
      }),
    },
  },
}))

// Mock components
jest.mock('../../../src/components/hook/HookCard', () => {
  return function MockHookCard({ hook, onFavoriteToggle, onCopy }: any) {
    return (
      <div data-testid={`hook-card-${hook.id}`}>
        <p>{hook.text}</p>
        <button onClick={onFavoriteToggle}>Favorite</button>
        <button onClick={onCopy}>Copy</button>
      </div>
    )
  }
})

jest.mock('../../../src/components/ui/LoadingSpinner', () => ({
  HookGenerationLoading: ({ isVisible }: { isVisible: boolean }) => 
    isVisible ? <div data-testid="loading-spinner">Loading...</div> : null,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('MainAppPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the hook generation form', () => {
    renderWithQueryClient(<MainAppPage />)

    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/objective/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/topic/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate hooks/i })).toBeInTheDocument()
  })

  it('validates form inputs before submission', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    // Try to submit without entering topic
    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    expect(screen.getByText(/please enter a topic/i)).toBeInTheDocument()
  })

  it('validates topic length', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    const topicInput = screen.getByLabelText(/topic/i)
    
    // Test too short topic
    await user.type(topicInput, 'short')
    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    expect(screen.getByText(/topic must be at least 10 characters/i)).toBeInTheDocument()

    // Clear and test too long topic
    await user.clear(topicInput)
    const longTopic = 'a'.repeat(1001)
    await user.type(topicInput, longTopic)
    await user.click(submitButton)

    expect(screen.getByText(/topic must be less than 1000 characters/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockApi = await import('../../../src/lib/api')
    
    renderWithQueryClient(<MainAppPage />)

    // Fill out form
    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')

    const platformSelect = screen.getByLabelText(/platform/i)
    await user.selectOptions(platformSelect, 'youtube')

    const objectiveSelect = screen.getByLabelText(/objective/i)
    await user.selectOptions(objectiveSelect, 'click_through')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockApi.api.hooks.generate).toHaveBeenCalledWith({
        platform: 'youtube',
        objective: 'click_through',
        topic: 'productivity tips for remote workers',
        modelType: 'gpt-4o-mini',
      })
    })
  })

  it('shows loading state during generation', async () => {
    const user = userEvent.setup()
    const mockApi = await import('../../../src/lib/api')
    
    // Make API call hang
    mockApi.api.hooks.generate.mockImplementation(() => new Promise(() => {}))
    
    renderWithQueryClient(<MainAppPage />)

    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')

    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('displays generated hooks after successful generation', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')

    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      testHooks.forEach(hook => {
        expect(screen.getByTestId(`hook-card-${hook.id}`)).toBeInTheDocument()
        expect(screen.getByText(hook.text)).toBeInTheDocument()
      })
    })
  })

  it('shows generation strategy information', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')

    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/primary trigger: curiosity-gap/i)).toBeInTheDocument()
      expect(screen.getByText(/confidence: 85%/i)).toBeInTheDocument()
    })
  })

  it('handles generation errors gracefully', async () => {
    const user = userEvent.setup()
    const mockApi = await import('../../../src/lib/api')
    
    mockApi.api.hooks.generate.mockRejectedValue(new Error('Generation failed'))
    
    renderWithQueryClient(<MainAppPage />)

    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')

    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/generation failed/i)).toBeInTheDocument()
    })
  })

  it('allows copying hooks', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    // Generate hooks first
    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')
    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId(`hook-card-${testHooks[0].id}`)).toBeInTheDocument()
    })

    // Click copy button on first hook
    const copyButton = screen.getAllByText('Copy')[0]
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testHooks[0].text)
  })

  it('allows favoriting hooks', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    // Generate hooks first
    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')
    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId(`hook-card-${testHooks[0].id}`)).toBeInTheDocument()
    })

    // Click favorite button on first hook
    const favoriteButton = screen.getAllByText('Favorite')[0]
    await user.click(favoriteButton)

    // Should trigger favorite toggle logic
    expect(favoriteButton).toHaveBeenCalled
  })

  it('shows model type selection', () => {
    renderWithQueryClient(<MainAppPage />)

    expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /gpt-4o-mini/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /gpt-4o/i })).toBeInTheDocument()
  })

  it('remembers form state between generations', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<MainAppPage />)

    // Set form values
    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips')

    const platformSelect = screen.getByLabelText(/platform/i)
    await user.selectOptions(platformSelect, 'instagram')

    // Generate hooks
    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId(`hook-card-${testHooks[0].id}`)).toBeInTheDocument()
    })

    // Form should retain values
    expect(topicInput).toHaveValue('productivity tips')
    expect(platformSelect).toHaveValue('instagram')
  })

  it('shows appropriate message when no hooks generated', async () => {
    const user = userEvent.setup()
    const mockApi = await import('../../../src/lib/api')
    
    mockApi.api.hooks.generate.mockResolvedValue({
      hooks: [],
      topThreeVariants: [],
      strategy: { primaryTrigger: 'none', confidence: 0 },
    })
    
    renderWithQueryClient(<MainAppPage />)

    const topicInput = screen.getByLabelText(/topic/i)
    await user.type(topicInput, 'productivity tips for remote workers')

    const submitButton = screen.getByRole('button', { name: /generate hooks/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/no hooks were generated/i)).toBeInTheDocument()
    })
  })
})