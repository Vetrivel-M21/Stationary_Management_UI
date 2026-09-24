import React, { useEffect, useState } from 'react';
import TokenInvalid from '../../pages/TokenInvalid';
import {
  EIGHT_HOURS_MS,
  validateGatewayToken,
  extractGatewayCredentialsFromUrl,
  cleanGatewayUrlParams,
  getStoredGatewayCredentials,
  setGatewaySession,
  clearGatewaySession,
} from '../../services/gatewayService';

/**
 * GatewayGuard Component
 * Enforces mandatory ARMSS Gateway device token verification, 8-hour session lifetimes,
 * address bar cleanup, and periodic background revocation checks.
 */
export const GatewayGuard = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [errorReason, setErrorReason] = useState('');

  useEffect(() => {
    let timerId;
    let pollIntervalId;

    const unlock = (remainingMs, devId, tok) => {
      cleanGatewayUrlParams();
      setIsAuthorized(true);

      // Auto-lock after remaining 8 hours
      timerId = setTimeout(() => {
        clearGatewaySession();
        setErrorReason('Your 8-hour work session has expired. Please relaunch from ARMSS Gateway.');
        setIsAuthorized(false);
      }, remainingMs);

      // Periodic check every 15 minutes for admin token revocation
      pollIntervalId = setInterval(async () => {
        const { deviceId: currentDevId, token: currentTok } = getStoredGatewayCredentials();
        const effectiveDevId = currentDevId || devId;
        const effectiveTok = currentTok || tok;

        if (!effectiveDevId || !effectiveTok) return;

        try {
          const checkRes = await validateGatewayToken(effectiveDevId, effectiveTok);
          if (checkRes.isValid === false) {
            clearGatewaySession();
            setErrorReason('Access revoked by administrator. Please contact your admin or request activation.');
            setIsAuthorized(false);
          }
        } catch (_) {
          // Ignore transient poll network errors to avoid dropping active sessions prematurely
        }
      }, 15 * 60 * 1000);
    };

    const runValidation = async () => {
      const { urlDeviceId, urlToken } = extractGatewayCredentialsFromUrl();
      const { deviceId: sessionDeviceId, token: sessionToken, loginTime: sessionLoginTime } =
        getStoredGatewayCredentials();

      const now = Date.now();

      // 1. Check 8-Hour expiration for existing session
      if (sessionLoginTime > 0 && now - sessionLoginTime > EIGHT_HOURS_MS) {
        clearGatewaySession();
        setErrorReason('Your 8-hour work session has expired. Please relaunch from ARMSS Gateway.');
        setIsAuthorized(false);
        return;
      }

      // 2. Identify effective credentials
      const effectiveDeviceId = urlDeviceId || sessionDeviceId || '';
      const effectiveToken = urlToken || sessionToken || '';

      // Always verify against live ARMSS Gateway before mounting the application
      const validationResult = await validateGatewayToken(effectiveDeviceId, effectiveToken);

      if (!validationResult.isValid) {
        clearGatewaySession();
        setErrorReason(validationResult.reason || 'Access denied: Device token revoked or invalid.');
        setIsAuthorized(false);
        return;
      }

      // Verification successful: store credentials and schedule expiration
      setGatewaySession(effectiveDeviceId, effectiveToken);
      const remainingMs = sessionLoginTime > 0
        ? Math.max(0, EIGHT_HOURS_MS - (now - sessionLoginTime))
        : EIGHT_HOURS_MS;

      unlock(remainingMs, effectiveDeviceId, effectiveToken);
    };

    runValidation();

    return () => {
      if (timerId) clearTimeout(timerId);
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, []);

  // Loading state
  if (isAuthorized === null) {
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
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #334155',
              borderTopColor: '#22d3ee',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto',
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#94a3b8',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            Verifying ARMSS Gateway Session...
          </p>
        </div>
      </div>
    );
  }

  // Unauthorized / Invalid state
  if (isAuthorized === false) {
    return <TokenInvalid reason={errorReason} />;
  }

  // Authorized state
  return <>{children}</>;
};

export default GatewayGuard;

