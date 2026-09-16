import { logMediaDiagnostic } from './phoneMediaDiagnostics';

export const RICKROLL_SEGMENT = { videoId: 'dQw4w9WgXcQ', startSeconds: 42, endSeconds: 60 };
export const RICKROLL_URL = `https://www.youtube.com/watch?v=${RICKROLL_SEGMENT.videoId}`;

export type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getIframe: () => HTMLIFrameElement;
  getPlayerState: () => number;
  loadVideoById: (options: typeof RICKROLL_SEGMENT) => void;
  cueVideoById: (options: typeof RICKROLL_SEGMENT) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  stopVideo: () => void;
};
export type YouTubeEvent = { target: YouTubePlayer; data: number };
export type YouTubeEvents = {
  onReady: (event: YouTubeEvent) => void;
  onStateChange: (event: YouTubeEvent) => void;
  onError: (event: YouTubeEvent) => void;
  onAutoplayBlocked: () => void;
};
export type YouTubeNamespace = {
  Player: new (element: HTMLElement, options: {
    width: string;
    height: string;
    videoId: string;
    host: string;
    playerVars: Record<string, string | number>;
    events: YouTubeEvents;
  }) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
};
declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYER_SCRIPT_ID = 'youtube-iframe-api';
let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

/** Shared script only; desktop and phone still own separate player lifetimes. */
export function loadYouTubeApi() {
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
      document.getElementById(PLAYER_SCRIPT_ID)?.setAttribute('data-load-failed', 'true');
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
