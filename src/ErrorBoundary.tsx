import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMessage: string; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, errorMessage: '' };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-red-500 p-6 text-center font-mono">
          <h2 className="text-xl font-bold mb-4">CRITICAL SYSTEM ERROR</h2>
          <p className="text-xs text-red-400 mb-6 max-w-md break-words border border-red-900 p-4 bg-red-950/30 rounded">
            {this.state.errorMessage}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-900 text-white rounded hover:bg-red-800 transition"
          >
            REBOOT APPLICATION
          </button>
        </div>
      );
    }
    return this.props.children;
  }
  }
