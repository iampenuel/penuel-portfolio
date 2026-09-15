/** Local QA only: no telemetry endpoint, identifiers, or production logging. */
export function logPhoneMediaTiming(stage: 'home-interactive' | 'prepare' | 'ready' | 'app-tap') {
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const youtube = resources.filter(entry => /youtube(?:-nocookie)?\.com|ytimg\.com/.test(entry.name));
  console.info('Phone media QA', JSON.stringify({
    stage,
    elapsedMs: Math.round(performance.now()),
    firstContentfulPaintMs: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0),
    youtubeResources: youtube.length,
    // Cross-origin frames do not expose their internal transfer sizes here.
    visibleTransferBytes: youtube.reduce((total, entry) => total + entry.transferSize, 0)
  }));
}
