import type { PortfolioAppId } from '../data/portfolioApps';

export type PortfolioRoute = {
  pathname: string;
  appId: PortfolioAppId | null;
  fieldNoteSlug: string | null;
};

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function resolvePortfolioRoute(pathname: string): PortfolioRoute {
  const normalizedPathname = normalizePathname(pathname);
  const fieldNotesMatch = normalizedPathname.match(/^\/field-notes(?:\/([^/]+))?$/);

  if (fieldNotesMatch) {
    return {
      pathname: normalizedPathname,
      appId: 'field-notes',
      fieldNoteSlug: fieldNotesMatch[1] ?? null
    };
  }

  return {
    pathname: normalizedPathname,
    appId: null,
    fieldNoteSlug: null
  };
}

export function initialPortfolioRoute(fieldNotesOpen: boolean, fieldNoteSlug: string | null): PortfolioRoute {
  if (!fieldNotesOpen) return resolvePortfolioRoute('/');
  return resolvePortfolioRoute(fieldNoteSlug ? `/field-notes/${fieldNoteSlug}` : '/field-notes');
}

export function fieldNotePath(slug?: string | null) {
  return slug ? `/field-notes/${slug}` : '/field-notes';
}

export function isFieldNotesRoute(route: PortfolioRoute) {
  return route.appId === 'field-notes';
}
