export function trackEvent(event: string, data?: Record<string, any>) {
  if (typeof window === "undefined") return;
  // Hook for real analytics (GA/Amplitude/etc). For now, log.
  console.debug("[track]", event, data);
  // window.gtag?.('event', event, data);
}

