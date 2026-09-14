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

type AppIcon = { kind: 'asset'; src: string };

type ShellBehavior = 'app' | 'external-link' | 'media';
export type MobileLibraryGroup = 'work' | 'personal' | 'connect';

export type PortfolioAppDefinition = {
  id: PortfolioAppId;
  label: string;
  icon: AppIcon;
  destination: 'internal' | 'external';
  route: string | null;
  externalUrl?: string;
  mobileSummary: string;
  mobileLibraryGroup: MobileLibraryGroup;
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
    mobileSummary: 'Selected work in healthcare AI, agent systems, and product engineering.',
    mobileLibraryGroup: 'work',
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
    mobileSummary: 'The path, principles, and curiosity behind the work.',
    mobileLibraryGroup: 'personal',
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
    mobileSummary: 'Roles, leadership, certifications, and the experience behind the portfolio.',
    mobileLibraryGroup: 'work',
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
    mobileSummary: 'A concise view of Penuel’s experience, education, and technical work.',
    mobileLibraryGroup: 'work',
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
    mobileSummary: 'Reflections on human-centered AI, learning, and building responsibly.',
    mobileLibraryGroup: 'personal',
    desktop: { windowId: 'field-notes', homePosition: { column: 2, row: 2, order: 5 } },
    mobileBehavior: 'app',
    tabletBehavior: 'app'
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: { kind: 'asset', src: '/assets/mobile/icons/contact.png' },
    destination: 'internal',
    route: null,
    mobileSummary: 'A direct place to start a conversation with Penuel.',
    mobileLibraryGroup: 'connect',
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
    mobileSummary: 'Code, experiments, and public project work on GitHub.',
    mobileLibraryGroup: 'connect',
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
    mobileSummary: 'Professional experience and updates on LinkedIn.',
    mobileLibraryGroup: 'connect',
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
    mobileSummary: 'A carefully curated break from the serious work.',
    mobileLibraryGroup: 'personal',
    desktop: { windowId: 'rickroll', homePosition: { column: 2, row: 3, order: 8 } },
    mobileBehavior: 'media',
    tabletBehavior: 'media'
  }
];

export const portfolioAppById = Object.fromEntries(
  portfolioApps.map((app) => [app.id, app])
) as Record<PortfolioAppId, PortfolioAppDefinition>;
