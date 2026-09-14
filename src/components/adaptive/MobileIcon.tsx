import { portfolioApps } from '../../data/portfolioApps';
import { TemporaryContactIcon } from './TemporaryContactIcon';

type PortfolioApp = (typeof portfolioApps)[number];

export function MobileAppArtwork({ app }: { app: PortfolioApp }) {
  return app.icon.kind === 'asset'
    ? <img src={app.icon.src} alt="" draggable={false} />
    : <TemporaryContactIcon />;
}

export function MobileIcon({
  app,
  onOpen,
  variant = 'home'
}: {
  app: PortfolioApp;
  onOpen: () => void;
  variant?: 'home' | 'dock' | 'library';
}) {
  return (
    <button className={`mobile-app-icon mobile-app-icon--${variant}`} type="button" aria-label={app.label} onClick={onOpen}>
      <span className="mobile-app-icon-art">
        <MobileAppArtwork app={app} />
      </span>
      <span className="mobile-app-icon-label">{app.label}</span>
    </button>
  );
}
