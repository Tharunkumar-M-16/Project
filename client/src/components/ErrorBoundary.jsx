import { Component } from 'react';

// Catches render-time crashes so one broken screen doesn't blank the whole app.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center px-4 text-center">
          <div className="card max-w-md">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">An unexpected error occurred while rendering this page.</p>
            <button className="btn-primary mt-4" onClick={() => (window.location.href = '/dashboard')}>
              Back to dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
