import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { flushSync } from 'react-dom';
import { MobileRickroll, usePhoneRickroll } from './MobileRickroll';
import { phoneVisibleHeight } from '../../lib/phoneLayout';
import { portfolioApps, type PortfolioAppId } from '../../data/portfolioApps';
import { adaptiveVerseForReference } from '../../data/adaptiveVerses';
import { verseForDate } from '../../data/verses';
import type { PortfolioRoute } from '../../lib/portfolioRoutes';
import { MobileAppHost } from './MobileAppHost';
import { MobileAppLibrary } from './MobileAppLibrary';
import { MobileHomeScreen, type MobileHomePage } from './MobileHomeScreen';

function isSameLocalMinute(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
    && first.getHours() === second.getHours()
    && first.getMinutes() === second.getMinutes();
}

export function MobileShell({ route, onNavigate }: { route: PortfolioRoute; onNavigate: (pathname: string) => void }) {
  const [previewAppId, setPreviewAppId] = useState<PortfolioAppId | null>(route.appId);
  const [homePage, setHomePage] = useState<MobileHomePage>(0);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const shellRef = useRef<HTMLElement>(null);
  const { controller: rickroll, hostRef: rickrollHost } = usePhoneRickroll();
  const [MediaQA, setMediaQA] = useState<ComponentType | null>(null);
  const verse = useMemo(() => now ? adaptiveVerseForReference(verseForDate(now).reference) : null, [now]);

  useEffect(() => {
    // Vite removes this import (and its comparison UI) from production builds.
    if (!(import.meta.env.DEV || import.meta.env.PHONE_MEDIA_QA)) return;
    if (new URLSearchParams(window.location.search).get('rickroll-qa') !== '1') return;
    let cancelled = false;
    void import('./RickrollComparison').then(module => {
      if (!cancelled) setMediaQA(() => module.default);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    rickroll.close();
    setPreviewAppId(route.appId);
  }, [route.appId, route.pathname, rickroll]);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 767px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      const override = document.documentElement.dataset.portfolioShellOverride;
      setIsActive(override ? override === 'mobile' : phone.matches);
      setReducedMotion(motion.matches);
    };
    sync();
    phone.addEventListener('change', sync);
    motion.addEventListener('change', sync);
    return () => {
      phone.removeEventListener('change', sync);
      motion.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const height = phoneVisibleHeight(window.innerHeight, viewport ?? undefined);
        if (height !== null) shellRef.current?.style.setProperty('--mobile-visible-height', `${height}px`);
      });
    };
    sync();
    viewport?.addEventListener('resize', sync);
    viewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      window.cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', sync);
      viewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      shellRef.current?.style.removeProperty('--mobile-visible-height');
    };
  }, [isActive]);

  useEffect(() => {
    const syncNow = () => {
      const next = new Date();
      setNow((current) => current && isSameLocalMinute(current, next) ? current : next);
    };
    syncNow();
    const timer = window.setInterval(syncNow, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const openApp = (app: (typeof portfolioApps)[number]) => {
    if (app.id === 'definitely-important') {
      rickroll.openFromGesture(() => flushSync(() => {
        setLibraryOpen(false);
        setPreviewAppId(app.id);
      }));
      return;
    }
    setLibraryOpen(false);
    if (app.route) {
      onNavigate(app.route);
      return;
    }
    setPreviewAppId(app.id);
  };

  const goHome = () => {
    if (previewAppId === 'definitely-important') rickroll.close();
    if (route.appId) onNavigate('/');
    else {
      setPreviewAppId(null);
      setLibraryOpen(false);
    }
  };

  if (MediaQA && isActive) return <MediaQA />;

  return (
    <main ref={shellRef} className="mobile-shell" aria-label="Penuel's mobile portfolio">
      {previewAppId ? (
        <MobileAppHost key={previewAppId} appId={previewAppId} route={route} onHome={goHome} onNavigate={onNavigate} onOpenApp={(id) => openApp(portfolioApps.find(app => app.id === id)!)} isActive={isActive} />
      ) : libraryOpen ? (
        <MobileAppLibrary onHome={() => setLibraryOpen(false)} onOpenApp={openApp} />
      ) : (
        <MobileHomeScreen
          activePage={homePage}
          verse={verse}
          onPageChange={setHomePage}
          onOpenApp={openApp}
          onOpenLibrary={() => setLibraryOpen(true)}
        />
      )}
      <MobileRickroll controller={rickroll} hostRef={rickrollHost} active={isActive} open={previewAppId === 'definitely-important'} onHome={goHome} reducedMotion={reducedMotion} />
    </main>
  );
}
