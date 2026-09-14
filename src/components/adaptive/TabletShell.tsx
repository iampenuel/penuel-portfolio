import { useEffect, useState } from 'react';
import { portfolioApps, type PortfolioAppId } from '../../data/portfolioApps';
import type { PortfolioRoute } from '../../lib/portfolioRoutes';
import { MobileIcon } from './MobileIcon';
import { ShellAppHost } from './ShellAppHost';

export function TabletShell({ route, onNavigate }: { route: PortfolioRoute; onNavigate: (pathname: string) => void }) {
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
    <main className="tablet-shell" aria-label="iPadOS-inspired tablet portfolio scaffold">
      {previewAppId ? (
        <ShellAppHost appId={previewAppId} route={route} shellLabel="Tablet" onHome={goHome} />
      ) : (
        <div className="tablet-home">
          <header className="adaptive-shell-heading">
            <span className="adaptive-shell-kicker">Medium shell · Phase 1</span>
            <h1>iPadOS shell foundation</h1>
            <p>The shared app registry and route state are connected. The complete tablet experience comes later.</p>
          </header>
          <nav className="tablet-app-grid" aria-label="Portfolio apps">
            {portfolioApps.map((app) => <MobileIcon key={app.id} app={app} onOpen={() => openApp(app)} />)}
          </nav>
        </div>
      )}
    </main>
  );
}
