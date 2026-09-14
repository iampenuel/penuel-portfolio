import { useEffect, useMemo, useState } from 'react';
import { portfolioApps, type PortfolioAppId } from '../../data/portfolioApps';
import { adaptiveVerseForReference } from '../../data/adaptiveVerses';
import { verseForDate } from '../../data/verses';
import type { PortfolioRoute } from '../../lib/portfolioRoutes';
import { MobileAppHost } from './MobileAppHost';
import { MobileAppLibrary } from './MobileAppLibrary';
import { MobileHomeScreen, type MobileHomePage } from './MobileHomeScreen';
import { MobileStatusBar } from './MobileStatusBar';

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
    const syncNow = () => {
      const next = new Date();
      setNow((current) => current && isSameLocalMinute(current, next) ? current : next);
    };
    syncNow();
    const timer = window.setInterval(syncNow, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const openApp = (app: (typeof portfolioApps)[number]) => {
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
    <main className="mobile-shell" aria-label="Penuel's mobile portfolio">
      <MobileStatusBar now={now} />
      {previewAppId ? (
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
