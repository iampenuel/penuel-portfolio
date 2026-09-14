import { useEffect, useState } from 'react';
import { portfolioApps, type PortfolioAppId } from '../../data/portfolioApps';
import type { PortfolioRoute } from '../../lib/portfolioRoutes';
import { MobileIcon } from './MobileIcon';
import { ShellAppHost } from './ShellAppHost';

export function MobileShell({ route, onNavigate }: { route: PortfolioRoute; onNavigate: (pathname: string) => void }) {
  const [previewAppId, setPreviewAppId] = useState<PortfolioAppId | null>(route.appId);

  useEffect(() => {
    setPreviewAppId(route.appId);
  }, [route.appId, route.pathname]);

  const openApp = (app: (typeof portfolioApps)[number]) => {
    if (app.route) {
      onNavigate(app.route);
      return;
    }
    setPreviewAppId(app.id);
  };

  const goHome = () => {
    if (route.appId) onNavigate('/');
    else setPreviewAppId(null);
  };

  return (
    <main className="mobile-shell" aria-label="iOS-inspired mobile portfolio scaffold">
      {previewAppId ? (
        <ShellAppHost appId={previewAppId} route={route} shellLabel="Mobile" onHome={goHome} />
      ) : (
        <div className="mobile-home">
          <header className="adaptive-shell-heading">
            <span className="adaptive-shell-kicker">Compact shell · Phase 1</span>
            <h1>Penuel</h1>
            <p>The shared portfolio is ready for its mobile presentation.</p>
          </header>
          <nav className="mobile-home-grid" aria-label="Portfolio apps">
            {portfolioApps.map((app) => <MobileIcon key={app.id} app={app} onOpen={() => openApp(app)} />)}
          </nav>
        </div>
      )}
    </main>
  );
}
