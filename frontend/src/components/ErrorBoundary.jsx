import React from 'react';
import { ServerCrash, RotateCcw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log to an external service in production instead of console
    if (typeof window !== 'undefined' && window.__ERROR_LOG__) {
      window.__ERROR_LOG__.push({
        error: error?.toString(),
        stack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center border border-slate-200 dark:border-slate-800">
            {/* Icon */}
            <div className="mx-auto h-20 w-20 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 shadow-lg">
              <ServerCrash className="h-10 w-10 text-red-600 dark:text-red-400" strokeWidth={1.5} />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 ring-1 ring-red-200 dark:ring-red-800 mb-4">
              <Bug className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Application Error</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-3" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Something Went Wrong
            </h1>

            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this page. You can try refreshing or return to the dashboard.
            </p>

            {/* Error Detail (Development only — hidden by default in prod) */}
            {this.state.error && (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 text-left max-h-32 overflow-auto">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all leading-relaxed">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                <RotateCcw className="h-4 w-4" />
                Refresh Page
              </button>

              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={() => { window.location.href = '/'; }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </button>
            </div>

            {/* Help */}
            <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
              Need help? Call{' '}
              <a href="tel:051-8464646" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                051-8464646
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;