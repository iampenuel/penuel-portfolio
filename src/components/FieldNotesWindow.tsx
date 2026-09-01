import { useEffect, useRef, useState } from 'react';
import { publishedFieldNotes } from '../data/fieldNotes';

const FIELD_NOTES_ORIGIN = 'https://iampenuel.vercel.app';

type FieldNotesWindowProps = {
  selectedSlug: string | null;
  onSelectNote: (slug: string) => void;
  onBackToIndex: () => void;
};

export function FieldNotesWindow({ selectedSlug, onSelectNote, onBackToIndex }: FieldNotesWindowProps) {
  const [copyStatus, setCopyStatus] = useState<'copied' | 'fallback' | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const selectedNote = publishedFieldNotes.find((note) => note.slug === selectedSlug) ?? null;

  useEffect(() => {
    setCopyStatus(null);
    if (selectedNote) articleRef.current?.focus({ preventScroll: true });
  }, [selectedNote]);

  const copyLink = async () => {
    if (!selectedNote) return;
    const url = `${FIELD_NOTES_ORIGIN}/field-notes/${selectedNote.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus(null), 2_000);
    } catch {
      setCopyStatus('fallback');
    }
  };

  return (
    <div className={`field-notes-shell ${selectedNote ? 'reading-note' : 'browsing-notes'}`}>
      <aside className="field-notes-list" aria-label="Field Notes entries">
        <header className="field-notes-identity">
          <span className="eyebrow">FIELD NOTES</span>
          <h2>Field Notes</h2>
          <p>Things I’m learning, questioning, building, and trying not to forget.</p>
        </header>
        <nav aria-label="Published Field Notes">
          {publishedFieldNotes.map((note) => (
            <button
              className={selectedNote?.slug === note.slug ? 'active' : ''}
              key={note.slug}
              type="button"
              aria-current={selectedNote?.slug === note.slug ? 'page' : undefined}
              onClick={() => onSelectNote(note.slug)}
            >
              <span className="field-note-week">{note.week}</span>
              <strong>{note.title}</strong>
              <time>{note.date}</time>
              {selectedNote?.slug === note.slug && <span className="sr-only">Selected note</span>}
            </button>
          ))}
        </nav>
      </aside>

      <section className="field-note-reader" aria-label="Field Note reader">
        {selectedNote ? (
          <article ref={articleRef} tabIndex={-1} aria-labelledby="field-note-title">
            <button className="field-notes-back" type="button" onClick={onBackToIndex}>‹ Back to Field Notes</button>
            <header className="field-note-header">
              <div>
                <span>{selectedNote.week}</span>
                <time>{selectedNote.date}</time>
              </div>
              <h1 id="field-note-title">{selectedNote.title}</h1>
            </header>

            <aside className="field-note-pinned" aria-label="Pinned thought">
              <span>PINNED THOUGHT</span>
              <p>{selectedNote.pinnedThought}</p>
            </aside>

            <div className="field-note-reflection">
              {selectedNote.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <section className="field-note-ai-use" aria-labelledby="field-note-ai-heading">
              <h2 id="field-note-ai-heading">AI USE</h2>
              <p>{selectedNote.aiUseNote}</p>
              <details>
                <summary>View prompt</summary>
                <div className="field-note-prompt">
                  <h3>Prompt used</h3>
                  <p>{selectedNote.aiPrompt}</p>
                </div>
              </details>
            </section>

            <footer className="field-note-actions">
              <button type="button" onClick={copyLink}>Copy link</button>
              <span className="field-note-copy-status" role="status" aria-live="polite">
                {copyStatus === 'copied' && 'Link copied.'}
                {copyStatus === 'fallback' && (
                  <>Copy this URL: <a href={`${FIELD_NOTES_ORIGIN}/field-notes/${selectedNote.slug}`}>{FIELD_NOTES_ORIGIN}/field-notes/{selectedNote.slug}</a></>
                )}
              </span>
            </footer>
          </article>
        ) : (
          <div className="field-note-empty">
            <span className="eyebrow">FIELD NOTES</span>
            <h2>Choose a note to read.</h2>
            <p>One entry, kept carefully. More will be added when they are ready.</p>
          </div>
        )}
      </section>
    </div>
  );
}
