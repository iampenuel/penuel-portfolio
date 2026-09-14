import { portfolioApps } from '../../data/portfolioApps';
import { TemporaryContactIcon } from './TemporaryContactIcon';

type PortfolioApp = (typeof portfolioApps)[number];

export function MobileIcon({ app, onOpen }: { app: PortfolioApp; onOpen: () => void }) {
  return (
    <button className="mobile-app-icon" type="button" aria-label={app.label} onClick={onOpen}>
      <span className="mobile-app-icon-art">
        {app.icon.kind === 'asset'
          ? <img src={app.icon.src} alt="" draggable={false} />
          : <TemporaryContactIcon />}
      </span>
      <span className="mobile-app-icon-label">{app.label}</span>
    </button>
  );
}
