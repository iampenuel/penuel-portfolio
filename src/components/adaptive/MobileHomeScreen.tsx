import { useEffect, useRef } from 'react';
import { portfolioAppById, type PortfolioAppDefinition } from '../../data/portfolioApps';
import type { AdaptiveVerse } from '../../data/adaptiveVerses';
import { MobileIcon } from './MobileIcon';
import { MobileVerseWidget } from './MobileVerseWidget';
import { ResumePreviewWidget } from './ResumePreviewWidget';
import { fittedVerseRailWidth, homePageOffset, reflectionContentRegion } from '../../lib/phoneLayout';

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
  const homeRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;
  const primaryApps = PRIMARY_APP_IDS.map((id) => portfolioAppById[id]);
  const dockApps = DOCK_APP_IDS.map((id) => portfolioAppById[id]);
  const pageOffset = (scroller: HTMLDivElement, page: number) => homePageOffset(
    Array.from(scroller.children, (child) => (child as HTMLElement).offsetLeft), page
  );

  const moveToPage = (page: MobileHomePage) => {
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollTo({ left: pageOffset(scroller, page), behavior: 'auto' });
      // Page 2 unmounts the dots; keep keyboard navigation on the surviving pager.
      scroller.focus({ preventScroll: true });
    }
    onPageChange(page);
  };

  useEffect(() => {
    // Realign only on entry/width changes. Removing Page 2 controls changes height,
    // which must not snap or interrupt an in-progress horizontal swipe.
    let previousWidth = 0;
    const keepPageAligned = () => {
      const scroller = scrollerRef.current;
      if (scroller && scroller.clientWidth > 0 && scroller.clientWidth !== previousWidth) {
        scroller.scrollLeft = pageOffset(scroller, activePageRef.current);
      }
      previousWidth = scroller?.clientWidth ?? 0;
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
    const home = homeRef.current;
    const scroller = scrollerRef.current;
    const controls = controlsRef.current;
    const dock = dockRef.current;
    const shell = home?.closest<HTMLElement>('.mobile-shell');
    if (!home || !scroller || !shell) return;
    const viewport = window.visualViewport;
    const measureContentRegion = () => {
      if (!home.clientWidth) return;
      // Preserve the existing pinch-zoom behavior instead of shrinking content to defeat zoom.
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
      const region = reflectionContentRegion({
        contentTop: scroller.getBoundingClientRect().top,
        controlsTop: controls?.getBoundingClientRect().top,
        controlsBottom: dock?.getBoundingClientRect().bottom,
        shellBottom: shell.getBoundingClientRect().bottom,
        bottomInset: parseFloat(getComputedStyle(shell).paddingBottom),
        viewportBottom: viewport ? viewport.height + viewport.offsetTop : window.innerHeight
      });
      home.style.setProperty('--phone-persistent-controls-height', `${region.persistentControlsHeight}px`);
      home.style.setProperty('--phone-page-content-height', `${region.contentHeight}px`);
    };
    let frame = 0;
    const scheduleMeasurement = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureContentRegion);
    };
    measureContentRegion();
    const observer = new ResizeObserver(scheduleMeasurement);
    [shell, scroller, controls, dock].forEach((element) => {
      if (element) observer.observe(element);
    });
    viewport?.addEventListener('resize', scheduleMeasurement);
    viewport?.addEventListener('scroll', scheduleMeasurement);
    window.addEventListener('resize', scheduleMeasurement);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      viewport?.removeEventListener('resize', scheduleMeasurement);
      viewport?.removeEventListener('scroll', scheduleMeasurement);
      window.removeEventListener('resize', scheduleMeasurement);
    };
  }, [activePage]);

  useEffect(() => {
    const page = scrollerRef.current?.querySelector<HTMLElement>('.mobile-home-page--reflection');
    const widget = page?.querySelector<HTMLElement>('.mobile-verse-widget');
    const copy = page?.querySelector<HTMLElement>('.mobile-verse-copy');
    if (!page || !widget || !copy) return;
    const normalPhone = window.matchMedia('(min-height: 760px)');
    const fitSharedRail = () => {
      widget.style.removeProperty('--mobile-verse-rail-width');
      if (!normalPhone.matches || !page.clientWidth || !page.clientHeight) return;
      const style = getComputedStyle(page);
      // Preserve the approved rail-size preference. The extra trailing breathing room may
      // scroll; it must not trigger another artwork reduction or determine the scrollport.
      const railClearance = parseFloat(style.getPropertyValue('--mobile-verse-rail-clearance'));
      const availableHeight = page.clientHeight - parseFloat(style.paddingTop) - railClearance - 1;
      const fullWidth = widget.getBoundingClientRect().width;
      const width = fittedVerseRailWidth(fullWidth, availableHeight, (candidate) => {
        widget.style.setProperty('--mobile-verse-rail-width', `${candidate}px`);
        return widget.getBoundingClientRect().height;
      });
      widget.style.setProperty('--mobile-verse-rail-width', `${width}px`);
    };
    fitSharedRail();
    let frame = 0;
    const scheduleFit = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fitSharedRail);
    };
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(page);
    observer.observe(copy);
    normalPhone.addEventListener('change', scheduleFit);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      normalPhone.removeEventListener('change', scheduleFit);
    };
  }, [verse]);

  return (
    <div ref={homeRef} className="mobile-home-screen" data-active-page={activePage}>
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

      {activePage === 0 && <>
      <div ref={controlsRef} className="mobile-page-controls">
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

      <nav ref={dockRef} className="mobile-dock" aria-label="Mobile dock">
        {dockApps.map((app) => (
          <MobileIcon key={app.id} app={app} variant="dock" onOpen={() => onOpenApp(app)} />
        ))}
      </nav>
      </>}
    </div>
  );
}
