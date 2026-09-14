import { useMemo, useState } from 'react';
import {
  portfolioApps,
  type MobileLibraryGroup,
  type PortfolioAppDefinition
} from '../../data/portfolioApps';
import { MobileIcon } from './MobileIcon';

const LIBRARY_GROUPS: { id: MobileLibraryGroup; label: string }[] = [
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'connect', label: 'Connect' }
];

export function MobileAppLibrary({
  onHome,
  onOpenApp
}: {
  onHome: () => void;
  onOpenApp: (app: PortfolioAppDefinition) => void;
}) {
  const [query, setQuery] = useState('');
  const filteredApps = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? portfolioApps.filter((app) => app.label.toLocaleLowerCase().includes(normalizedQuery))
      : portfolioApps;
  }, [query]);

  return (
    <section className="mobile-app-library" aria-labelledby="mobile-library-title">
      <header className="mobile-library-header">
        <button type="button" onClick={onHome}>‹ Home</button>
        <h1 id="mobile-library-title">App Library</h1>
      </header>
      <div className="mobile-library-search">
        <label htmlFor="mobile-app-search">Search apps</label>
        <span aria-hidden="true">⌕</span>
        <input
          id="mobile-app-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search Apps"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="mobile-library-groups">
        {LIBRARY_GROUPS.map((group) => {
          const apps = filteredApps.filter((app) => app.mobileLibraryGroup === group.id);
          if (!apps.length) return null;
          return (
            <section className="mobile-library-group" key={group.id} aria-labelledby={`mobile-library-${group.id}`}>
              <h2 id={`mobile-library-${group.id}`}>{group.label}</h2>
              <div className="mobile-library-grid">
                {apps.map((app) => (
                  <MobileIcon key={app.id} app={app} variant="library" directExternal onOpen={() => onOpenApp(app)} />
                ))}
              </div>
            </section>
          );
        })}
        {!filteredApps.length && <p className="mobile-library-empty" role="status">No matching apps</p>}
      </div>
    </section>
  );
}
