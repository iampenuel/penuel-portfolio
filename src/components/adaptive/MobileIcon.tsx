import { portfolioApps } from '../../data/portfolioApps';

type PortfolioApp = (typeof portfolioApps)[number];

export function MobileAppArtwork({ app }: { app: PortfolioApp }) {
  return <img className="mobile-app-artwork" src={app.icon.src} alt="" draggable={false} />;
}

export function MobileIcon({
  app,
  onOpen,
  variant = 'home',
  directExternal = false
}: {
  app: PortfolioApp;
  onOpen: () => void;
  variant?: 'home' | 'dock' | 'library';
  directExternal?: boolean;
}) {
  const content = <><span className="mobile-app-icon-art"><MobileAppArtwork app={app} /></span><span className="mobile-app-icon-label">{app.label}</span></>;
  if (directExternal && app.destination === 'external' && app.externalUrl) {
    return <a className={`mobile-app-icon mobile-app-icon--${variant}`} href={app.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={app.label}>{content}</a>;
  }
  return (
    <button className={`mobile-app-icon mobile-app-icon--${variant}`} type="button" aria-label={app.label} onClick={onOpen}>
      {content}
    </button>
  );
}
