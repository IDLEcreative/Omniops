import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function that includes providers
export function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add any providers here if needed (e.g., Theme, Context providers)
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { userEvent }