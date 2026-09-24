export const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
export const GATEWAY_VALIDATION_URL =
  import.meta.env.VITE_GATEWAY_VALIDATION_URL || 'https://armssgateway.arminfo.in/api/v1/auth/validate-token';

const SESSION_KEYS = [
  'gateway_device_id',
  'gateway_token',
  'gateway_login_time',
  'device_id',
  'device_token',
];

const URL_PARAM_KEYS = [
  'gateway_device_id',
  'device_id',
  'gateway_token',
  'device_token',
  'token',
  'entry_secret',
];

/**
 * Validates device token against the ARMSS Gateway API.
 * @param {string} deviceId
 * @param {string} token
 * @returns {Promise<{ isValid: boolean, reason?: string, data?: any }>}
 */
export async function validateGatewayToken(deviceId, token) {
  try {
    const payload = JSON.stringify({
      device_id: deviceId || '',
      token: token || '',
    });

    const res = await fetch(GATEWAY_VALIDATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    if (!res || !res.ok) {
      return {
        isValid: false,
        reason: 'Security verification failed. Device token revoked or invalid.',
      };
    }

    const responseData = await res.json();
    const data = responseData.data ?? responseData;
    const isValid = data.valid ?? data.is_valid;

    if (isValid !== true) {
      return {
        isValid: false,
        reason:
          !deviceId || !token
            ? 'The requested URL was not found on this server. Direct web browser access without ARMSS Gateway launch authorization is restricted.'
            : data.reason
            ? `Access denied: ${data.reason}`
            : 'Access denied: Device token revoked or invalid.',
        data,
      };
    }

    return {
      isValid: true,
      data,
    };
  } catch (err) {
    return {
      isValid: false,
      reason: 'Unable to reach ARMSS Gateway verification service.',
      error: err,
    };
  }
}

/**
 * Extracts gateway credentials from window URL search parameters.
 */
export function extractGatewayCredentialsFromUrl() {
  if (typeof window === 'undefined') return { urlDeviceId: '', urlToken: '' };
  const urlParams = new URLSearchParams(window.location.search);
  const urlDeviceId = urlParams.get('gateway_device_id') || urlParams.get('device_id') || '';
  const urlToken =
    urlParams.get('gateway_token') || urlParams.get('token') || urlParams.get('device_token') || '';
  return { urlDeviceId, urlToken };
}

/**
 * Removes gateway authentication tokens and query params from the browser address bar.
 */
export function cleanGatewayUrlParams() {
  if (typeof window === 'undefined') return;
  const urlParams = new URLSearchParams(window.location.search);
  let changed = false;

  URL_PARAM_KEYS.forEach((k) => {
    if (urlParams.has(k)) {
      urlParams.delete(k);
      changed = true;
    }
  });

  if (changed) {
    const cleanQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + cleanQuery + window.location.hash
    );
  }
}

/**
 * Retrieves current gateway credentials from sessionStorage.
 */
export function getStoredGatewayCredentials() {
  if (typeof window === 'undefined') return { deviceId: '', token: '', loginTime: 0 };
  const deviceId =
    sessionStorage.getItem('gateway_device_id') || sessionStorage.getItem('device_id') || '';
  const token =
    sessionStorage.getItem('gateway_token') || sessionStorage.getItem('device_token') || '';
  const loginTimeStr = sessionStorage.getItem('gateway_login_time');
  const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : 0;

  return { deviceId, token, loginTime };
}

/**
 * Stores active gateway credentials in sessionStorage and cleans legacy localStorage entries.
 */
export function setGatewaySession(deviceId, token) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('gateway_device_id', deviceId);
  sessionStorage.setItem('gateway_token', token);
  sessionStorage.setItem('device_id', deviceId);
  sessionStorage.setItem('device_token', token);
  sessionStorage.setItem('gateway_login_time', String(Date.now()));

  // Clean legacy localStorage keys
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
}

/**
 * Clears all gateway session tokens from sessionStorage and localStorage.
 */
export function clearGatewaySession() {
  if (typeof window === 'undefined') return;
  SESSION_KEYS.forEach((k) => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
}

