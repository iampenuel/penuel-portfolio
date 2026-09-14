export type NowPlayingStatus = 'now-playing' | 'recently-played' | 'unavailable';

/** Public, read-only data contract. Never put account credentials in this payload. */
export type NowPlayingData = Readonly<{
  title: string;
  artist: string;
  artwork: string | null;
  url: string | null;
  source: string;
  updatedAt: string | null;
  status: NowPlayingStatus;
}>;

export type NowPlayingSnapshot = Readonly<{
  data: NowPlayingData | null;
  isSample: boolean;
}>;

export function safeMusicUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function safeArtworkUrl(value: string | null): string | null {
  if (value?.startsWith('/assets/') && !value.includes('\\')) return value;
  return safeMusicUrl(value);
}

/** Presentation policy lives outside the widget and can be reused by a later endpoint adapter. */
export function nowPlayingView(snapshot: NowPlayingSnapshot, now: Date | null) {
  const track = snapshot.data;
  if (!track || track.status === 'unavailable' || !track.title.trim()) return null;
  if (!['now-playing', 'recently-played'].includes(track.status)) return null;

  let label = 'Sample selection';
  if (!snapshot.isSample) {
    if (!now || !track.updatedAt) return null;
    const age = now.getTime() - Date.parse(track.updatedAt);
    // Hide invalid, unexpectedly future-dated, or more-than-a-day-old updates.
    if (!Number.isFinite(age) || age < -5 * 60_000 || age > 24 * 60 * 60_000) return null;
    label = track.status === 'now-playing' && age <= 30 * 60_000
      ? 'Now Playing'
      : 'Recently Playing';
  }

  return {
    ...track,
    label,
    isSample: snapshot.isSample,
    artwork: safeArtworkUrl(track.artwork),
    url: safeMusicUrl(track.url)
  };
}
