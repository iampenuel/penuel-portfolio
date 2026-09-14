import { useEffect, useMemo, useState } from 'react';
import { portfolioApps, type PortfolioAppId } from '../../data/portfolioApps';
import { publishedFieldNotes } from '../../data/fieldNotes';
import { nowPlayingSnapshot } from '../../data/nowPlaying';
import { verseForDate } from '../../data/verses';
import { fieldNotePath } from '../../lib/portfolioRoutes';
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
  const latestNote = publishedFieldNotes[0] ?? null;
  const verse = useMemo(() => now ? verseForDate(now) : null, [now]);

  useEffect(() => {
    setPreviewAppId(route.appId);
  }, [route.appId, route.pathname]);

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
        <MobileAppHost appId={previewAppId} route={route} onHome={goHome} />
      ) : libraryOpen ? (
        <MobileAppLibrary onHome={() => setLibraryOpen(false)} onOpenApp={openApp} />
      ) : (
        <MobileHomeScreen
          activePage={homePage}
          verse={verse}
          latestNote={latestNote}
          nowPlaying={nowPlayingSnapshot}
          now={now}
          onPageChange={setHomePage}
          onOpenApp={openApp}
          onOpenLatestNote={() => onNavigate(fieldNotePath(latestNote?.slug))}
          onOpenLibrary={() => setLibraryOpen(true)}
        />
      )}
    </main>
  );
}
