import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { projects } from '../../../src/data/projects';
import { publishedFieldNotes } from '../../../src/data/fieldNotes';
import { portfolioAppById } from '../../../src/data/portfolioApps';
import { ProjectDetailWindow, AboutWindow, ExperienceWindow } from '../../../src/components/PortfolioContent';
import { FieldNotesWindow } from '../../../src/components/FieldNotesWindow';
import { ContactWindow } from '../../../src/components/ContactWindow';
import { MobileAppHost } from '../../../src/components/adaptive/MobileAppHost';
import { MobileIcon } from '../../../src/components/adaptive/MobileIcon';
import { resolvePortfolioRoute } from '../../../src/lib/portfolioRoutes';

const noop = () => {};
const escaped = (text) => renderToStaticMarkup(createElement('span', null, text)).slice(6, -7);

describe('shared mobile content', () => {
  it('lists all seven source records with their supplied images and descriptions', () => {
    const html = renderToStaticMarkup(createElement(MobileAppHost, { appId: 'projects', route: resolvePortfolioRoute('/'), onHome: noop, onNavigate: noop, onOpenApp: noop, isActive: true, reducedMotion: true }));
    expect(projects).toHaveLength(7);
    for (const project of projects) {
      for (const text of [project.name, project.category, project.tagline]) expect(html).toContain(escaped(text));
      if (project.image) expect(html).toContain(project.image);
    }
  });

  it('renders every detail field and original safe external destination', () => {
    for (const project of projects) {
      const html = renderToStaticMarkup(createElement(ProjectDetailWindow, { project }));
      for (const text of [project.overview, project.problem, ...project.highlights, ...project.metrics, ...project.technologies, ...project.boundaries]) expect(html).toContain(escaped(text));
      for (const url of [project.repository, project.liveDemo].filter(Boolean)) expect(html).toContain(`href="${escaped(url)}" target="_blank" rel="noreferrer"`);
      if (project.hideHeaderImage) expect(html.split('</header>')[0]).not.toContain('<img');
    }
  });

  it('keeps real About photos, biography, and scholar/program wording', () => {
    const about = renderToStaticMarkup(createElement(AboutWindow, { onContact: noop }));
    for (const asset of ['event-portrait.webp', 'formal-event.jpg', 'thumbs-up.webp']) expect(about).toContain(asset);
    expect(about).toContain('My Christian faith');
    const experience = renderToStaticMarkup(createElement(ExperienceWindow));
    expect(experience).toContain('Scholar');
    expect(experience).toContain('Leadership');
    expect(experience).toContain('Certifications');
  });

  it('renders complete notes and AI disclosures with unique mobile control IDs', () => {
    for (const note of publishedFieldNotes) {
      const html = renderToStaticMarkup(createElement(FieldNotesWindow, { selectedSlug: note.slug, onSelectNote: noop, onBackToIndex: noop, idPrefix: 'mobile' }));
      for (const text of [...note.paragraphs, note.pinnedThought, note.aiUseNote, note.aiPrompt]) expect(html).toContain(escaped(text));
      expect(html).toContain('id="mobile-field-note-title"');
      expect(html).not.toContain('id="field-note-title"');
    }
  });

  it('retains desktop Contact IDs and scopes mobile labels without changing the email fallback', () => {
    for (const idPrefix of ['', 'mobile']) {
      const html = renderToStaticMarkup(createElement(ContactWindow, { closeRequest: 0, minimized: false, onClose: noop, idPrefix }));
      const id = `${idPrefix ? `${idPrefix}-` : ''}contact-first-name`;
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain('mailto:stanleyzebulonp@gmail.com');
    }
  });

  it('opens external mobile apps directly while preserving the default tablet button', () => {
    for (const id of ['github', 'linkedin']) {
      const app = portfolioAppById[id];
      const html = renderToStaticMarkup(createElement(MobileIcon, { app, onOpen: noop, directExternal: true }));
      expect(html).toContain(`href="${app.externalUrl}" target="_blank" rel="noopener noreferrer"`);
      expect(html).not.toContain('<button');
      expect(renderToStaticMarkup(createElement(MobileIcon, { app, onOpen: noop }))).toContain('<button');
    }
  });
});
