import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry,
        });
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class AsyncErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[AsyncErrorBoundary] Caught:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error: {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-2 text-sm text-red-500 hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}