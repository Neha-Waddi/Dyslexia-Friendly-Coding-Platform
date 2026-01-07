import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-900 text-white p-6">
          <div className="max-w-lg bg-gray-800 p-6 rounded-lg border border-red-600">
            <h2 className="text-red-400 text-lg font-semibold mb-3">
              Something went wrong in the Editor
            </h2>

            <p className="text-sm text-gray-300 mb-2">
              This usually happens due to a runtime error (missing import, undefined hook, etc.).
            </p>

            <pre className="text-xs bg-black p-3 rounded text-red-300 overflow-auto">
              {this.state.error?.toString()}
            </pre>

            <p className="text-xs text-gray-400 mt-3">
              Check the browser console for full details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
