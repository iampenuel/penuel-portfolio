import { resumeDocument } from '../../data/resumeDocument';

export function ResumePreviewWidget({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="mobile-resume-widget" type="button" onClick={onOpen} aria-label="View Resume">
      <span className="mobile-resume-widget-title">Resume</span>
      <span className="mobile-resume-widget-paper">
        <img src={resumeDocument.preview} alt="Top portion of Penuel Stanley-Zebulon's actual resume" width={resumeDocument.previewWidth} height={resumeDocument.previewHeight} />
      </span>
      <span className="mobile-resume-widget-caption">
        <strong>{resumeDocument.name}</strong>
        <span>View Resume <span aria-hidden="true">↗</span></span>
      </span>
    </button>
  );
}
