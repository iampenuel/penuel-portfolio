export function MobileStatusBar({ now }: { now: Date | null }) {
  const visibleTime = now
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
      .format(now)
      .replace(/\s?[AP]M$/i, '')
    : '—';
  const accessibleTime = now
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(now)
    : 'Time unavailable';

  return (
    <header className="mobile-status-bar" aria-label="Mobile status bar">
      <time dateTime={now?.toISOString()} aria-label={`Local time ${accessibleTime}`}>{visibleTime}</time>
      <div className="mobile-status-motifs" aria-hidden="true">
        <span className="mobile-signal-motif"><i /><i /><i /><i /></span>
        <svg className="mobile-wifi-motif" viewBox="0 0 20 15" focusable="false">
          <path d="M2 5.5a12 12 0 0 1 16 0M5 8.7a7.6 7.6 0 0 1 10 0M8.2 11.8a3 3 0 0 1 3.6 0" />
          <circle cx="10" cy="13.4" r="1" />
        </svg>
        <span className="mobile-battery-motif"><i /></span>
      </div>
    </header>
  );
}
