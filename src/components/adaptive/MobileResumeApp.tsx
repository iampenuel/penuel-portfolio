import { resumeDocument } from '../../data/resumeDocument';

export function MobileResumeApp({ onHome }: { onHome: () => void }) {
  return (
    <section className="mobile-resume-app" aria-labelledby="mobile-resume-title">
      <nav className="mobile-app-host-nav" aria-label="Resume navigation">
        <button type="button" onClick={onHome}>‹ Home</button>
        <h1 id="mobile-resume-title">Resume</h1>
      </nav>
      <div className="mobile-resume-actions">
        <a href={resumeDocument.url} target="_blank" rel="noopener noreferrer">Open PDF <span aria-hidden="true">↗</span></a>
        <a href={resumeDocument.url} download>Download PDF</a>
      </div>
      <p className="mobile-resume-document-meta">{resumeDocument.name} · 1 page</p>
      <a className="mobile-resume-document" href={resumeDocument.url} target="_blank" rel="noopener noreferrer" aria-label="Open full resume PDF in a new tab">
        <img src={resumeDocument.preview} alt={resumeDocument.previewAlt} width="1313" height="1700" />
      </a>
      <p className="mobile-resume-document-hint">Open PDF for the full document viewer and zoom controls.</p>
    </section>
  );
}
