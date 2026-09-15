import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { createPreparedVideo } from '../lib/preparedVideo';
import { logPhoneMediaTiming } from '../lib/phoneMediaDiagnostics';

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
  cueVideoById: (options: { videoId: string; startSeconds: number; endSeconds: number }) => void;
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
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    let settled = false;
    const finish = (api: YouTubeNamespace) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(api);
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      const failedScript = document.getElementById(PLAYER_SCRIPT_ID);
      failedScript?.setAttribute('data-load-failed', 'true');
      reject(new Error('The YouTube IFrame API did not load.'));
    };
    const timeout = window.setTimeout(fail, 12_000);
    const previousReadyHandler = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();
      if (window.YT?.Player) finish(window.YT);
      else fail();
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
    script.addEventListener('error', fail, { once: true });
  }).catch((error) => {
    youtubeApiPromise = null;
    throw error;
  });

  return youtubeApiPromise;
}

export type RickrollLaunch = { openFromGesture: () => void };

export function RickrollPlayer({ minimized, reducedMotion, onClose, playLabel = 'Fine. Click to continue.', idPrefix = '', prepareAtIdle = false, launchRef }: { minimized: boolean; reducedMotion: boolean; onClose: () => void; playLabel?: string; idPrefix?: string; prepareAtIdle?: boolean; launchRef?: Ref<RickrollLaunch> }) {
  const descriptionId = `${idPrefix ? `${idPrefix}-` : ''}rickroll-description`;
  const [phase, setPhase] = useState<PlayerPhase>(prepareAtIdle ? 'player' : 'loading');
  const [prepared] = useState(() => createPreparedVideo({ videoId: VIDEO_ID, startSeconds: START_SECONDS, endSeconds: END_SECONDS }));
  const [playerReady, setPlayerReady] = useState(false);
  const [showPlayFallback, setShowPlayFallback] = useState(false);
  const [showRickroll, setShowRickroll] = useState(false);
  const [needsResume, setNeedsResume] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('Opening important file…');
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
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
    prepared.detach();
    const player = playerRef.current;
    playerRef.current = null;
    if (!player) return;
    try {
      player.stopVideo();
      player.destroy();
    } catch {
      // The iframe may already have been removed after a network or embed failure.
    }
  }, [clearChecks, prepared]);

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
    const player = playerRef.current;
    if (!player) return;
    completedRef.current = false;
    setPhase('player');
    setShowRickroll(false);
    setShowPlayFallback(false);
    setNeedsResume(false);
    setStatus('Attempting playback.');
    player.setVolume(40);
    player.loadVideoById({ videoId: VIDEO_ID, startSeconds: START_SECONDS, endSeconds: END_SECONDS });
    player.playVideo();
    schedulePlayFallback();
  }, [schedulePlayFallback]);

  const retry = useCallback(() => {
    destroyPlayer();
    completedRef.current = false;
    setPlayerReady(false);
    setShowPlayFallback(false);
    setShowRickroll(false);
    setNeedsResume(false);
    setStatus('Opening important file…');
    setPhase('loading');
    setAttempt((current) => current + 1);
  }, [destroyPlayer]);

  useImperativeHandle(launchRef, () => ({
    openFromGesture() {
      // MobileShell reveals this same resident iframe synchronously before this call.
      minimizedRef.current = false;
      completedRef.current = false;
      if (phase === 'error') retry();
      else setPhase('player');
      setShowRickroll(false);
      setShowPlayFallback(false);
      setNeedsResume(false);
      setStatus('Opening important file…');
      prepared.openFromGesture();
      if (playerReady) schedulePlayFallback();
    }
  }), [phase, playerReady, prepared, retry, schedulePlayFallback]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      destroyPlayer();
    };
  }, [destroyPlayer]);

  useEffect(() => {
    minimizedRef.current = minimized;
    if (!minimized) return;
    if (prepareAtIdle) {
      prepared.close();
      clearChecks();
      setShowPlayFallback(false);
      setNeedsResume(false);
      if (completedRef.current) setPhase('player');
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    const wasPlaying = player.getPlayerState() === window.YT?.PlayerState.PLAYING;
    player.pauseVideo();
    if (wasPlaying) {
      setNeedsResume(true);
      setStatus('Playback paused while the window is minimized.');
    }
  }, [minimized, prepareAtIdle, prepared, clearChecks]);

  useEffect(() => {
    if (!prepareAtIdle) return;
    const pauseWhenHidden = () => {
      if (document.visibilityState !== 'hidden') return;
      const wasRequested = prepared.isRequested();
      prepared.close();
      clearChecks();
      if (wasRequested) setNeedsResume(true);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [prepareAtIdle, prepared, clearChecks]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const loadingTimer = window.setTimeout(() => setPhase('player'), 700);
    return () => window.clearTimeout(loadingTimer);
  }, [attempt, phase]);

  useEffect(() => {
    if (phase !== 'player' || playerRef.current || !playerHostRef.current) return;
    let cancelled = false;

    loadYouTubeApi().then((api) => {
      if (cancelled || !mountedRef.current || !playerHostRef.current) return;
      if (prepareAtIdle) readyCheckRef.current = window.setTimeout(() => {
        destroyPlayer();
        setPhase('error');
        setStatus('The YouTube player could not be loaded.');
        if (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
          console.warn('YouTube player readiness timed out (API/network failure).');
        }
      }, 12_000);
      const player = new api.Player(playerHostRef.current, {
        width: '100%',
        height: '100%',
        videoId: VIDEO_ID,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: prepareAtIdle ? 0 : 1,
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
            if (!mountedRef.current || (prepareAtIdle && playerRef.current !== target)) return;
            if (readyCheckRef.current !== null) window.clearTimeout(readyCheckRef.current);
            readyCheckRef.current = null;
            playerRef.current = target;
            target.setVolume(40);
            target.getIframe().title = 'Official Rick Astley YouTube video player';
            setPlayerReady(true);
            if (prepareAtIdle) {
              logPhoneMediaTiming('ready');
              prepared.attach(target);
              if (prepared.isRequested()) schedulePlayFallback();
              else setStatus('Important file ready.');
              return;
            }
            if (minimizedRef.current) {
              target.pauseVideo();
              setNeedsResume(true);
              setStatus('Ready and paused. Restore the window to continue.');
              return;
            }
            beginSegment();
          },
          onStateChange: ({ data }) => {
            if (!mountedRef.current) return;
            if (prepareAtIdle && !prepared.isRequested() && data !== api.PlayerState.PLAYING) return;
            if (data === api.PlayerState.PLAYING) {
              if (prepareAtIdle && (minimizedRef.current || document.hidden || !prepared.isRequested())) {
                prepared.close();
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
            if (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
              console.warn('YouTube embed error (not autoplay blocking):', data);
            }
            if (!mountedRef.current) return;
            destroyPlayer();
            setPhase('error');
            setStatus('The video could not be loaded.');
          },
          onAutoplayBlocked: () => {
            if (!mountedRef.current || minimizedRef.current) return;
            setShowPlayFallback(true);
            setStatus(prepareAtIdle ? 'Tap to open file.' : 'Autoplay was blocked. Playback needs one more click.');
          }
        }
      });
      playerRef.current = player;
    }).catch((error) => {
      if (import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        console.warn('YouTube IFrame API/network loading failed:', error);
      }
      if (!cancelled && mountedRef.current) {
        setPhase('error');
        setStatus('The YouTube player could not be loaded.');
      }
    });

    return () => { cancelled = true; };
  }, [attempt, beginSegment, completeSegment, destroyPlayer, phase, startProgressChecks, prepareAtIdle, prepared, schedulePlayFallback]);

  const playFromFallback = () => {
    const player = playerRef.current;
    if (!player) return;
    setShowPlayFallback(false);
    setNeedsResume(false);
    setStatus('Attempting playback.');
    if (prepareAtIdle) {
      prepared.openFromGesture();
      schedulePlayFallback();
      return;
    }
    // Keep these calls synchronous with the visitor's tap for iPhone/Safari.
    player.unMute();
    player.setVolume(40);
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
          {!playerReady && <div className="player-connecting"><span className="quicktime-spinner" aria-hidden="true" /><span>Connecting to YouTube…</span></div>}
          {showRickroll && !prepareAtIdle && phase !== 'ended' && <div className="rickroll-toast">Yep, you’ve been rickrolled, LOL.</div>}
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
