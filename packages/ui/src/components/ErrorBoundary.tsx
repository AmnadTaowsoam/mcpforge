import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 border border-red-200 rounded bg-red-50 text-sm text-red-700">
            <strong>Something went wrong.</strong>{' '}
            {this.state.error?.message}
          </div>
        )
      )
    }
    return this.props.children
  }
}
