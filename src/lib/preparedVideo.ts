type CuedPlayer = {
  cueVideoById: (segment: { videoId: string; startSeconds: number; endSeconds: number }) => void;
  pauseVideo: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  playVideo: () => void;
};

/** Cue silently at idle; keep the actual play call in the app-icon click stack. */
export function createPreparedVideo(segment: { videoId: string; startSeconds: number; endSeconds: number }) {
  let player: CuedPlayer | null = null;
  let requested = false;
  const play = () => {
    if (!player || !requested) return;
    player.unMute();
    player.setVolume(40);
    player.playVideo();
  };
  return {
    attach(next: CuedPlayer) {
      player = next;
      player.cueVideoById(segment);
      // An early tap may precede readiness. The UI retains its gesture fallback.
      play();
    },
    openFromGesture() {
      requested = true;
      play();
    },
    close() {
      requested = false;
      if (!player) return;
      player.pauseVideo();
      player.cueVideoById(segment);
    },
    detach() { player = null; },
    isRequested() { return requested; }
  };
}
