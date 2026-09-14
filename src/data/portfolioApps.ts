export type PortfolioAppId =
  | 'projects'
  | 'about-me'
  | 'experience'
  | 'resume'
  | 'field-notes'
  | 'contact'
  | 'github'
  | 'linkedin'
  | 'definitely-important';

export type DesktopAppWindowId =
  | 'projects'
  | 'about'
  | 'experience'
  | 'resume'
  | 'field-notes'
  | 'contact'
  | 'github'
  | 'linkedin'
  | 'rickroll';

type AppIcon =
  | { kind: 'asset'; src: string }
  | { kind: 'temporary-contact' };

type ShellBehavior = 'app' | 'external-link' | 'media';

export type PortfolioAppDefinition = {
  id: PortfolioAppId;
  label: string;
  icon: AppIcon;
  destination: 'internal' | 'external';
  route: string | null;
  externalUrl?: string;
  desktop: {
    windowId: DesktopAppWindowId;
    homePosition?: { column: 1 | 2; row: number; order: number };
  };
  mobileBehavior: ShellBehavior;
  tabletBehavior: ShellBehavior;
};

export const portfolioApps: readonly PortfolioAppDefinition[] = [
  {
    id: 'projects',
    label: 'Projects',
    icon: { kind: 'asset', src: '/assets/mobile/icons/projects.png' },
    destination: 'internal',
    route: null,
    desktop: { windowId: 'projects', homePosition: { column: 1, row: 0, order: 1 } },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'about-me',
    label: 'About Me',
    icon: { kind: 'asset', src: '/assets/mobile/icons/about-me.png' },
    destination: 'internal',
    route: null,
    desktop: { windowId: 'about', homePosition: { column: 1, row: 1, order: 3 } },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'experience',
    label: 'Experience',
    icon: { kind: 'asset', src: '/assets/mobile/icons/experience.png' },
    destination: 'internal',
    route: null,
    desktop: { windowId: 'experience', homePosition: { column: 1, row: 2, order: 6 } },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'resume',
    label: 'Resume',
    icon: { kind: 'asset', src: '/assets/mobile/icons/resume.png' },
    destination: 'internal',
    route: null,
    desktop: { windowId: 'resume', homePosition: { column: 1, row: 3, order: 7 } },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'field-notes',
    label: 'Field Notes',
    icon: { kind: 'asset', src: '/assets/mobile/icons/field-notes.png' },
    destination: 'internal',
    route: '/field-notes',
    desktop: { windowId: 'field-notes', homePosition: { column: 2, row: 2, order: 5 } },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: { kind: 'temporary-contact' },
    destination: 'internal',
    route: null,
    desktop: { windowId: 'contact' },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: { kind: 'asset', src: '/assets/mobile/icons/github.png' },
    destination: 'external',
    route: null,
    externalUrl: 'https://github.com/iampenuel',
    desktop: { windowId: 'github', homePosition: { column: 2, row: 0, order: 2 } },
    mobileBehavior: 'external-link',
    tabletBehavior: 'external-link'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: { kind: 'asset', src: '/assets/mobile/icons/linkedin.png' },
    destination: 'external',
    route: null,
    externalUrl: 'https://www.linkedin.com/in/penuel-stanley-zebulon/',
    desktop: { windowId: 'linkedin', homePosition: { column: 2, row: 1, order: 4 } },
    mobileBehavior: 'external-link',
    tabletBehavior: 'external-link'
  },
  {
    id: 'definitely-important',
    label: 'Definitely Important',
    icon: { kind: 'asset', src: '/assets/mobile/icons/definitely-important.png' },
    destination: 'internal',
    route: null,
    desktop: { windowId: 'rickroll', homePosition: { column: 2, row: 3, order: 8 } },
    mobileBehavior: 'media',
    tabletBehavior: 'media'
  }
];

export const portfolioAppById = Object.fromEntries(
  portfolioApps.map((app) => [app.id, app])
) as Record<PortfolioAppId, PortfolioAppDefinition>;
