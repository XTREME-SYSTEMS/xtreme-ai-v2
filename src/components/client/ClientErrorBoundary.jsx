import React from "react";

// Error boundary for the client portal — catches render errors on any
// client page and shows a friendly fallback instead of a blank screen.
// The user can retry or go back to their package page.
export default class ClientErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ClientErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-8 max-w-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            <p className="mt-1.5 text-sm text-white/60">
              We hit an unexpected error loading this page. Try again, or go back to your package.
            </p>
            <div className="mt-5 flex gap-2 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
              >
                Try again
              </button>
              <button
                onClick={() => { window.location.href = "/business-generator"; }}
                className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
              >
                Go to My Package
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}