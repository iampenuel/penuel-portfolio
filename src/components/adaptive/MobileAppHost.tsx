import { portfolioAppById, type PortfolioAppId } from '../../data/portfolioApps';
import { publishedFieldNotes } from '../../data/fieldNotes';
import type { PortfolioRoute } from '../../lib/portfolioRoutes';
import { MobileAppArtwork } from './MobileIcon';

export function MobileAppHost({
  appId,
  route,
  onHome
}: {
  appId: PortfolioAppId;
  route: PortfolioRoute;
  onHome: () => void;
}) {
  const app = portfolioAppById[appId];
  const selectedNote = appId === 'field-notes'
    ? publishedFieldNotes.find((note) => note.slug === route.fieldNoteSlug) ?? null
    : null;

  return (
    <section className="mobile-app-host" aria-labelledby="mobile-app-title">
      <nav className="mobile-app-host-nav" aria-label={`${app.label} navigation`}>
        <button type="button" onClick={onHome}>‹ Home</button>
        <span>{app.label}</span>
      </nav>
      <div className="mobile-app-host-content">
        <div className="mobile-app-host-art" aria-hidden="true"><MobileAppArtwork app={app} /></div>
        <p className="mobile-app-host-kicker">{selectedNote?.week ?? app.label}</p>
        <h1 id="mobile-app-title">{selectedNote?.title ?? app.label}</h1>
        <p>{selectedNote ? selectedNote.pinnedThought : app.mobileSummary}</p>
        {app.externalUrl && (
          <a href={app.externalUrl} target="_blank" rel="noreferrer">Open {app.label}</a>
        )}
      </div>
    </section>
  );
}
