type DisposablePlayer = {
  pauseVideo: () => void;
  stopVideo: () => void;
  destroy: () => void;
};

/** One visible player attempt. Late callbacks cannot revive a closed/retried player. */
export function createVideoLifetime<Player extends DisposablePlayer>() {
  let player: Player | null = null;
  let ready = false;
  let disposed = false;
  const destroy = (target: Player) => {
    // A pre-ready/failed API can throw on stop; destruction must still happen.
    try { target.stopVideo(); } catch { /* Best-effort stop. */ }
    try { target.destroy(); } catch { /* The iframe may already be gone. */ }
  };
  return {
    attach(target: Player) {
      if (disposed) { destroy(target); return; }
      player = target;
    },
    markReady(target: Player) {
      if (disposed || (player && player !== target)) return false;
      player = target;
      ready = true;
      return true;
    },
    isCurrent(target?: Player) {
      return !disposed && (!target || player === target);
    },
    readyPlayer() { return !disposed && ready ? player : null; },
    pause() {
      if (!disposed && ready && player) {
        try { player.pauseVideo(); } catch { /* Cleanup must remain safe after network failure. */ }
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ready = false;
      const previous = player;
      player = null;
      if (previous) destroy(previous);
    }
  };
}
