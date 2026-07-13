import { useEffect, useMemo, useRef, useState } from 'react';
import { projects, type Project } from '../data/projects';
import { awards, certifications, experience, leadership } from '../data/experience';
import { verseForDate } from '../data/verses';

type WindowId = 'intro' | 'about' | 'projects' | 'project-detail' | 'experience' | 'resume' | 'github' | 'linkedin';

const ESV_COPYRIGHT_NOTICE = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. ESV Text Edition: 2025. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated in whole or in part into any other language. Used by permission. All rights reserved.';

type WindowState = {
  id: WindowId;
  title: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
};

type DesktopItem = {
  id: Exclude<WindowId, 'intro' | 'project-detail'>;
  label: string;
  column: 1 | 2;
  row: number;
};

const DESKTOP_ITEMS: DesktopItem[] = [
  { id: 'projects', label: 'Projects', column: 1, row: 0 },
  { id: 'github', label: 'GitHub', column: 2, row: 0 },
  { id: 'about', label: 'About Me', column: 1, row: 1 },
  { id: 'linkedin', label: 'LinkedIn', column: 2, row: 1 },
  { id: 'experience', label: 'Experience', column: 1, row: 2 },
  { id: 'resume', label: 'Resume', column: 1, row: 3 }
];

const WINDOW_DEFAULTS: Record<WindowId, Omit<WindowState, 'z'>> = {
  intro: { id: 'intro', title: 'Welcome', open: true, minimized: false, maximized: false, x: 450, y: 150, width: 610, height: 460 },
  about: { id: 'about', title: 'About Me', open: false, minimized: false, maximized: false, x: 420, y: 110, width: 780, height: 590 },
  projects: { id: 'projects', title: 'Projects', open: false, minimized: false, maximized: true, x: 20, y: 40, width: 1180, height: 760 },
  'project-detail': { id: 'project-detail', title: 'Project', open: false, minimized: false, maximized: false, x: 260, y: 58, width: 1080, height: 720 },
  experience: { id: 'experience', title: 'Experience', open: false, minimized: false, maximized: false, x: 330, y: 70, width: 980, height: 720 },
  resume: { id: 'resume', title: 'Resume — Preview', open: false, minimized: false, maximized: false, x: 330, y: 55, width: 980, height: 740 },
  github: { id: 'github', title: 'GitHub', open: false, minimized: false, maximized: false, x: 520, y: 145, width: 650, height: 460 },
  linkedin: { id: 'linkedin', title: 'LinkedIn', open: false, minimized: false, maximized: false, x: 500, y: 125, width: 690, height: 500 }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = 0;
    const syncToLocalMinute = () => {
      window.clearTimeout(timer);
      const current = new Date();
      setNow(current);
      const millisecondsIntoMinute = current.getSeconds() * 1_000 + current.getMilliseconds();
      timer = window.setTimeout(syncToLocalMinute, 60_025 - millisecondsIntoMinute);
    };
    const syncWhenVisible = () => {
      if (!document.hidden) syncToLocalMinute();
    };

    syncToLocalMinute();
    window.addEventListener('focus', syncToLocalMinute);
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', syncToLocalMinute);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, []);
  return now;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);
  return reducedMotion;
}

function useTyping(text: string, enabled: boolean, reducedMotion: boolean, speed = 28) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!enabled) return;
    if (reducedMotion) {
      setTyped(text);
      return;
    }
    setTyped('');
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, enabled, reducedMotion, speed]);
  return typed;
}

function TrafficLights({ maximized, onClose, onMinimize, onMaximize }: { maximized: boolean; onClose: () => void; onMinimize: () => void; onMaximize: () => void }) {
  return (
    <div className="traffic-lights" aria-label="Window controls">
      <button className="traffic red" aria-label="Close window" onClick={onClose} />
      <button className="traffic yellow" aria-label="Minimize window" onClick={onMinimize} />
      <button className="traffic green" aria-label={maximized ? 'Restore window' : 'Maximize window'} onClick={onMaximize} />
    </div>
  );
}

