let suppressHomePopupOnce = false;
let popupBannerShownThisSession = false;

/**
 * Mark that the next time Home is focused, the popup banner should be suppressed once.
 * This is intentionally in-memory (session-only) to avoid async storage timing/flash issues.
 */
export function markSuppressHomePopupOnce() {
  suppressHomePopupOnce = true;
}

/**
 * Consume the suppress flag (returns current value and resets it to false).
 */
export function consumeSuppressHomePopupOnce(): boolean {
  const v = suppressHomePopupOnce;
  suppressHomePopupOnce = false;
  return v;
}

export function hasShownPopupBannerThisSession(): boolean {
  return popupBannerShownThisSession;
}

export function markPopupBannerShownThisSession() {
  popupBannerShownThisSession = true;
}


