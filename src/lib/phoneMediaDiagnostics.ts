/** Local / named deployment QA only. No telemetry, content, credentials or visitor identifiers. */
let homeInteractiveAt: number | undefined;
export function logMediaDiagnostic(scope: string, event: string, details: Record<string, string | number | boolean> = {}) {
  const host = window.location.hostname;
  const qaHost = ['localhost', '127.0.0.1'].includes(host)
    || (import.meta.env.PHONE_MEDIA_QA && /^penuel-portfolio-.+-penuels-projects-aa802b06\.vercel\.app$/.test(host));
  if (!import.meta.env.DEV && !qaHost) return;
  if (event === 'home-interactive') homeInteractiveAt = performance.now();
  console.info('Rickroll QA', JSON.stringify({
    scope, event, elapsedMs: Math.round(performance.now()), visibility: document.visibilityState,
    ...(event === 'rickroll-ready' && homeInteractiveAt !== undefined ? { readyDelayMs: Math.round(performance.now() - homeInteractiveAt) } : {}),
    ...(event === 'app-tap' || event === 'playVideo' ? { userActivation: navigator.userActivation?.isActive ?? false } : {}), ...details
  }));
}

export function observePhoneMediaTimings() {
  if (typeof PerformanceObserver === 'undefined') return () => {};
  const observers: PerformanceObserver[] = [];
  for (const type of ['paint', 'resource']) {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') logMediaDiagnostic('performance', 'home-fcp', { startMs: Math.round(entry.startTime) });
          if (entry.name === 'https://www.youtube.com/iframe_api') logMediaDiagnostic('performance', 'api-resource', { requestStartMs: Math.round(entry.startTime), durationMs: Math.round(entry.duration) });
        }
      });
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch { /* Timing support is diagnostic-only. */ }
  }
  return () => observers.forEach(observer => observer.disconnect());
}
