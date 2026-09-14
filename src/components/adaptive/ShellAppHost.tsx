import { portfolioAppById, type PortfolioAppId } from '../../data/portfolioApps';
import { publishedFieldNotes } from '../../data/fieldNotes';
import type { PortfolioRoute } from '../../lib/portfolioRoutes';

export function ShellAppHost({
  appId,
  route,
  shellLabel,
  onHome
}: {
  appId: PortfolioAppId;
  route: PortfolioRoute;
  shellLabel: string;
  onHome: () => void;
}) {
  const app = portfolioAppById[appId];
  const selectedNote = appId === 'field-notes'
    ? publishedFieldNotes.find((note) => note.slug === route.fieldNoteSlug) ?? null
    : null;

  return (
    <section className="shell-app-host" aria-labelledby={`${shellLabel}-app-title`}>
      <button className="shell-back-button" type="button" onClick={onHome}>‹ Home</button>
      <div className="shell-app-host-copy">
        <span className="adaptive-shell-kicker">{shellLabel} app host · Phase 1</span>
        <h1 id={`${shellLabel}-app-title`}>{app.label}</h1>
        {appId === 'field-notes' ? (
          <p>
            {selectedNote
              ? `${selectedNote.week} selected · ${selectedNote.title}`
              : 'Field Notes index selected'}
          </p>
        ) : (
          <p>{app.destination === 'external' ? 'External destination registered.' : 'Shared portfolio content registered.'}</p>
        )}
        <p className="shell-phase-note">The complete compact app experience arrives in a later phase.</p>
      </div>
    </section>
  );
}
