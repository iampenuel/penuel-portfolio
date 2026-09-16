/** Preview/dev-only comparison. No telemetry or production route. One player at a time. */
import { flushSync } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { loadYouTubeApi, RICKROLL_SEGMENT, type YouTubePlayer } from '../../lib/youtubePlayer';
import { logMediaDiagnostic } from '../../lib/phoneMediaDiagnostics';
import { MobileRickroll, usePhoneRickroll } from './MobileRickroll';

type Variant = 'application' | 'minimal-nocookie' | 'minimal-standard';
export default function RickrollComparison() {
  const [variant, setVariant] = useState<Variant>('application');
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState('Select a comparison and wait for readiness.');
  const { controller, hostRef } = usePhoneRickroll();
  const minimalHost = useRef<HTMLDivElement>(null);
  const minimalPlayer = useRef<YouTubePlayer | null>(null);
  const [minimalReady, setMinimalReady] = useState(false);

  useEffect(() => {
    if (variant === 'application') return controller.subscribe(() => {
      const state = controller.getSnapshot();
      setReport(JSON.stringify(state));
    });
    let current = true;
    let player: YouTubePlayer | null = null;
    setMinimalReady(false);
    setReport('Loading minimal visible embed…');
    const log = (event: string, detail: Record<string, string | number | boolean> = {}) => {
      logMediaDiagnostic('comparison', event, { variant, ...detail });
      if (current) setReport(JSON.stringify({ variant, event, ...detail }));
    };
    void loadYouTubeApi().then(api => {
      if (!current || !minimalHost.current) return;
      const embedHost = variant === 'minimal-standard' ? 'https://www.youtube.com' : 'https://www.youtube-nocookie.com';
      const params = { autoplay: 0, controls: 1, enablejsapi: 1, playsinline: 1, origin: window.location.origin, start: 42, end: 60 };
      const iframe = document.createElement('iframe');
      iframe.title = 'Minimal official YouTube comparison';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.style.cssText = 'display:block;width:100%;height:240px;border:0';
      iframe.src = `${embedHost}/embed/${RICKROLL_SEGMENT.videoId}?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`;
      minimalHost.current.replaceChildren(iframe);
      log('configuration', { src: iframe.src, allow: iframe.allow, referrerPolicy: iframe.referrerPolicy });
      player = new api.Player(iframe, {
        width: '100%', height: '240', videoId: RICKROLL_SEGMENT.videoId, host: embedHost, playerVars: params,
        events: {
          onReady: () => { if (current) { setMinimalReady(true); log('onReady'); } },
          onStateChange: ({ data }) => { if (current) log('state', { code: data }); },
          onAutoplayBlocked: () => { if (current) log('autoplay-blocked'); },
          onError: ({ data }) => { if (current) log('youtube-error', { code: data }); }
        }
      });
      minimalPlayer.current = player;
    }).catch(error => { if (current) log('api-failure', { message: String(error) }); });
    const pause = () => { if (document.hidden) { try { player?.pauseVideo(); } catch { /* QA cleanup. */ } } };
    document.addEventListener('visibilitychange', pause);
    return () => {
      current = false;
      document.removeEventListener('visibilitychange', pause);
      minimalPlayer.current = null;
      try { player?.pauseVideo(); } catch { /* Failed embed. */ }
      try { player?.destroy(); } catch { /* Failed embed. */ }
    };
  }, [variant, controller]);

  const close = () => {
    controller.close();
    try { minimalPlayer.current?.pauseVideo(); } catch { /* Failed comparison embed. */ }
    setOpen(false);
  };
  return (
    <main className="mobile-shell" aria-label="Preview-only YouTube comparison">
      <div style={{ padding: 16, overflow: 'auto', position: 'relative', zIndex: 3, background: '#111' }}>
        <h1 style={{ fontSize: 20 }}>Preview-only YouTube comparison</h1>
        <a href="/">Exit comparison</a>
        <p>Standard host is diagnostic only; the portfolio remains privacy-enhanced.</p>
        <label>Configuration <select aria-label="Comparison configuration" value={variant} onChange={event => { close(); setVariant(event.target.value as Variant); }}>
          <option value="application">Application prepared player</option>
          <option value="minimal-nocookie">Minimal privacy-enhanced embed</option>
          <option value="minimal-standard">Minimal standard embed</option>
        </select></label>
        <p><button className="secondary-button" onClick={() => {
          if (variant === 'application') controller.openFromGesture(() => flushSync(() => setOpen(true)));
          else { const player = minimalPlayer.current; if (player && minimalReady) { player.unMute(); player.setVolume(40); player.playVideo(); } }
        }} disabled={variant !== 'application' && !minimalReady}>Play comparison</button> <button className="secondary-button" onClick={close}>Close player</button></p>
        <output style={{ display: 'block', overflowWrap: 'anywhere', fontSize: 12 }}>{report}</output>
      </div>
      <div data-rickroll-body style={{ flex: 1, minHeight: 200 }} />
      {variant === 'application' ? <MobileRickroll controller={controller} hostRef={hostRef} active open={open} onHome={close} reducedMotion={false} /> : <div ref={minimalHost} style={{ width: '100%', minHeight: 240 }} />}
    </main>
  );
}
