import { portfolioApps } from '../../data/portfolioApps';

type PortfolioApp = (typeof portfolioApps)[number];

export function MobileAppArtwork({ app }: { app: PortfolioApp }) {
  return <img className="mobile-app-artwork" src={app.icon.src} alt="" draggable={false} />;
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
