import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <div className="prompt-line">{'>'} render error</div>
          <div className="text-muted">{this.state.error.message}</div>
          <button
            className="pool-save-btn"
            onClick={() => this.setState({ error: null })}
          >
            retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
