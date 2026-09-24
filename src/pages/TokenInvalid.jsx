import React from 'react';

/**
 * TokenInvalid Component / Page
 * Displayed when ARMSS Gateway token validation fails, expires, or direct unauthorized access is attempted.
 */
const TokenInvalid = ({ reason }) => {
  let queryReason = '';
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    queryReason = params.get('reason') || '';
  }

  const effectiveReason = reason || queryReason;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(51, 65, 85, 0.8)',
          borderRadius: '16px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          boxSizing: 'border-box',
        }}
      >
        {/* Security Padlock Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            color: '#f43f5e',
            boxShadow: '0 10px 15px -3px rgba(244, 63, 94, 0.05)',
          }}
        >
          <svg
            style={{ width: '40px', height: '40px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '24px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            Access Restricted
          </span>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.025em',
              margin: '0',
            }}
          >
            You Are Restricted
          </h1>
        </div>

        {/* Explanatory Message Box */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#e2e8f0',
              lineHeight: 1.6,
              margin: '0 0 12px 0',
            }}
          >
            Your access to this application has been restricted by the administrator.
          </p>
          <p
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: '0',
            }}
          >
            If you require access, please submit an activation request from the{' '}
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>ARMSS Gateway</span> desktop
            application, or contact the{' '}
            <span style={{ color: '#22d3ee', fontWeight: 600 }}>ARMSS Infotech Support Team</span>{' '}
            for assistance.
          </p>
          {effectiveReason && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #1e293b',
                fontSize: '11px',
                color: 'rgba(251, 113, 133, 0.95)',
                fontFamily: 'monospace',
                wordBreak: 'break-word',
              }}
            >
              Notice: {effectiveReason}
            </div>
          )}
        </div>

        {/* Footer Support Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          <svg
            style={{ width: '16px', height: '16px', color: '#22d3ee' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>ARMSS Infotech Technical Support</span>
        </div>
      </div>
    </div>
  );
};

export default TokenInvalid;
