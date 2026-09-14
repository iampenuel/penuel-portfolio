import { useCallback, useEffect, useRef, useState } from 'react';

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
      onError: () => void;
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

export function RickrollPlayer({ minimized, reducedMotion, onClose, playLabel = 'Fine. Click to continue.', idPrefix = '' }: { minimized: boolean; reducedMotion: boolean; onClose: () => void; playLabel?: string; idPrefix?: string }) {
  const descriptionId = `${idPrefix ? `${idPrefix}-` : ''}rickroll-description`;
  const [phase, setPhase] = useState<PlayerPhase>('loading');
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
  const completedRef = useRef(false);

  const clearChecks = useCallback(() => {
    if (playCheckRef.current !== null) window.clearTimeout(playCheckRef.current);
    if (progressCheckRef.current !== null) window.clearInterval(progressCheckRef.current);
    playCheckRef.current = null;
    progressCheckRef.current = null;
  }, []);

  const destroyPlayer = useCallback(() => {
    clearChecks();
    const player = playerRef.current;
    playerRef.current = null;
    if (!player) return;
    try {
      player.stopVideo();
      player.destroy();
    } catch {
      // The iframe may already have been removed after a network or embed failure.
    }
  }, [clearChecks]);

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
      if (!mountedRef.current || playerRef.current?.getPlayerState() === window.YT?.PlayerState.PLAYING) return;
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
    const player = playerRef.current;
    if (!player) return;
    const wasPlaying = player.getPlayerState() === window.YT?.PlayerState.PLAYING;
    player.pauseVideo();
    if (wasPlaying) {
      setNeedsResume(true);
      setStatus('Playback paused while the window is minimized.');
    }
  }, [minimized]);

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
            if (!mountedRef.current) return;
            playerRef.current = target;
            target.setVolume(40);
            target.getIframe().title = 'Official Rick Astley YouTube video player';
            setPlayerReady(true);
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
            if (data === api.PlayerState.PLAYING) {
              if (playCheckRef.current !== null) window.clearTimeout(playCheckRef.current);
              playCheckRef.current = null;
              setShowPlayFallback(false);
              setNeedsResume(false);
              setStatus('Video playing at 40 percent volume.');
              startProgressChecks();
            }
            if (data === api.PlayerState.ENDED) completeSegment();
          },
          onError: () => {
            if (!mountedRef.current) return;
            destroyPlayer();
            setPhase('error');
            setStatus('The video could not be loaded.');
          },
          onAutoplayBlocked: () => {
            if (!mountedRef.current) return;
            setShowPlayFallback(true);
            setStatus('Autoplay was blocked. Playback needs one more click.');
          }
        }
      });
      playerRef.current = player;
    }).catch(() => {
      if (!cancelled && mountedRef.current) {
        setPhase('error');
        setStatus('The YouTube player could not be loaded.');
      }
    });

    return () => { cancelled = true; };
  }, [attempt, beginSegment, completeSegment, destroyPlayer, phase, startProgressChecks]);

  const playFromFallback = () => {
    const player = playerRef.current;
    if (!player) return;
    setShowPlayFallback(false);
    setNeedsResume(false);
    setStatus('Attempting playback.');
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
          {showRickroll && phase !== 'ended' && <div className="rickroll-toast">Yep, you’ve been rickrolled, LOL.</div>}
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