function MacWindow({
  state,
  active,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  children
}: {
  state: WindowState;
  active: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  children: React.ReactNode;
}) {
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; width: number; height: number } | null>(null);

  if (!state.open || state.minimized) return null;

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (state.maximized || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, x: state.x, y: state.y };
    onFocus();
  };

  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const maxX = Math.max(8, window.innerWidth - state.width - 8);
    const maxY = Math.max(38, window.innerHeight - 72);
    onMove(
      clamp(dragRef.current.x + event.clientX - dragRef.current.startX, 8, maxX),
      clamp(dragRef.current.y + event.clientY - dragRef.current.startY, 34, maxY)
    );
  };

  const endDrag = () => { dragRef.current = null; };

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (state.maximized || window.innerWidth < 760) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { startX: event.clientX, startY: event.clientY, width: state.width, height: state.height };
    onFocus();
  };

  const resize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeRef.current) return;
    const width = clamp(resizeRef.current.width + event.clientX - resizeRef.current.startX, 420, window.innerWidth - state.x - 8);
    const height = clamp(resizeRef.current.height + event.clientY - resizeRef.current.startY, 300, window.innerHeight - state.y - 8);
    onResize(width, height);
  };

  const fittedWidth = `min(${state.width}px, calc(100vw - 16px))`;
  const fittedHeight = `min(${state.height}px, calc(100vh - 46px))`;
  const style = state.maximized
    ? { left: 8, top: 38, width: 'calc(100vw - 16px)', height: 'calc(100vh - 46px)', zIndex: state.z }
    : {
        left: `clamp(8px, ${state.x}px, calc(100vw - ${fittedWidth} - 8px))`,
        top: `clamp(38px, ${state.y}px, calc(100vh - ${fittedHeight} - 8px))`,
        width: fittedWidth,
        height: fittedHeight,
        zIndex: state.z
      };

  return (
    <section
      className={`mac-window ${active ? 'active' : ''} ${state.maximized ? 'maximized' : ''}`}
      style={style}
      role="dialog"
      aria-label={state.title}
      onPointerDown={onFocus}
    >
      <header className="window-titlebar" onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <TrafficLights maximized={state.maximized} onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} />
        <strong>{state.title}</strong>
        <span className="titlebar-spacer" />
      </header>
      <div className="window-body">{children}</div>
      {!state.maximized && (
        <button
          className="resize-handle"
          aria-label="Resize window"
          onPointerDown={beginResize}
          onPointerMove={resize}
          onPointerUp={() => { resizeRef.current = null; }}
          onPointerCancel={() => { resizeRef.current = null; }}
        />
      )}
    </section>
  );
}

