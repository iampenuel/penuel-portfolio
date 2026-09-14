import { resumeDocument } from '../../data/resumeDocument';

export function ResumePreviewWidget({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="mobile-resume-widget" type="button" onClick={onOpen} aria-label="View Resume">
      <span className="mobile-widget-label">Resume</span>
      <img src={resumeDocument.preview} alt={resumeDocument.previewAlt} width="1313" height="1700" />
      <span className="mobile-resume-widget-caption">
        <strong>{resumeDocument.name}</strong>
        <span>View Resume <span aria-hidden="true">↗</span></span>
      </span>
    </button>
  );
}
