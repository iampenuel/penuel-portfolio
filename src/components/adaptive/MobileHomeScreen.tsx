import { useEffect, useRef } from 'react';
import { portfolioAppById, type PortfolioAppDefinition } from '../../data/portfolioApps';
import type { AdaptiveVerse } from '../../data/adaptiveVerses';
import { MobileIcon } from './MobileIcon';
import { MobileVerseWidget } from './MobileVerseWidget';
import { ResumePreviewWidget } from './ResumePreviewWidget';
import { homePageOffset, verseArtworkSize } from '../../lib/phoneLayout';

const HOME_PAGES = [0, 1] as const;
export type MobileHomePage = (typeof HOME_PAGES)[number];
const clampPage = (page: number) => Math.min(HOME_PAGES.length - 1, Math.max(0, page)) as MobileHomePage;

const PRIMARY_APP_IDS = [
  'projects',
  'about-me',
  'experience',
  'resume',
  'definitely-important',
  'contact',
  'github',
  'linkedin'
] as const;

const DOCK_APP_IDS = ['projects', 'contact', 'field-notes'] as const;

export function MobileHomeScreen({
  activePage,
  verse,
  onPageChange,
  onOpenApp,
  onOpenLibrary
}: {
  activePage: MobileHomePage;
  verse: AdaptiveVerse | null;
  onPageChange: (page: MobileHomePage) => void;
  onOpenApp: (app: PortfolioAppDefinition) => void;
  onOpenLibrary: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;
  const primaryApps = PRIMARY_APP_IDS.map((id) => portfolioAppById[id]);
  const dockApps = DOCK_APP_IDS.map((id) => portfolioAppById[id]);
  const pageOffset = (scroller: HTMLDivElement, page: number) => homePageOffset(
    Array.from(scroller.children, (child) => (child as HTMLElement).offsetLeft), page
  );

  const moveToPage = (page: MobileHomePage) => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTo({ left: pageOffset(scroller, page), behavior: 'auto' });
    onPageChange(page);
  };

  useEffect(() => {
    // Realign only on entry/resize; page-dot updates must not interrupt a native swipe.
    const keepPageAligned = () => {
      const scroller = scrollerRef.current;
      if (scroller && scroller.clientWidth > 0) {
        scroller.scrollLeft = pageOffset(scroller, activePageRef.current);
      }
    };
    keepPageAligned();
    const observer = new ResizeObserver(keepPageAligned);
    if (scrollerRef.current) observer.observe(scrollerRef.current);
    window.addEventListener('resize', keepPageAligned);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', keepPageAligned);
    };
  }, []);

  useEffect(() => {
    const page = scrollerRef.current?.querySelector<HTMLElement>('.mobile-home-page--reflection');
    const widget = page?.querySelector<HTMLElement>('.mobile-verse-widget');
    const copy = page?.querySelector<HTMLElement>('.mobile-verse-copy');
    if (!page || !widget || !copy) return;
    const fitArtwork = () => {
      if (!page.clientWidth || !page.clientHeight) return;
      const style = getComputedStyle(page);
      const usableHeight = page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const size = verseArtworkSize(widget.clientWidth, usableHeight, copy.offsetHeight, parseFloat(getComputedStyle(widget).gap));
      widget.style.setProperty('--mobile-verse-art-size', `${size}px`);
    };
    fitArtwork();
    const observer = new ResizeObserver(fitArtwork);
    observer.observe(page);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [verse]);

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
          // Hidden mobile shells have zero width during tablet/desktop orientation changes.
          if (scroller.clientWidth === 0) return;
          const page = HOME_PAGES.reduce((closest, candidate) =>
            Math.abs(scroller.scrollLeft - pageOffset(scroller, candidate)) < Math.abs(scroller.scrollLeft - pageOffset(scroller, closest)) ? candidate : closest, 0);
          if (page !== activePage) onPageChange(page);
        }}
      >
        <section className="mobile-home-page mobile-home-page--portfolio" aria-label="Home Screen page 1 of 2">
          <nav className="mobile-primary-grid" aria-label="Portfolio apps">
            {primaryApps.map((app) => (
              <MobileIcon key={app.id} app={app} directExternal onOpen={() => onOpenApp(app)} />
            ))}
          </nav>
          <ResumePreviewWidget onOpen={() => onOpenApp(portfolioAppById.resume)} />
        </section>

        <section className="mobile-home-page mobile-home-page--reflection" aria-label="Home Screen page 2 of 2">
          <MobileVerseWidget verse={verse} />
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
