import type { NowPlayingSnapshot } from '../lib/nowPlaying';

/**
 * Single replaceable development source. This fictional selection is never presented as live.
 * A later secure public-JSON adapter can supply the same snapshot with isSample: false.
 * No fetch, account connection, cookies, scraping, or audio playback belongs in this source.
 */
export const nowPlayingSnapshot: NowPlayingSnapshot = {
  isSample: true,
  data: {
    title: 'Quiet Hours',
    artist: 'Sample artist',
    artwork: '/assets/mobile/now-playing-sample.svg',
    url: null,
    source: 'YouTube Music',
    updatedAt: null,
    status: 'recently-played'
  }
};
