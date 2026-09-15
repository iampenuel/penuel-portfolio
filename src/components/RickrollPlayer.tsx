import { useCallback, useEffect, useRef, useState } from 'react';
import { createVideoLifetime } from '../lib/videoLifetime';
import { logMediaDiagnostic } from '../lib/phoneMediaDiagnostics';

const VIDEO_ID = 'dQw4w9WgXcQ';
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const START_SECONDS = 42;
const END_SECONDS = 60;
const REVEAL_AFTER_SECONDS = 7;
const PLAYER_SCRIPT_ID = 'youtube-iframe-api';

type PlayerPhase = 'loading' | 'player' | 'ended' | 'error';

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getIframe: () => HTMLIFrameElement;
  getPlayerState: () => number;
  loadVideoById: (options: { videoId: string; startSeconds: number; endSeconds: number }) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
  stopVideo: () => void;
};

type YouTubeEvent = { target: YouTubePlayer; data: number };

type YouTubeNamespace = {
  Player: new (element: HTMLElement, options: {
    width: string;
    height: string;
    videoId: string;
    host: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady: (event: YouTubeEvent) => void;
      onStateChange: (event: YouTubeEvent) => void;
      onError: (event: YouTubeEvent) => void;
      onAutoplayBlocked: () => void;
    };
  }) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi() {
  if (window.YT?.Player) {
    logMediaDiagnostic('api', 'api-cached');
    return Promise.resolve(window.YT);
  }
  if (youtubeApiPromise) return youtubeApiPromise;

  logMediaDiagnostic('api', 'api-load-start');
  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    let settled = false;
    const finish = (api: YouTubeNamespace) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      logMediaDiagnostic('api', 'api-loaded');
      resolve(api);
    };
    const fail = (reason: 'network-error' | 'api-timeout' | 'missing-api') => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      const failedScript = document.getElementById(PLAYER_SCRIPT_ID);
      failedScript?.setAttribute('data-load-failed', 'true');
      logMediaDiagnostic('api', reason);
      reject(new Error('The YouTube IFrame API did not load.'));
    };
    const timeout = window.setTimeout(() => fail('api-timeout'), 12_000);
    const previousReadyHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();
      if (window.YT?.Player) finish(window.YT);
      else fail('missing-api');
    };

    let script = document.getElementById(PLAYER_SCRIPT_ID) as HTMLScriptElement | null;
    if (script?.dataset.loadFailed === 'true') {
      script.remove();
      script = null;
    }
    if (!script) {
      script = document.createElement('script');
      script.id = PLAYER_SCRIPT_ID;
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('error', () => fail('network-error'), { once: true });
  }).catch((error) => {
    youtubeApiPromise = null;
    throw error;
  });

  return youtubeApiPromise;
}

