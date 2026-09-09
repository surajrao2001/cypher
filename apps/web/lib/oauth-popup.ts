const OAUTH_MESSAGE = 'bynd8:oauth' as const;

export type OAuthPopupMessage =
  | { type: typeof OAUTH_MESSAGE; ok: true; code: string; next?: string }
  | { type: typeof OAUTH_MESSAGE; ok: false; error: string };

export function isOAuthPopupMessage(data: unknown): data is OAuthPopupMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const payload = data as Partial<OAuthPopupMessage>;
  return payload.type === OAUTH_MESSAGE;
}

/** Open provider auth in a centered popup; falls back to full-tab if blocked. */
export function openOAuthPopup(url: string): Window | null {
  const width = 520;
  const height = 720;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  return window.open(
    url,
    'bynd8-oauth',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`,
  );
}

/**
 * Wait for the popup callback to post the auth code (PKCE verifier stays in the opener).
 * Rejects if the user closes the popup without completing sign-in.
 */
export function waitForOAuthPopupCode(popup: Window): Promise<{ code: string; next?: string }> {
  return new Promise((resolve, reject) => {
    const timeoutMs = 5 * 60 * 1000;
    let settled = false;

    function finish(result: () => void) {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(closedPoll);
      window.removeEventListener('message', onMessage);
      result();
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (!isOAuthPopupMessage(event.data)) {
        return;
      }
      const payload = event.data;
      if (!payload.ok) {
        finish(() => reject(new Error(payload.error || 'Sign-in failed')));
        return;
      }
      finish(() => resolve({ code: payload.code, next: payload.next }));
    }

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('Sign-in timed out. Try again.')));
      try {
        popup.close();
      } catch {
        // ignore
      }
    }, timeoutMs);

    const closedPoll = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }
      // Give a late postMessage a tick to arrive before treating as cancel.
      window.setTimeout(() => {
        finish(() => reject(new Error('Sign-in was cancelled')));
      }, 300);
    }, 400);

    window.addEventListener('message', onMessage);
  });
}

export function postOAuthPopupResult(message: OAuthPopupMessage): boolean {
  if (typeof window === 'undefined' || !window.opener || window.opener.closed) {
    return false;
  }
  window.opener.postMessage(message, window.location.origin);
  return true;
}
