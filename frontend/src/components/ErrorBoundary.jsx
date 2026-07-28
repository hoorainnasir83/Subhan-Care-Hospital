import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Icon */}
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>

            {/* Title */}
            <h1 style={{
              color: '#1F2937',
              fontSize: '24px',
              fontWeight: '800',
              marginBottom: '12px'
            }}>
              Something Went Wrong
            </h1>

            {/* Description */}
            <p style={{
              color: '#6B7280',
              fontSize: '14px',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              An unexpected error occurred. Please refresh the page or contact support.
            </p>

            {/* Error Details */}
            {this.state.error && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <p style={{
                  color: '#991B1B',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: 0,
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Page
              </button>

              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '12px 24px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ↩ Try Again
              </button>
            </div>

            {/* Help */}
            <p style={{
              marginTop: '24px',
              fontSize: '12px',
              color: '#9CA3AF'
            }}>
              Need help? Call{' '}
              <a href="tel:051-8464646" style={{ color: '#2563eb', fontWeight: '700' }}>
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