function DesktopIcon({ item, selected, onSelect, onOpen }: { item: DesktopItem; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  return (
    <button
      className={`desktop-icon ${selected ? 'selected' : ''}`}
      style={{ '--desktop-column': item.column, '--desktop-row': item.row } as React.CSSProperties}
      onClick={(event) => { event.stopPropagation(); onSelect(); }}
      onDoubleClick={(event) => { event.stopPropagation(); onOpen(); }}
      onKeyDown={(event) => { if (event.key === 'Enter') onOpen(); }}
      aria-label={`${item.label}. Single click to select, double click to open.`}
    >
      <img src="/assets/folder.png" alt="" draggable={false} />
      <span>{item.label}</span>
    </button>
  );
}

function IntroWindow({ ready, reducedMotion, onEnter }: { ready: boolean; reducedMotion: boolean; onEnter: () => void }) {
  const copy = 'Welcome to my desktop. I’m Penuel (pronounced “peh-new-ehl”). I build thoughtful AI and digital products that make hard things clearer and more human. My work often centers on human-centered AI, product design, and healthcare—but I’m drawn to any problem where technology can help without losing sight of people.';
  const typed = useTyping(copy, ready, reducedMotion, 19);
  return (
    <div className="intro-content">
      <span className="eyebrow">WELCOME TO MY DESKTOP</span>
      <h1>Penuel Stanley-Zebulon</h1>
      <p className="typing-copy">{typed}<span className="typing-caret" aria-hidden="true">|</span></p>
      <p className="interaction-tip"><strong>Single-click</strong> to select a folder. <strong>Double-click</strong> to open it.</p>
      <button className="primary-button" onClick={onEnter}>Let’s explore</button>
    </div>
  );
}

function AboutWindow() {
  return (
    <div className="about-layout">
      <div className="about-copy">
        <span className="eyebrow">ABOUT ME</span>
        <h2>Builder. Learner. Problem solver.</h2>
        <p>
          My path began in Electrical Engineering, where I learned to see systems as connected parts with real consequences. Curiosity led me toward artificial intelligence and a question that still guides me: how can technology make difficult experiences clearer without taking people out of the process?
        </p>
        <p>
          My Christian faith grounds that work in love, service, and human dignity. It is why I build human-centered AI that respects judgment, communicates its limits, and serves rather than replaces. Much of that focus lives in healthcare AI, across patient communication, maternal referral workflows, medical imaging, biosignals, and healthcare data.
        </p>
        <p>
          Outside engineering, I find rhythm in music, playing piano, long runs, faith, and time with the people I care about.
        </p>
        <div className="about-actions">
          <a className="primary-button compact" href="mailto:stanleyzebulonp@gmail.com">Email me</a>
          <a className="secondary-button compact" href="https://github.com/iampenuel" target="_blank" rel="noreferrer">GitHub</a>
          <a className="secondary-button compact" href="https://www.linkedin.com/in/penuel-stanley-zebulon/" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </div>
      <div className="about-gallery" aria-label="Photos of Penuel">
        <img className="about-main-photo" src="/assets/photos/event-portrait.webp" alt="Penuel standing in a black cap and cardigan" />
        <div className="photo-strip">
          <img src="/assets/photos/formal-event.jpg" alt="Penuel wearing formal attire at an evening event" />
          <img src="/assets/photos/thumbs-up.webp" alt="Penuel giving a thumbs up" />
        </div>
      </div>
    </div>
  );
}

function ProjectsWindow({ onOpenProject }: { onOpenProject: (project: Project) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const groups: Array<'All Projects' | Project['folderGroup']> = ['All Projects', 'AI Agents', 'Data Engineering', 'Healthcare Workflow', 'Medical Imaging', 'Biosignals'];
  const [navigation, setNavigation] = useState<{ history: Array<'All Projects' | Project['folderGroup']>; index: number }>({
    history: ['All Projects'],
    index: 0
  });
  const group = navigation.history[navigation.index];
  const visible = projects.filter((project) => {
    const matchesGroup = group === 'All Projects' || project.folderGroup === group;
    const haystack = `${project.name} ${project.category} ${project.tagline}`.toLowerCase();
    return matchesGroup && haystack.includes(query.toLowerCase());
  });
  const selectedVisibleProject = visible.find((item) => item.id === selected);

  const openSelected = () => {
    if (selectedVisibleProject) onOpenProject(selectedVisibleProject);
  };

  const chooseGroup = (nextGroup: 'All Projects' | Project['folderGroup']) => {
    setNavigation((current) => {
      if (current.history[current.index] === nextGroup) return current;
      const history = [...current.history.slice(0, current.index + 1), nextGroup];
      return { history, index: history.length - 1 };
    });
    setSelected(null);
  };

  const navigateHistory = (direction: -1 | 1) => {
    setNavigation((current) => ({ ...current, index: current.index + direction }));
    setSelected(null);
  };

  return (
    <div className="finder-shell">
      <aside className="finder-sidebar">
        <div className="sidebar-heading">Favorites</div>
        {groups.map((item) => (
          <button className={group === item ? 'active' : ''} key={item} onClick={() => chooseGroup(item)}>
            <span className="sidebar-glyph">◆</span>{item}
          </button>
        ))}
      </aside>
      <main className="finder-main">
        <div className="finder-toolbar">
          <div className="toolbar-nav" aria-label="Project navigation">
            <button aria-label="Back" disabled={navigation.index === 0} onClick={() => navigateHistory(-1)}>‹</button>
            <button aria-label="Forward" disabled={navigation.index === navigation.history.length - 1} onClick={() => navigateHistory(1)}>›</button>
          </div>
          <h2>{group}</h2>
          <div className="finder-spacer" />
          <div className="view-toggle" aria-label="Project view">
            <button aria-label="Grid view" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>▦</button>
            <button aria-label="List view" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>☷</button>
          </div>
          <label className="finder-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" /></label>
          <button className="open-button" disabled={!selectedVisibleProject} onClick={openSelected}>Open</button>
        </div>
        <label className="mobile-project-filter">
          <span>Filter projects</span>
          <select value={group} onChange={(event) => chooseGroup(event.target.value as 'All Projects' | Project['folderGroup'])}>
            {groups.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className={`project-browser ${view}`} onClick={() => setSelected(null)}>
          {visible.map((project) => (
            <button
              className={`project-folder ${selected === project.id ? 'selected' : ''}`}
              key={project.id}
              onClick={(event) => { event.stopPropagation(); setSelected(project.id); }}
              onDoubleClick={(event) => { event.stopPropagation(); onOpenProject(project); }}
              onKeyDown={(event) => { if (event.key === 'Enter') onOpenProject(project); }}
            >
              <img src="/assets/folder.png" alt="" />
              <span className="project-name">{project.name}</span>
              {view === 'list' && <span className="project-category">{project.category}</span>}
            </button>
          ))}
        </div>
        <footer className="finder-status">{visible.length} projects · Single-click to select · Double-click to open</footer>
      </main>
    </div>
  );
}

function ProjectDetailWindow({ project }: { project: Project | null }) {
  if (!project) return <div className="empty-state">Choose a project folder.</div>;
  return (
    <article className="project-detail">
      <header className="project-hero">
        <div>
          <span className="eyebrow">{project.category}</span>
          <h2>{project.name}</h2>
          <p className="project-tagline">{project.tagline}</p>
        </div>
        <img src={project.image ?? '/assets/folder.png'} alt="" />
      </header>
      <div className="project-columns">
        <div className="project-story">
          <section><h3>Overview</h3><p>{project.overview}</p></section>
          <section><h3>The problem</h3><p>{project.problem}</p></section>
          <section><h3>What I built</h3><ul>{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h3>Safety and scope boundaries</h3><ul>{project.boundaries.map((item) => <li key={item}>{item}</li>)}</ul></section>
        </div>
        <aside className="project-facts">
          <section><h3>Evidence</h3>{project.metrics.map((item) => <div className="metric" key={item}>{item}</div>)}</section>
          <section><h3>Technologies</h3><div className="tag-cloud">{project.technologies.map((item) => <span key={item}>{item}</span>)}</div></section>
          <section className="project-links">
            <a className="primary-button compact" href={project.repository} target="_blank" rel="noreferrer">View GitHub</a>
            {project.liveDemo && <a className="secondary-button compact" href={project.liveDemo} target="_blank" rel="noreferrer">Open live demo</a>}
          </section>
        </aside>
      </div>
    </article>
  );
}

function ExperienceWindow() {
  const [tab, setTab] = useState<'Experience' | 'Leadership' | 'Awards' | 'Certifications'>('Experience');
  return (
    <div className="experience-shell">
      <nav className="tab-bar" aria-label="Experience sections">
        {(['Experience', 'Leadership', 'Awards', 'Certifications'] as const).map((item) => (
          <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </nav>
      <div className="experience-scroll">
        {tab === 'Experience' && (
          <div className="timeline">
            {experience.map((item) => (
              <article className={`experience-card ${item.emphasis === 'featured' ? 'featured' : ''}`} key={item.id}>
                {item.logo && <img src={item.logo} alt="" />}
                <div>
                  <span className="experience-date">{item.dates}</span>
                  <h3>{item.role}</h3>
                  <h4>{item.organization}</h4>
                  <p>{item.description}</p>
                  <ul>{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        )}
        {tab === 'Leadership' && leadership.map((item) => (
          <article className="simple-card leadership-card" key={item.organization}>
            <img className="section-logo" src={item.logo} alt="InterVarsity logo" />
            <div><span>{item.dates}</span><h3>{item.role}</h3><h4>{item.organization}</h4><p>{item.description}</p></div>
          </article>
        ))}
        {tab === 'Awards' && awards.map((item) => (
          <article className="award-card" key={item.title}><div className="award-logo"><img src={item.logo} alt="Penn State logo" /></div><div><span>{item.date} · {item.amount}</span><h3>{item.title}</h3><h4>{item.issuer}</h4><p>{item.description}</p></div></article>
        ))}
        {tab === 'Certifications' && (
          <div className="cert-grid">
            {certifications.map((item, index) => (
              <article className={`cert-card ${index === 0 ? 'featured' : ''}`} key={item.title}>
                <div className="cert-logo"><img src={item.logo} alt={`${item.issuer} logo`} /></div>
                <div><span>{item.date}</span><h3>{item.title}</h3><h4>{item.issuer}</h4>{item.description && <p>{item.description}</p>}</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResumeWindow() {
  return (
    <div className="resume-shell">
      <div className="resume-toolbar">
        <div><strong>Penuel_Stanley-Zebulon_Resume.pdf</strong><span>1 page</span></div>
        <a className="primary-button compact" href="/resume/Penuel_Stanley-Zebulon_Resume.pdf" download>Download PDF</a>
      </div>
      <object className="resume-object" data="/resume/Penuel_Stanley-Zebulon_Resume.pdf" type="application/pdf">
        <img src="/assets/resume-preview.png" alt="Preview of Penuel Stanley-Zebulon's resume" />
      </object>
    </div>
  );
}

function SocialProfile({ kind }: { kind: 'github' | 'linkedin' }) {
  const isGitHub = kind === 'github';
  return (
    <div className="social-profile">
      <img src={isGitHub ? '/assets/github-profile.png' : '/assets/photos/formal-closeup.webp'} alt="Penuel Stanley-Zebulon" />
      <div className="social-copy">
        <span className="eyebrow">{isGitHub ? 'GITHUB PROFILE' : 'LINKEDIN PROFILE'}</span>
        <h2>Penuel Stanley-Zebulon</h2>
        <p>{isGitHub ? '@iampenuel · Healthcare AI, multimodal agents, data systems, medical imaging, and responsible product engineering.' : 'AI at Penn State · Healthcare AI · Human-centered AI systems · AWS AI/ML Scholar · SAP Certified.'}</p>
        <a className="primary-button" href={isGitHub ? 'https://github.com/iampenuel' : 'https://www.linkedin.com/in/penuel-stanley-zebulon/'} target="_blank" rel="noreferrer">
          Open {isGitHub ? 'GitHub' : 'LinkedIn'}
        </a>
      </div>
    </div>
  );
}

export default function PortfolioDesktop() {
  const [booting, setBooting] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [zCounter, setZCounter] = useState(20);
  const [windows, setWindows] = useState<Record<WindowId, WindowState>>(() => {
    return Object.fromEntries(Object.entries(WINDOW_DEFAULTS).map(([id, state], index) => [id, { ...state, z: 10 + index }])) as Record<WindowId, WindowState>;
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [windowMenuOpen, setWindowMenuOpen] = useState(false);
  const [scriptureAttributionOpen, setScriptureAttributionOpen] = useState(false);
  const scriptureAttributionDialogRef = useRef<HTMLDialogElement>(null);
  const scriptureAttributionTriggerRef = useRef<HTMLButtonElement>(null);
  const now = useClock();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setBooting(false);
      return;
    }
    const timer = window.setTimeout(() => setBooting(false), 1350);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    const dialog = scriptureAttributionDialogRef.current;
    if (!dialog) return;
    if (scriptureAttributionOpen && !dialog.open) dialog.showModal();
    if (!scriptureAttributionOpen && dialog.open) dialog.close();
  }, [scriptureAttributionOpen]);

  const verse = useMemo(() => verseForDate(now), [now]);
  const activeWindow = useMemo(() => Object.values(windows).filter((item) => item.open && !item.minimized).sort((a, b) => b.z - a.z)[0]?.id, [windows]);

  const updateWindow = (id: WindowId, patch: Partial<WindowState>) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  const focusWindow = (id: WindowId) => {
    const next = zCounter + 1;
    setZCounter(next);
    updateWindow(id, { z: next, minimized: false });
  };

  const openWindow = (id: WindowId) => {
    const next = zCounter + 1;
    setZCounter(next);
    setWindows((current) => ({
      ...current,
      [id]: { ...current[id], open: true, minimized: false, z: next, maximized: id === 'projects' ? true : current[id].maximized }
    }));
    setSelectedIcon(id);
    setContextMenu(null);
    setWindowMenuOpen(false);
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    const next = zCounter + 1;
    setZCounter(next);
    setWindows((current) => ({
      ...current,
      'project-detail': { ...current['project-detail'], title: project.name, open: true, minimized: false, z: next }
    }));
  };

  const closeWindow = (id: WindowId) => updateWindow(id, { open: false, minimized: false });
  const minimizeWindow = (id: WindowId) => updateWindow(id, { minimized: true });
  const maximizeWindow = (id: WindowId) => updateWindow(id, { maximized: !windows[id].maximized });

  const resetDesktop = () => {
    setSelectedIcon(null);
    setSelectedProject(null);
    setContextMenu(null);
    setWindows(Object.fromEntries(Object.entries(WINDOW_DEFAULTS).map(([id, state], index) => [id, { ...state, open: id === 'intro', z: 10 + index }])) as Record<WindowId, WindowState>);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: clamp(event.clientX, 8, window.innerWidth - 230), y: clamp(event.clientY, 38, window.innerHeight - 230) });
  };

  return (
    <main className="desktop" onClick={() => { setSelectedIcon(null); setContextMenu(null); setWindowMenuOpen(false); }} onContextMenu={handleContextMenu}>
      <div className={`boot-screen ${booting ? 'visible' : ''}`} aria-hidden={!booting}>
        <div className="boot-mark"><img src="/assets/github-profile.png" alt="" /></div>
        <div className="boot-progress"><span /></div>
      </div>

      <header className="menu-bar">
        <div className="menu-left">
          <strong className="menu-name">Penuel</strong>
          <button onClick={(event) => { event.stopPropagation(); openWindow('about'); }}>Portfolio</button>
          <button onClick={(event) => { event.stopPropagation(); openWindow('projects'); }}>File</button>
          <button onClick={(event) => { event.stopPropagation(); setWindowMenuOpen(!windowMenuOpen); }}>Window</button>
          <a href="mailto:stanleyzebulonp@gmail.com">Contact</a>
        </div>
        <div className="menu-right">
          <span aria-label="Silent mode">◖</span>
          <span suppressHydrationWarning>{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</span>
          <span suppressHydrationWarning>{new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(now)}</span>
        </div>
        {windowMenuOpen && (
          <div className="window-menu" onClick={(event) => event.stopPropagation()}>
            <strong>Open windows</strong>
            {Object.values(windows).filter((item) => item.open).map((item) => (
              <button key={item.id} onClick={() => focusWindow(item.id)}>
                <span>{item.minimized ? '▭' : '●'}</span>{item.title}
              </button>
            ))}
            {!Object.values(windows).some((item) => item.open) && <p>No open windows</p>}
          </div>
        )}
      </header>

      <section className="desktop-area" aria-label="Penuel's portfolio desktop">
        {DESKTOP_ITEMS.map((item) => (
          <DesktopIcon
            key={item.id}
            item={item}
            selected={selectedIcon === item.id}
            onSelect={() => { setSelectedIcon(item.id); setContextMenu(null); setWindowMenuOpen(false); }}
            onOpen={() => openWindow(item.id)}
          />
        ))}

        <aside className="verse-widget" onClick={(event) => event.stopPropagation()} aria-label={`Verse of the day: ${verse.reference}`} suppressHydrationWarning>
          <div className="verse-top"><span className="sun-glyph">☀</span><div><small>VERSE OF THE DAY</small><strong suppressHydrationWarning>{verse.reference} · {verse.translation}</strong></div></div>
          <p suppressHydrationWarning>{verse.excerpt}</p>
          <div className="verse-footer">
            <span className="verse-note">Curated daily rotation</span>
            <button
              ref={scriptureAttributionTriggerRef}
              className="verse-attribution-trigger"
              type="button"
              aria-haspopup="dialog"
              aria-controls="esv-scripture-attribution"
              onClick={() => setScriptureAttributionOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setScriptureAttributionOpen(true);
                }
              }}
            >
              ESV Scripture attribution
            </button>
          </div>
        </aside>

        <dialog
          ref={scriptureAttributionDialogRef}
          id="esv-scripture-attribution"
          className="esv-attribution-dialog"
          aria-labelledby="esv-attribution-title"
          onCancel={(event) => {
            event.preventDefault();
            setScriptureAttributionOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setScriptureAttributionOpen(false);
            }
          }}
          onClose={() => {
            setScriptureAttributionOpen(false);
            scriptureAttributionTriggerRef.current?.focus();
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="esv-attribution-panel">
            <span className="eyebrow">SCRIPTURE ATTRIBUTION</span>
            <h2 id="esv-attribution-title">English Standard Version</h2>
            <p>{ESV_COPYRIGHT_NOTICE}</p>
            <button className="secondary-button compact" type="button" autoFocus onClick={() => setScriptureAttributionOpen(false)}>Close</button>
          </div>
        </dialog>

        {windows.about.open && !windows.about.minimized && (
          <>
            <div className="about-portrait-reveal" style={{ zIndex: Math.max(18, windows.about.z - 1) }}>
              <img src="/assets/photos/formal-full.webp" alt="Penuel standing with arms crossed" />
              <span>Building with purpose.</span>
            </div>
            <div
              className="about-photo-float-right"
              style={{
                left: `clamp(8px, ${windows.about.x + windows.about.width - 40}px, calc(100vw - 206px))`,
                zIndex: windows.about.z + 1
              }}
            >
              <img src="/assets/photos/event-fun.webp" alt="Penuel enjoying an event" />
            </div>
          </>
        )}

        {(Object.keys(windows) as WindowId[]).map((id) => (
          <MacWindow
            key={id}
            state={windows[id]}
            active={activeWindow === id}
            onFocus={() => focusWindow(id)}
            onClose={() => closeWindow(id)}
            onMinimize={() => minimizeWindow(id)}
            onMaximize={() => maximizeWindow(id)}
            onMove={(x, y) => updateWindow(id, { x, y })}
            onResize={(width, height) => updateWindow(id, { width, height })}
          >
            {id === 'intro' && <IntroWindow ready={!booting} reducedMotion={reducedMotion} onEnter={() => closeWindow('intro')} />}
            {id === 'about' && <AboutWindow />}
            {id === 'projects' && <ProjectsWindow onOpenProject={openProject} />}
            {id === 'project-detail' && <ProjectDetailWindow project={selectedProject} />}
            {id === 'experience' && <ExperienceWindow />}
            {id === 'resume' && <ResumeWindow />}
            {id === 'github' && <SocialProfile kind="github" />}
            {id === 'linkedin' && <SocialProfile kind="linkedin" />}
          </MacWindow>
        ))}

        {contextMenu && (
          <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
            <button onClick={() => openWindow('about')}>About This Portfolio</button>
            <button onClick={() => openWindow('projects')}>Open Projects</button>
            <button onClick={() => openWindow('resume')}>Preview Resume</button>
            <a href="/resume/Penuel_Stanley-Zebulon_Resume.pdf" download>Download Resume</a>
            <hr />
            <button onClick={resetDesktop}>Reset Desktop</button>
          </div>
        )}

        <p className="copyright-signature" suppressHydrationWarning>
          © {new Date().getFullYear()} | PENUEL STANLEY-ZEBULON
        </p>
      </section>
    </main>
  );
}