export function RickrollPlayer({ minimized, reducedMotion, onClose, playLabel = 'Fine. Click to continue.', idPrefix = '', mobile = false }: { minimized: boolean; reducedMotion: boolean; onClose: () => void; playLabel?: string; idPrefix?: string; mobile?: boolean }) {
  const descriptionId = `${idPrefix ? `${idPrefix}-` : ''}rickroll-description`;
  const scope = mobile ? 'mobile' : 'desktop';
  const [phase, setPhase] = useState<PlayerPhase>('loading');
  const [playerReady, setPlayerReady] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const [showPlayFallback, setShowPlayFallback] = useState(false);
  const [showRickroll, setShowRickroll] = useState(false);
  const [needsResume, setNeedsResume] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Opening important file…');
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const lifetimeRef = useRef<ReturnType<typeof createVideoLifetime<YouTubePlayer>> | null>(null);
  const mountedRef = useRef(true);
  const minimizedRef = useRef(minimized);
  const playCheckRef = useRef<number | null>(null);
  const progressCheckRef = useRef<number | null>(null);
  const readyCheckRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const clearChecks = useCallback(() => {
    if (playCheckRef.current !== null) window.clearTimeout(playCheckRef.current);
    if (progressCheckRef.current !== null) window.clearInterval(progressCheckRef.current);
    playCheckRef.current = null;
    progressCheckRef.current = null;
  }, []);

  const destroyPlayer = useCallback(() => {
    clearChecks();
    if (readyCheckRef.current !== null) window.clearTimeout(readyCheckRef.current);
    readyCheckRef.current = null;
    const lifetime = lifetimeRef.current;
    lifetimeRef.current = null;
    playerRef.current = null;
    if (!lifetime) return;
    lifetime.dispose();
    logMediaDiagnostic(scope, 'player-destroyed-detached');
  }, [clearChecks, scope]);

  const completeSegment = useCallback(() => {
    if (completedRef.current || !mountedRef.current) return;
    completedRef.current = true;
    clearChecks();
    try { playerRef.current?.pauseVideo(); } catch { /* The end state is still safe without an active player. */ }
    setShowPlayFallback(false);
    setNeedsResume(false);
    setShowRickroll(true);
    setPhase('ended');
    setStatus('The segment has ended at the one-minute mark.');
  }, [clearChecks]);

  const startProgressChecks = useCallback(() => {
    if (progressCheckRef.current !== null) return;
    progressCheckRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || player.getPlayerState() !== window.YT?.PlayerState.PLAYING) return;
      const currentTime = player.getCurrentTime();
      if (currentTime >= START_SECONDS + REVEAL_AFTER_SECONDS) setShowRickroll(true);
      if (currentTime >= END_SECONDS - 0.15) completeSegment();
    }, 200);
  }, [completeSegment]);

  const schedulePlayFallback = useCallback(() => {
    if (playCheckRef.current !== null) window.clearTimeout(playCheckRef.current);
    playCheckRef.current = window.setTimeout(() => {
      if (!mountedRef.current || minimizedRef.current || playerRef.current?.getPlayerState() === window.YT?.PlayerState.PLAYING) return;
      setShowPlayFallback(true);
      setStatus('Playback needs one more click.');
    }, 1_800);
  }, []);

  const beginSegment = useCallback(() => {
    const player = lifetimeRef.current?.readyPlayer();
    if (!player) return;
    completedRef.current = false;
    setPhase('player');
    setShowRickroll(false);
    setShowPlayFallback(false);
    setNeedsResume(false);
    setStatus('Attempting playback.');
    player.setVolume(40);
    player.loadVideoById({ videoId: VIDEO_ID, startSeconds: START_SECONDS, endSeconds: END_SECONDS });
    logMediaDiagnostic(scope, 'playVideo', { reason: 'ready-or-replay' });
    player.playVideo();
    schedulePlayFallback();
  }, [schedulePlayFallback, scope]);

  const retry = useCallback(() => {
    logMediaDiagnostic(scope, 'visible-retry');
    destroyPlayer();
    completedRef.current = false;
    setPlayerReady(false);
    setSlowConnection(false);
    setShowPlayFallback(false);
    setShowRickroll(false);
    setNeedsResume(false);
    setStatus('Opening important file…');
    setPhase('loading');
    setAttempt((current) => current + 1);
  }, [destroyPlayer, scope]);

  useEffect(() => {
    mountedRef.current = true;
    logMediaDiagnostic(scope, 'visible-app-mounted');
    return () => {
      mountedRef.current = false;
      logMediaDiagnostic(scope, 'app-unmounted');
      destroyPlayer();
    };
  }, [destroyPlayer, scope]);

  useEffect(() => {
    minimizedRef.current = minimized;
    if (!minimized) return;
    const player = lifetimeRef.current?.readyPlayer();
    if (!player) return;
    const wasPlaying = player.getPlayerState() === window.YT?.PlayerState.PLAYING;
    player.pauseVideo();
    logMediaDiagnostic(scope, 'minimized-pause');
    if (wasPlaying) {
      setNeedsResume(true);
      setStatus('Playback paused while the window is minimized.');
    }
  }, [minimized, scope]);

  useEffect(() => {
    if (!mobile) return;
    const pauseWhenHidden = () => {
      if (document.visibilityState !== 'hidden') return;
      const player = lifetimeRef.current?.readyPlayer();
      lifetimeRef.current?.pause();
      clearChecks();
      logMediaDiagnostic(scope, 'visibility-pause', { ready: Boolean(player) });
      if (player && !completedRef.current) {
        setNeedsResume(true);
        setStatus('Playback paused while the app is hidden.');
      }
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [mobile, clearChecks, scope]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const loadingTimer = window.setTimeout(() => setPhase('player'), 700);
    return () => window.clearTimeout(loadingTimer);
  }, [attempt, phase]);

  useEffect(() => {
    if (phase !== 'player' || playerRef.current || !playerHostRef.current) return;
    let cancelled = false;
    const lifetime = createVideoLifetime<YouTubePlayer>();
    lifetimeRef.current = lifetime;
    const isCurrent = () => mountedRef.current && lifetimeRef.current === lifetime && lifetime.isCurrent();

    loadYouTubeApi().then((api) => {
      if (cancelled || !isCurrent() || !playerHostRef.current) return;
      // Visible mobile loading remains recoverable. A delayed onReady is not a
      // YouTube error; keep this instance alive and offer an explicit fresh retry.
      if (mobile) readyCheckRef.current = window.setTimeout(() => {
        if (!isCurrent() || lifetime.readyPlayer()) return;
        logMediaDiagnostic(scope, 'readiness-slow', { attempt });
        setSlowConnection(true);
        setStatus('Still connecting to YouTube. You can retry.');
      }, 12_000);
      logMediaDiagnostic(scope, 'player-constructor', { attempt, minimized: minimizedRef.current });
      const player = new api.Player(playerHostRef.current, {
        width: '100%',
        height: '100%',
        videoId: VIDEO_ID,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          end: END_SECONDS,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
          start: START_SECONDS
        },
        events: {
          onReady: ({ target }) => {
            if (!isCurrent() || !lifetime.markReady(target)) return;
            logMediaDiagnostic(scope, 'onReady', { attempt });
            if (readyCheckRef.current !== null) window.clearTimeout(readyCheckRef.current);
            readyCheckRef.current = null;
            playerRef.current = target;
            target.setVolume(40);
            target.getIframe().title = 'Official Rick Astley YouTube video player';
            setPlayerReady(true);
            setSlowConnection(false);
            if (minimizedRef.current || (mobile && document.hidden)) {
              target.pauseVideo();
              setNeedsResume(true);
              setStatus('Ready and paused. Restore the window to continue.');
              return;
            }
            beginSegment();
          },
          onStateChange: ({ data, target }) => {
            if (!isCurrent() || !lifetime.isCurrent(target)) return;
            if (data === api.PlayerState.PLAYING) {
              logMediaDiagnostic(scope, 'PLAYING', { attempt });
              if (minimizedRef.current || (mobile && document.hidden)) {
                lifetime.pause();
                setNeedsResume(true);
                return;
              }
              if (playCheckRef.current !== null) window.clearTimeout(playCheckRef.current);
              playCheckRef.current = null;
              setShowPlayFallback(false);
              setNeedsResume(false);
              setStatus('Video playing at 40 percent volume.');
              startProgressChecks();
            }
            if (data === api.PlayerState.ENDED) completeSegment();
          },
          onError: ({ data }) => {
            if (!isCurrent()) return;
            logMediaDiagnostic(scope, 'youtube-error', { code: data, attempt });
            destroyPlayer();
            setPhase('error');
            setStatus('The video could not be loaded.');
          },
          onAutoplayBlocked: () => {
            if (!isCurrent() || minimizedRef.current || (mobile && document.hidden)) return;
            logMediaDiagnostic(scope, 'autoplay-blocked', { attempt });
            setShowPlayFallback(true);
            setStatus(mobile ? 'Tap to open file.' : 'Autoplay was blocked. Playback needs one more click.');
          }
        }
      });
      lifetime.attach(player);
      if (isCurrent()) playerRef.current = player;
    }).catch((error) => {
      if (!cancelled && isCurrent()) {
        logMediaDiagnostic(scope, 'api-or-constructor-failure', { reason: error instanceof Error ? error.message : 'unknown' });
        destroyPlayer();
        setPhase('error');
        setStatus('The YouTube player could not be loaded.');
      }
    });

    return () => { cancelled = true; };
  }, [attempt, beginSegment, completeSegment, destroyPlayer, phase, startProgressChecks, mobile, scope]);

  const playFromFallback = () => {
    const player = lifetimeRef.current?.readyPlayer();
    if (!player) return;
    setShowPlayFallback(false);
    setNeedsResume(false);
    setStatus('Attempting playback.');
    // Keep these calls synchronous with the visitor's tap for iPhone/Safari.
    player.unMute();
    player.setVolume(40);
    logMediaDiagnostic(scope, 'playVideo', { reason: 'user-tap' });
    player.playVideo();
    schedulePlayFallback();
  };

  const replay = () => {
    if (!playerRef.current) {
      retry();
      return;
    }
    beginSegment();
  };

  return (
    <div className={`quicktime-player ${reducedMotion ? 'reduced-motion' : ''}`} aria-describedby={descriptionId}>
      <p id={descriptionId} className="sr-only">This QuickTime-style window contains an embedded official YouTube video with playback controls.</p>
      <span className="sr-only" aria-live="polite">{status}</span>

      {phase === 'loading' && (
        <div className="quicktime-loading" role="status">
          <span className="quicktime-spinner" aria-hidden="true" />
          <strong>Opening important file…</strong>
        </div>
      )}

      {(phase === 'player' || phase === 'ended') && (
        <div className="quicktime-stage">
          <div className="youtube-player-host" ref={playerHostRef} />
          {!playerReady && <div className="player-connecting"><span className="quicktime-spinner" aria-hidden="true" /><span>{slowConnection ? 'Still connecting…' : 'Connecting to YouTube…'}</span>{slowConnection && <button className="secondary-button compact" type="button" onClick={retry}>Try again</button>}</div>}
          {showRickroll && !mobile && phase !== 'ended' && <div className="rickroll-toast">Yep, you’ve been rickrolled, LOL.</div>}
          {(showPlayFallback || needsResume) && phase !== 'ended' && (
            <button className="player-action-overlay" type="button" onClick={playFromFallback}>
              {needsResume ? 'Resume' : playLabel}
            </button>
          )}
          {phase === 'ended' && (
            <div className="rickroll-end-card">
              <strong>Yep. you just got rickrolled :)</strong>
              <div>
                <button className="primary-button compact" type="button" onClick={replay}>Replay</button>
                <button className="secondary-button compact" type="button" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'error' && (
        <div className="quicktime-error" role="alert">
          <span className="eyebrow">PLAYER UNAVAILABLE</span>
          <h2>Well, this is awkward.</h2>
          <p>The video escaped, but you still got rickrolled.</p>
          <div className="quicktime-error-actions">
            <button className="primary-button compact" type="button" onClick={retry}>Try again</button>
            <a className="secondary-button compact" href={VIDEO_URL} target="_blank" rel="noopener noreferrer">Open the original</a>
            <button className="secondary-button compact" type="button" onClick={() => completeSegment()}>I’ll pretend this worked</button>
          </div>
        </div>
      )}
    </div>
  );
}
