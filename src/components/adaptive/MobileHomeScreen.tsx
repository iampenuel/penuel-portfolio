import { useEffect, useRef } from 'react';
import { portfolioAppById, type PortfolioAppDefinition } from '../../data/portfolioApps';
import type { FieldNote } from '../../data/fieldNotes';
import type { Verse } from '../../data/verses';
import { MobileIcon } from './MobileIcon';

const PRIMARY_APP_IDS = [
  'projects',
  'about-me',
  'experience',
  'resume',
  'field-notes',
  'contact',
  'github',
  'linkedin'
] as const;

const DOCK_APP_IDS = ['projects', 'contact', 'field-notes'] as const;

const ESV_COPYRIGHT_NOTICE = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. ESV Text Edition: 2025. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated in whole or in part into any other language. Used by permission. All rights reserved.';

export function MobileHomeScreen({
  activePage,
  verse,
  latestNote,
  onPageChange,
  onOpenApp,
  onOpenLatestNote,
  onOpenLibrary
}: {
  activePage: 0 | 1;
  verse: Verse | null;
  latestNote: FieldNote | null;
  onPageChange: (page: 0 | 1) => void;
  onOpenApp: (app: PortfolioAppDefinition) => void;
  onOpenLatestNote: () => void;
  onOpenLibrary: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;
  const primaryApps = PRIMARY_APP_IDS.map((id) => portfolioAppById[id]);
  const dockApps = DOCK_APP_IDS.map((id) => portfolioAppById[id]);
  const personalApp = portfolioAppById['definitely-important'];

  const moveToPage = (page: 0 | 1) => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTo({ left: scroller.clientWidth * page, behavior: 'auto' });
    onPageChange(page);
  };

  useEffect(() => {
    // Realign only on entry/resize; page-dot updates must not interrupt a native swipe.
    const keepPageAligned = () => {
      const scroller = scrollerRef.current;
      if (scroller) scroller.scrollLeft = scroller.clientWidth * activePageRef.current;
    };
    keepPageAligned();
    window.addEventListener('resize', keepPageAligned);
    return () => window.removeEventListener('resize', keepPageAligned);
  }, []);

  return (
    <div className="mobile-home-screen">
      <div
        ref={scrollerRef}
        className="mobile-home-pages"
        role="region"
        aria-label="Home Screen pages"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveToPage(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveToPage(0);
          }
        }}
        onScroll={(event) => {
          const scroller = event.currentTarget;
          const page = Math.min(1, Math.max(0, Math.round(
            scroller.scrollLeft / Math.max(scroller.clientWidth, 1)
          ))) as 0 | 1;
          if (page !== activePage) onPageChange(page);
        }}
      >
        <section className="mobile-home-page mobile-home-page--portfolio" aria-label="Home Screen page 1 of 2">
          <nav className="mobile-primary-grid" aria-label="Portfolio apps">
            {primaryApps.map((app) => (
              <MobileIcon key={app.id} app={app} onOpen={() => onOpenApp(app)} />
            ))}
          </nav>
        </section>

        <section className="mobile-home-page mobile-home-page--personal" aria-label="Home Screen page 2 of 2">
          <article className="mobile-verse-widget" aria-labelledby="mobile-verse-title">
            <p>Verse of the Day</p>
            <h2 id="mobile-verse-title">{verse?.reference ?? '—'} <span>· ESV</span></h2>
            <blockquote>{verse?.excerpt ?? ''}</blockquote>
            <details>
              <summary>ESV Scripture attribution</summary>
              <p>{ESV_COPYRIGHT_NOTICE}</p>
            </details>
          </article>
          <div className="mobile-personal-row">
            <MobileIcon app={personalApp} onOpen={() => onOpenApp(personalApp)} />
            {latestNote && (
              <button className="mobile-latest-note" type="button" onClick={onOpenLatestNote}>
                <span>Latest Field Note</span>
                <strong>{latestNote.week}</strong>
                <b>{latestNote.title}</b>
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="mobile-page-controls">
        <div className="mobile-page-dots" aria-label="Home Screen page selection">
          {[0, 1].map((page) => (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page + 1} of 2`}
              aria-current={activePage === page ? 'page' : undefined}
              onClick={() => moveToPage(page as 0 | 1)}
            ><span aria-hidden="true" /></button>
          ))}
        </div>
        <button className="mobile-library-trigger" type="button" onClick={onOpenLibrary} aria-label="Search apps">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m12.5 12.5 4 4" />
          </svg>
          <span>Search</span>
        </button>
      </div>

      <nav className="mobile-dock" aria-label="Mobile dock">
        {dockApps.map((app) => (
          <MobileIcon key={app.id} app={app} variant="dock" onOpen={() => onOpenApp(app)} />
        ))}
      </nav>
    </div>
  );
}
