import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { RickrollLaunch } from '../RickrollPlayer';
import { logPhoneMediaTiming } from '../../lib/phoneMediaDiagnostics';
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
  const [prepareRickroll, setPrepareRickroll] = useState(false);
  const rickrollLaunchRef = useRef<RickrollLaunch>(null);
  const shellRef = useRef<HTMLElement>(null);
  const rickrollOpen = previewAppId === 'definitely-important';
  const verse = useMemo(() => now ? adaptiveVerseForReference(verseForDate(now).reference) : null, [now]);

  useEffect(() => {
    setPreviewAppId(route.appId);
  }, [route.appId, route.pathname]);

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
    if (!isActive || previewAppId || libraryOpen || prepareRickroll) return;
    logPhoneMediaTiming('home-interactive');
    let idle: number | undefined;
    // Home paints and hydrates first. Cueing loads the player/thumbnail, not playback.
    const timer = window.setTimeout(() => {
      const prepare = () => {
        if (!document.hidden) {
          logPhoneMediaTiming('prepare');
          setPrepareRickroll(true);
        }
      };
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(prepare, { timeout: 1_500 });
      else prepare();
    }, 1_500);
    return () => {
      window.clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [isActive, previewAppId, libraryOpen, prepareRickroll]);

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
      logPhoneMediaTiming('app-tap');
      // Reveal the already-cued iframe before calling play, all in this click stack.
      flushSync(() => {
        setPrepareRickroll(true);
        setLibraryOpen(false);
        setPreviewAppId(app.id);
      });
      rickrollLaunchRef.current?.openFromGesture();
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
    if (route.appId) onNavigate('/');
    else {
      setPreviewAppId(null);
      setLibraryOpen(false);
    }
  };

  return (
    <main ref={shellRef} className="mobile-shell" aria-label="Penuel's mobile portfolio">
      {prepareRickroll && (
        <div className="mobile-prepared-app" data-open={rickrollOpen && isActive} aria-hidden={!rickrollOpen || !isActive} inert={!rickrollOpen || !isActive}>
          <MobileAppHost appId="definitely-important" route={route} onHome={goHome} onNavigate={onNavigate} onOpenApp={setPreviewAppId} isActive={isActive && rickrollOpen} reducedMotion={reducedMotion} rickrollLaunchRef={rickrollLaunchRef} />
        </div>
      )}
      {rickrollOpen ? null : previewAppId ? (
        <MobileAppHost key={previewAppId} appId={previewAppId} route={route} onHome={goHome} onNavigate={onNavigate} onOpenApp={setPreviewAppId} isActive={isActive} reducedMotion={reducedMotion} />
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
    </main>
  );
}
