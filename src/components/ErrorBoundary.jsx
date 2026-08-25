import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error(
      `[ErrorBoundary] Caught error in ${this.props.sectionName || 'Component'}:`,
      error,
      errorInfo
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const sectionName = this.props.sectionName || 'This section';

      return (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 shadow-xl space-y-3 animate-fade-in my-2">
          <div className="flex items-center gap-2 font-bold text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{sectionName} encountered an error</span>
          </div>

          <p className="text-[11px] text-red-300/80 font-mono break-all bg-red-950/50 p-2 rounded-xl border border-red-900/50">
            {this.state.error?.message || 'Unknown render error'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
