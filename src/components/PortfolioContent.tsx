import { useState } from 'react';
import type { Project } from '../data/projects';
import { awards, certifications, experience, leadership } from '../data/experience';

export function AboutWindow({ onContact }: { onContact: () => void }) {
  return (
    <div className="about-layout">
      <div className="about-copy">
        <span className="eyebrow">ABOUT ME</span>
        <h2>Builder. Learner. Problem solver.</h2>
        <p>
          My path began in Electrical Engineering, where I learned to see systems as connected parts with real consequences. Curiosity pulled me toward artificial intelligence and a question that still guides me: how can technology make difficult experiences clearer without taking people out of the process?
        </p>
        <p>
          My Christian faith grounds that work in love, service, and human dignity. It is why I build human-centered AI that respects judgment, communicates its limits, and serves rather than replaces. Much of that focus lives in healthcare AI, across patient communication, maternal referral workflows, medical imaging, biosignals, and healthcare data.
        </p>
        <p>
          Outside engineering, I am almost never without my Kindle and my Bible. I really enjoy reading. There is something calming about slowing down, getting lost in a book, and letting a new idea sit with me for a while. I also find rhythm in music, playing piano, long runs, and time with the people I care about.
        </p>
        <div className="about-actions">
          <button className="primary-button compact" type="button" onClick={onContact}>Email me</button>
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

export function ProjectDetailWindow({ project }: { project: Project | null }) {
  if (!project) return <div className="empty-state">Choose a project folder.</div>;
  return (
    <article className="project-detail">
      <header className="project-hero">
        <div>
          <span className="eyebrow">{project.category}</span>
          <h2>{project.name}</h2>
          <p className="project-tagline">{project.tagline}</p>
        </div>
        {!project.hideHeaderImage && <img src={project.image ?? '/assets/folder.png'} alt={project.imageAlt ?? ''} />}
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
            {project.liveDemoPrimary && project.liveDemo ? (
              <>
                <a className="primary-button compact" href={project.liveDemo} target="_blank" rel="noreferrer">{project.liveDemoLabel ?? 'Open live demo'}</a>
                <a className="secondary-button compact" href={project.repository} target="_blank" rel="noreferrer">View GitHub</a>
              </>
            ) : (
              <>
                <a className="primary-button compact" href={project.repository} target="_blank" rel="noreferrer">View GitHub</a>
                {project.liveDemo && <a className="secondary-button compact" href={project.liveDemo} target="_blank" rel="noreferrer">{project.liveDemoLabel ?? 'Open live demo'}</a>}
              </>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}

export function ExperienceWindow() {
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
