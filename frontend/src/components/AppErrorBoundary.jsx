import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary] Unhandled UI error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-gray-900/70 border border-red-700/60 rounded-xl p-6">
            <h1 className="text-xl font-semibold text-red-300 mb-2">Application Error</h1>
            <p className="text-sm text-gray-300 mb-4">
              A UI error occurred. Your process state is still on the server, so reloading is usually safe.
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono text-red-200 bg-black/50 border border-red-900/60 rounded p-3 mb-4 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm font-medium"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
