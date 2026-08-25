import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Catches render-time crashes anywhere below it and shows a recoverable
 * screen instead of a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="not-found-screen">
        <span className="error-ring"><AlertTriangle size={34} /></span>
        <h1 className="h2-lg">Something went wrong</h1>
        <p className="text-center max-w-sm">
          An unexpected error occurred. Your data is safe - try reloading the page.
        </p>
        {import.meta.env.DEV && (
          <pre className="mono text-xs max-w-md-text">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        )}
        <button type="button" className="btn btn-primary mt-sm" onClick={this.handleReload}>
          <RotateCcw size={15} /> Reload Dayflow
        </button>
      </div>
    );
  }
}
