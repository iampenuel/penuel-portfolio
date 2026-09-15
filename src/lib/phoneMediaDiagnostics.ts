/** Local / named deployment QA only. No telemetry, content, credentials or visitor identifiers. */
export function logMediaDiagnostic(scope: string, event: string, details: Record<string, string | number | boolean> = {}) {
  const host = window.location.hostname;
  const qaHost = ['localhost', '127.0.0.1'].includes(host)
    || /^penuel-portfolio-.+-penuels-projects-aa802b06\.vercel\.app$/.test(host);
  if (!import.meta.env.DEV && !qaHost) return;
  console.info('Rickroll QA', JSON.stringify({
    scope, event, elapsedMs: Math.round(performance.now()), visibility: document.visibilityState, ...details
  }));
}
