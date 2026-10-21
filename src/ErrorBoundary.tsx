import { Component } from 'react';
import type { ReactNode } from 'react';
import { LoadFailure } from './activities/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6" data-testid="error-boundary">
          <div className="w-full max-w-md">
            <LoadFailure message={this.state.error.message} />
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
