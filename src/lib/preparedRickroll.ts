import type { YouTubeEvents, YouTubeNamespace, YouTubePlayer } from './youtubePlayer';

export type PreparedPhase = 'idle' | 'api-loading' | 'player-creating' | 'cueing' | 'ready' | 'requested' | 'playing' | 'blocked' | 'ended' | 'error';
export type PreparedSnapshot = { phase: PreparedPhase; ready: boolean; needsGesture: boolean; error: string | null; generation: number };
type Options = {
  loadApi: () => Promise<YouTubeNamespace>;
  createPlayer: (api: YouTubeNamespace, events: YouTubeEvents) => YouTubePlayer;
  segment: { videoId: string; startSeconds: number; endSeconds: number };
  log: (event: string, details?: Record<string, string | number | boolean>) => void;
};

/** Phone lifecycle, independent of React and app-screen mounts. No readiness deadline. */
export function createPreparedRickroll({ loadApi, createPlayer, segment, log }: Options) {
  let snapshot: PreparedSnapshot = { phase: 'idle', ready: false, needsGesture: false, error: null, generation: 0 };
  const listeners = new Set<() => void>();
  let player: YouTubePlayer | null = null;
  let active = false, opened = false, visible = true, apiReady = false, cuePending = false, pendingPlay = false;
  let generation = 0;
  let fallback: ReturnType<typeof setTimeout> | undefined;
  let progress: ReturnType<typeof setInterval> | undefined;
  const update = (next: Partial<PreparedSnapshot>) => {
    snapshot = { ...snapshot, ...next, generation };
    listeners.forEach(listener => listener());
  };
  const clearMonitoring = () => { clearTimeout(fallback); clearInterval(progress); fallback = undefined; progress = undefined; };
  const releasePlayer = () => {
    // Invalidate before any stop/destroy operation can synchronously emit an event.
    generation++;
    clearMonitoring();
    const previous = player;
    player = null;
    apiReady = false;
    cuePending = false;
    try { previous?.stopVideo(); } catch { /* Failed players may reject stop. */ }
    try { previous?.destroy(); } catch { /* Always attempt destruction. */ }
  };
  const fail = (reason: string, code?: number) => {
    log(code === undefined ? 'api-or-constructor-failure' : 'youtube-error', { reason, ...(code === undefined ? {} : { code }), generation });
    pendingPlay = false;
    releasePlayer();
    update({ phase: 'error', ready: false, needsGesture: false, error: reason });
  };
  const block = () => {
    if (!active || !opened || !visible || !pendingPlay || !apiReady) return;
    clearMonitoring();
    pendingPlay = false;
    log('autoplay-blocked', { generation });
    update({ phase: 'blocked', needsGesture: true });
  };
  const cue = () => {
    if (!player || !apiReady) return;
    clearMonitoring();
    cuePending = true;
    update({ phase: 'cueing', ready: false });
    player.mute();
    player.cueVideoById(segment);
    log('cue-request', { generation });
  };
  const complete = () => {
    if (!active || !opened || snapshot.phase === 'ended') return;
    pendingPlay = false;
    clearMonitoring();
    player?.pauseVideo();
    // Prepare replay before the next tap, retaining the same instance.
    cue();
    update({ phase: 'ended', needsGesture: false });
    log('segment-ended', { generation });
  };
  const play = (reason: string) => {
    if (!active || !opened || !visible || !snapshot.ready || !player) return;
    clearMonitoring();
    pendingPlay = true;
    update({ phase: 'requested', needsGesture: false });
    // Deliberately synchronous. Do not load/cue/create/wait in the gesture path.
    try {
      player.unMute();
      player.setVolume(40);
      log('playVideo', { reason, generation });
      player.playVideo();
    } catch (error) { fail(error instanceof Error ? error.message : 'Playback command failed'); return; }
    fallback = setTimeout(() => {
      const state = player?.getPlayerState();
      // BUFFERING is not an autoplay-policy failure.
      if (state === -1 || state === 2 || state === 5) block();
    }, 1_800);
  };
  const prepare = () => {
    if (active && snapshot.phase !== 'idle') return;
    active = true;
    const attempt = ++generation;
    update({ phase: 'api-loading', error: null, ready: false });
    const current = (target?: YouTubePlayer) => active && generation === attempt && (!target || target === player);
    void loadApi().then(api => {
      if (!current()) return;
      update({ phase: 'player-creating' });
      log('player-constructor', { generation });
      const created = createPlayer(api, {
        onReady: ({ target }) => {
          if (!current(target)) return;
          apiReady = true;
          log('onReady', { generation });
          try { cue(); } catch (error) { fail(error instanceof Error ? error.message : 'Cue failed'); }
        },
        onStateChange: ({ target, data }) => {
          if (!current(target)) return;
          if (data === 5 && cuePending && apiReady) {
            cuePending = false;
            const ended = snapshot.phase === 'ended';
            update({ ready: true, phase: ended ? 'ended' : 'ready' });
            log('cue-complete', { generation });
            log('rickroll-ready', { generation });
            if (opened && visible && pendingPlay) play('pending-early-tap');
          } else if (data === 1) {
            if (!opened || !visible || !pendingPlay) {
              target.pauseVideo();
              target.mute();
              return;
            }
            clearMonitoring();
            update({ phase: 'playing', needsGesture: false });
            log('PLAYING', { generation });
            progress = setInterval(() => {
              if (current(target) && target.getCurrentTime() >= segment.endSeconds - 0.15) complete();
            }, 200);
          } else if (data === 0 && snapshot.phase === 'playing') complete();
        },
        onAutoplayBlocked: () => { if (current()) block(); },
        onError: ({ data, target }) => { if (current(target)) fail(`YouTube error ${data}`, data); }
      });
      if (current()) player = created;
      else { try { created.destroy(); } catch { /* Disposed while creating. */ } }
    }).catch(error => { if (current()) fail(error instanceof Error ? error.message : 'YouTube API failed'); });
  };
  const pauseAndPrepare = (reason: string) => {
    pendingPlay = false;
    clearMonitoring();
    log(reason, { generation });
    if (!apiReady || !player) return;
    try { player.pauseVideo(); cue(); }
    catch (error) { fail(error instanceof Error ? error.message : 'Pause/cue failed'); }
  };

  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    prepare,
    openFromGesture(reveal: () => void) {
      log('app-tap', { ready: snapshot.ready, generation });
      reveal();
      opened = true;
      pendingPlay = true;
      if (snapshot.ready) play('app-tap');
      else if (snapshot.phase !== 'error') update({ needsGesture: false });
    },
    playFromGesture() { pendingPlay = true; play('user-tap'); },
    close() {
      opened = false;
      update({ needsGesture: false });
      pauseAndPrepare('home-close');
    },
    setVisible(next: boolean) {
      visible = next;
      if (!next) {
        update({ needsGesture: opened });
        pauseAndPrepare('background-pause');
      }
    },
    retry() {
      log('retry', { generation });
      pendingPlay = opened && visible;
      releasePlayer();
      update({ phase: 'idle', ready: false, error: null, needsGesture: false });
      prepare();
    },
    complete,
    dispose() {
      active = false;
      opened = false;
      pendingPlay = false;
      releasePlayer();
      update({ phase: 'idle', ready: false, error: null, needsGesture: false });
      log('player-disposed', { generation });
    }
  };
}
export type PreparedRickroll = ReturnType<typeof createPreparedRickroll>;
