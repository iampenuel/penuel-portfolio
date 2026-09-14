import { nowPlayingView, type NowPlayingSnapshot } from '../../lib/nowPlaying';

export function NowPlayingWidget({ snapshot, now }: { snapshot: NowPlayingSnapshot; now: Date | null }) {
  const track = nowPlayingView(snapshot, now);
  if (!track) return null;

  const content = (
    <>
      <span className="mobile-music-label">{track.label}</span>
      <div className="mobile-music-art-row">
        {track.artwork ? (
          <img className="mobile-music-art" src={track.artwork} alt={`${track.isSample ? 'Illustrative sample cover' : 'Artwork'} for ${track.title}`} />
        ) : <span className="mobile-music-art mobile-music-art--empty" aria-hidden="true">♪</span>}
        {track.url && (
          <span className="mobile-music-open" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false"><path d="M6 14 14 6M6 6h8v8" /></svg>
          </span>
        )}
      </div>
      <strong className="mobile-music-title">{track.title}</strong>
      <span className="mobile-music-artist">{track.artist}</span>
      <span className="mobile-music-source">{track.source}</span>
      {track.isSample && <span className="mobile-music-sample">Design preview · not live</span>}
    </>
  );

  return track.url ? (
    <a className="mobile-now-playing" href={track.url} target="_blank" rel="noopener noreferrer"
      aria-label={`${track.label}: ${track.title} by ${track.artist}. Open in ${track.source} in a new tab.`}>
      {content}
    </a>
  ) : (
    <article className="mobile-now-playing" aria-label={`${track.label}: ${track.title} by ${track.artist}`}>
      {content}
    </article>
  );
}
