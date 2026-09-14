import { useEffect, useRef, useState } from 'react';
import { portfolioAppById, type PortfolioAppId } from '../../data/portfolioApps';
import { projects, type Project } from '../../data/projects';
import { fieldNotePath, type PortfolioRoute } from '../../lib/portfolioRoutes';
import { AboutWindow, ExperienceWindow, ProjectDetailWindow } from '../PortfolioContent';
import { ContactWindow } from '../ContactWindow';
import { FieldNotesWindow } from '../FieldNotesWindow';
import { RickrollPlayer } from '../RickrollPlayer';
import { MobileResumeApp } from './MobileResumeApp';

export function MobileAppHost({ appId, route, onHome, onNavigate, onOpenApp, isActive, reducedMotion }: {
  appId: PortfolioAppId;
  route: PortfolioRoute;
  onHome: () => void;
  onNavigate: (pathname: string) => void;
  onOpenApp: (id: PortfolioAppId) => void;
  isActive: boolean;
  reducedMotion: boolean;
}) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contactCloseRequest, setContactCloseRequest] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    if (isActive && appId !== 'contact') titleRef.current?.focus({ preventScroll: true });
  }, [appId, selectedProject, route.fieldNoteSlug, isActive]);

  if (appId === 'resume') return <MobileResumeApp onHome={onHome} />;
  const app = portfolioAppById[appId];
  const pane = ['contact', 'experience', 'field-notes', 'definitely-important'].includes(appId);

  return (
    <section className="mobile-content-app" aria-labelledby="mobile-content-title">
      <nav className="mobile-content-nav" aria-label={`${app.label} navigation`}>
        <button type="button" onClick={() => appId === 'contact' ? setContactCloseRequest((count) => count + 1) : onHome()}>‹ Home</button>
        <h1 id="mobile-content-title" ref={titleRef} tabIndex={-1}>{app.label}</h1>
        {selectedProject && <button type="button" onClick={() => setSelectedProject(null)}>‹ Projects</button>}
      </nav>
      <div ref={contentRef} className={`mobile-content-body${pane ? ' mobile-content-body--pane' : ''}`}>
        {appId === 'projects' && (selectedProject ? <ProjectDetailWindow project={selectedProject} /> : (
          <div className="mobile-project-list" aria-label="Portfolio projects">
            {projects.map((project) => (
              <button className="mobile-project-entry" key={project.id} type="button" onClick={() => setSelectedProject(project)} aria-label={`Open ${project.name}`}>
                {project.image && <img src={project.image} alt={project.imageAlt ?? ''} loading="lazy" />}
                <span><strong>{project.name}</strong><small>{project.category}</small><span>{project.tagline}</span></span>
              </button>
            ))}
          </div>
        ))}
        {appId === 'about-me' && <AboutWindow onContact={() => onOpenApp('contact')} />}
        {appId === 'experience' && <ExperienceWindow />}
        {appId === 'field-notes' && <FieldNotesWindow idPrefix="mobile" selectedSlug={route.fieldNoteSlug} onSelectNote={(slug) => onNavigate(fieldNotePath(slug))} onBackToIndex={() => onNavigate(fieldNotePath())} />}
        {appId === 'contact' && <ContactWindow idPrefix="mobile" closeRequest={contactCloseRequest} minimized={!isActive} onClose={onHome} />}
        {appId === 'definitely-important' && <RickrollPlayer idPrefix="mobile" minimized={!isActive} reducedMotion={reducedMotion} onClose={onHome} playLabel="Play video" />}
      </div>
    </section>
  );
}
