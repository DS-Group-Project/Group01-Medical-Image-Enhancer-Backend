import React from 'react';
import { safeLog } from './utils/safeLog';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // In production this should go to a real error-tracking service
    // (Sentry, etc.) rather than (or in addition to) the console, and should
    // be scrubbed of any request/response payloads that could contain PHI
    // (patient images, filenames, job data) before leaving the browser.
    safeLog.error('ErrorBoundary caught an error', { error: error?.toString(), componentStack: errorInfo?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div style={{ padding: '20px', background: '#ffe6e6', color: '#7a1f1f' }}>
          <h2>Something went wrong.</h2>
          <p>Please refresh the page. If the problem continues, contact support.</p>
          {/*
            Stack traces and component stacks can reveal internal file paths,
            library versions, and sometimes data passed into components —
            useful for us while developing, but information disclosure for an
            attacker in production. Only show them in dev builds.
          */}
          {isDev && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '12px' }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
