import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPreparedRickroll, type PreparedRickroll } from '../../lib/preparedRickroll';
import { logMediaDiagnostic, observePhoneMediaTimings } from '../../lib/phoneMediaDiagnostics';
import { loadYouTubeApi, RICKROLL_SEGMENT, RICKROLL_URL } from '../../lib/youtubePlayer';
import '../../styles/mobile-rickroll.css';

export function usePhoneRickroll() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [controller] = useState(() => createPreparedRickroll({
    segment: RICKROLL_SEGMENT,
    loadApi: loadYouTubeApi,
    log: (event, details) => logMediaDiagnostic('mobile', event, details),
    createPlayer(api, events) {
      const host = hostRef.current;
      if (!host) throw new Error('Phone player host is not mounted');
      const playerVars = {
        autoplay: 0, controls: 1, enablejsapi: 1, playsinline: 1, rel: 0,
        origin: window.location.origin, start: RICKROLL_SEGMENT.startSeconds, end: RICKROLL_SEGMENT.endSeconds
      };
      // Attributes must exist before the iframe navigates, including Referer policy.
      const iframe = document.createElement('iframe');
      iframe.title = 'Official Rick Astley YouTube video player';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.tabIndex = host.closest('[data-open="true"]') ? 0 : -1;
      iframe.src = `https://www.youtube-nocookie.com/embed/${RICKROLL_SEGMENT.videoId}?${new URLSearchParams(Object.entries(playerVars).map(([key, value]) => [key, String(value)]))}`;
      host.replaceChildren(iframe);
      const rect = iframe.getBoundingClientRect();
      logMediaDiagnostic('mobile', 'iframe-mounted', { width: rect.width, height: rect.height, host: 'youtube-nocookie.com', referrerPolicy: iframe.referrerPolicy });
      return new api.Player(iframe, {
        width: '100%', height: '100%', videoId: RICKROLL_SEGMENT.videoId,
        host: 'https://www.youtube-nocookie.com', playerVars, events
      });
    }
  }));
  return { controller, hostRef };
}

export function MobileRickroll({ controller, hostRef, active, open, onHome, reducedMotion }: {
  controller: PreparedRickroll;
  hostRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
  open: boolean;
  onHome: () => void;
  reducedMotion: boolean;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [slow, setSlow] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const stopTimings = observePhoneMediaTimings();
    logMediaDiagnostic('mobile', 'home-interactive');
    controller.setVisible(!document.hidden);
    controller.prepare();
    const visibility = () => controller.setVisible(!document.hidden);
    const pageHide = () => controller.setVisible(false);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pageHide);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pageHide);
      stopTimings();
      controller.dispose();
    };
  }, [active, controller]);

  useLayoutEffect(() => {
    const iframe = hostRef.current?.querySelector('iframe');
    if (iframe) iframe.tabIndex = open ? 0 : -1;
  }, [open, state.phase, hostRef]);

  useEffect(() => {
    setSlow(false);
    if (!active || state.ready || state.phase === 'error') return;
    const timer = window.setTimeout(() => {
      logMediaDiagnostic('mobile', 'still-preparing', { generation: state.generation });
      setSlow(true);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [active, state.ready, state.generation, state.phase]);

  // Match the existing app body without inserting wrappers into approved Home UI.
  useLayoutEffect(() => {
    if (!open) return;
    const layer = layerRef.current;
    const body = layer?.parentElement?.querySelector<HTMLElement>('[data-rickroll-body]');
    if (!layer || !body) return;
    const measure = () => {
      const parent = layer.offsetParent?.getBoundingClientRect();
      const rect = body.getBoundingClientRect();
      if (parent) {
        layer.style.top = `${rect.top - parent.top}px`;
        layer.style.height = `${rect.height}px`;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [open]);

  const showPlayer = state.phase !== 'error';
  return (
    <div ref={layerRef} className={`mobile-rickroll-layer${reducedMotion ? ' reduced-motion' : ''}`} data-open={open && active} data-rickroll-state={state.phase} data-ready={state.ready} aria-hidden={!open || !active}>
      <div className="mobile-rickroll-composition">
        {/* This is the only persistent media host. UI and iframe are never reparented. */}
        <div className="quicktime-stage mobile-rickroll-stage" data-present={showPlayer}>
          <div className="youtube-player-host" ref={hostRef} />
        </div>
        {open && active && (
          <div className="mobile-rickroll-status" aria-live="polite">
            {!state.ready && state.phase !== 'error' && state.phase !== 'ended' && (
              <div className="mobile-rickroll-opening"><span className="quicktime-spinner" aria-hidden="true" /><span>{slow ? 'Still connecting…' : 'Opening definitely-important.mov…'}</span>
                {slow && <button className="secondary-button compact" onClick={() => controller.retry()}>Try again</button>}
              </div>
            )}
            {state.needsGesture && state.ready && state.phase !== 'ended' && <button className="secondary-button" onClick={() => controller.playFromGesture()}>Tap to open file</button>}
            {state.phase === 'ended' && <div className="mobile-rickroll-end"><strong>Yep. you just got rickrolled :)</strong><div>
              <button className="primary-button compact" onClick={() => controller.playFromGesture()}>Replay</button>
              <button className="secondary-button compact" onClick={onHome}>Close</button>
            </div></div>}
            {state.phase === 'error' && <div className="quicktime-error" role="alert">
              <span className="eyebrow">PLAYER UNAVAILABLE</span><h2>Well, this is awkward.</h2>
              <p>The video escaped, but you still got rickrolled.</p>
              <div className="quicktime-error-actions">
                <button className="primary-button compact" onClick={() => controller.retry()}>Try again</button>
                <a className="secondary-button compact" href={RICKROLL_URL} target="_blank" rel="noopener noreferrer">Open the original</a>
                <button className="secondary-button compact" onClick={onHome}>I’ll pretend this worked</button>
              </div>
            </div>}
          </div>
        )}
      </div>
    </div>
  );
}
