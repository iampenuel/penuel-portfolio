import { useEffect, useRef } from 'react';
import { portfolioAppById, type PortfolioAppDefinition } from '../../data/portfolioApps';
import type { FieldNote } from '../../data/fieldNotes';
import type { Verse } from '../../data/verses';
import type { NowPlayingSnapshot } from '../../lib/nowPlaying';
import { MobileIcon } from './MobileIcon';
import { NowPlayingWidget } from './NowPlayingWidget';
import { ResumePreviewWidget } from './ResumePreviewWidget';

const HOME_PAGES = [0, 1, 2] as const;
export type MobileHomePage = (typeof HOME_PAGES)[number];
const clampPage = (page: number) => Math.min(HOME_PAGES.length - 1, Math.max(0, page)) as MobileHomePage;

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
  nowPlaying,
  now,
  onPageChange,
  onOpenApp,
  onOpenLatestNote,
  onOpenLibrary
}: {
  activePage: MobileHomePage;
  verse: Verse | null;
  latestNote: FieldNote | null;
  nowPlaying: NowPlayingSnapshot;
  now: Date | null;
  onPageChange: (page: MobileHomePage) => void;
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

  const moveToPage = (page: MobileHomePage) => {
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
            moveToPage(clampPage(activePage + 1));
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveToPage(clampPage(activePage - 1));
          }
        }}
        onScroll={(event) => {
          const scroller = event.currentTarget;
          const page = clampPage(Math.round(
            scroller.scrollLeft / Math.max(scroller.clientWidth, 1)
          ));
          if (page !== activePage) onPageChange(page);
        }}
      >
        <section className="mobile-home-page mobile-home-page--portfolio" aria-label="Home Screen page 1 of 3">
          <nav className="mobile-primary-grid" aria-label="Portfolio apps">
            {primaryApps.map((app) => (
              <MobileIcon key={app.id} app={app} onOpen={() => onOpenApp(app)} />
            ))}
          </nav>
        </section>

        <section className="mobile-home-page mobile-home-page--personal" aria-label="Home Screen page 2 of 3">
          <NowPlayingWidget snapshot={nowPlaying} now={now} />
          <div className="mobile-personal-row">
            {latestNote && (
              <button className="mobile-latest-note" type="button" onClick={onOpenLatestNote}>
                <span>Latest Field Note</span>
                <strong>{latestNote.week}</strong>
                <b>{latestNote.title}</b>
              </button>
            )}
            <MobileIcon app={personalApp} onOpen={() => onOpenApp(personalApp)} />
          </div>
        </section>

        <section className="mobile-home-page mobile-home-page--reflection" aria-label="Home Screen page 3 of 3">
          <article className="mobile-verse-widget" aria-labelledby="mobile-verse-title">
            <p>Verse of the Day</p>
            <h2 id="mobile-verse-title">{verse?.reference ?? '—'} <span>· ESV</span></h2>
            <blockquote>{verse?.excerpt ?? ''}</blockquote>
            <details>
              <summary>ESV Scripture attribution</summary>
              <p>{ESV_COPYRIGHT_NOTICE}</p>
            </details>
          </article>
          <ResumePreviewWidget onOpen={() => onOpenApp(portfolioAppById.resume)} />
        </section>
      </div>

      <div className="mobile-page-controls">
        <div className="mobile-page-dots" aria-label="Home Screen page selection">
          {HOME_PAGES.map((page) => (
            <button
              key={page}
              type="button"
              aria-label={`Page ${page + 1} of ${HOME_PAGES.length}`}
              aria-current={activePage === page ? 'page' : undefined}
              onClick={() => moveToPage(page)}
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
