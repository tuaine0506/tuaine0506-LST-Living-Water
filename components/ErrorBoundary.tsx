import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError && parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error}`;
          if (parsedError.operationType) {
            errorMessage += ` during ${parsedError.operationType}`;
          }
        }
      } catch (e) {
        // Not a JSON error message, use the raw message if available
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-brand-green/20">
            <h2 className="text-2xl font-bold text-brand-green mb-4">Unexpected Error</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand-green text-white py-3 rounded-xl font-bold hover:bg-brand-green/90 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
