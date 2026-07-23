import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card max-w-md text-center">
            <AlertTriangle className="mx-auto mb-3 text-expense" size={28} />
            <h2 className="font-display text-lg font-semibold mb-1">Something went wrong</h2>
            <p className="text-sm text-muted mb-4">{this.state.error.message}</p>
            <button className="btn-primary" onClick={() => { this.setState({ error: null }); location.reload(); }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
