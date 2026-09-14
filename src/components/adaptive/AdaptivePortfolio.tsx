import { useCallback, useEffect, useMemo, useState } from 'react';
import PortfolioDesktop from '../PortfolioDesktop';
import {
  initialPortfolioRoute,
  resolvePortfolioRoute,
  type PortfolioRoute
} from '../../lib/portfolioRoutes';
import { MobileShell } from './MobileShell';
import { TabletShell } from './TabletShell';

type AdaptivePortfolioProps = {
  initialFieldNotesOpen?: boolean;
  initialFieldNoteSlug?: string | null;
};

export default function AdaptivePortfolio({
  initialFieldNotesOpen = false,
  initialFieldNoteSlug = null
}: AdaptivePortfolioProps) {
  const initialRoute = useMemo(
    () => initialPortfolioRoute(initialFieldNotesOpen, initialFieldNoteSlug),
    [initialFieldNotesOpen, initialFieldNoteSlug]
  );
  const [route, setRoute] = useState<PortfolioRoute>(initialRoute);

  useEffect(() => {
    const syncRoute = () => setRoute(resolvePortfolioRoute(window.location.pathname));
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const navigate = useCallback((pathname: string) => {
    if (window.location.pathname === pathname) return;
    const shellOverride = document.documentElement.dataset.portfolioShellOverride;
    const target = shellOverride ? `${pathname}?shell=${shellOverride}` : pathname;
    window.history.pushState({ portfolioRoute: pathname }, '', target);
    setRoute(resolvePortfolioRoute(pathname));
  }, []);

  return (
    <div className="adaptive-portfolio" data-active-route={route.pathname}>
      <div className="adaptive-shell adaptive-shell-desktop" data-portfolio-shell="desktop">
        <PortfolioDesktop route={route} onNavigate={navigate} />
      </div>
      <div className="adaptive-shell adaptive-shell-tablet" data-portfolio-shell="tablet">
        <TabletShell route={route} onNavigate={navigate} />
      </div>
      <div className="adaptive-shell adaptive-shell-mobile" data-portfolio-shell="mobile">
        <MobileShell route={route} onNavigate={navigate} />
      </div>
    </div>
  );
}
