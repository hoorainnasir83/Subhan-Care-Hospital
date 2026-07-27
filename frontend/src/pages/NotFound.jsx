import React from 'react';

const NotFound = ({ onGoHome }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        padding: '40px'
      }}>

        {/* 404 Number */}
        <div style={{
          fontSize: '120px',
          fontWeight: '900',
          lineHeight: '1',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '20px 40px',
          marginBottom: '30px',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          404
        </div>

        {/* Icon */}
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏥</div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          marginBottom: '12px',
          color: 'white'
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '40px',
          maxWidth: '400px',
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onGoHome}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#2563eb',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            🏠 Go to Home
          </button>

          <button
            onClick={() => window.history.back()}
            style={{
              padding: '14px 32px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
          >
            ← Go Back
          </button>
        </div>

        {/* Help */}
        <p style={{
          marginTop: '40px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          🎧 Need help? Call{' '}
          <a
            href="tel:051-8464646"
            style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}
          >
            051-8464646
          </a>
        </p>

        {/* Footer */}
        <p style={{
          marginTop: '20px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)'
        }}>
          © {new Date().getFullYear()} Subhan Care Hospitals Ltd.
        </p>

      </div>
    </div>
  );
};

export default NotFound;