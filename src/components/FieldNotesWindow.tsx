import { useEffect, useRef, useState } from 'react';
import { publishedFieldNotes } from '../data/fieldNotes';

const FIELD_NOTES_ORIGIN = 'https://iampenuel.vercel.app';

type FieldNotesWindowProps = {
  selectedSlug: string | null;
  idPrefix?: string;
  onSelectNote: (slug: string) => void;
  onBackToIndex: () => void;
};

export function FieldNotesWindow({ selectedSlug, onSelectNote, onBackToIndex, idPrefix = '' }: FieldNotesWindowProps) {
  const scopedId = (id: string) => idPrefix ? `${idPrefix}-${id}` : id;
  const [copyStatus, setCopyStatus] = useState<'copied' | 'fallback' | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const selectedNote = publishedFieldNotes.find((note) => note.slug === selectedSlug) ?? null;
  const noteCount = `${publishedFieldNotes.length} ${publishedFieldNotes.length === 1 ? 'note' : 'notes'}`;

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
      <header className="field-notes-toolbar" aria-label="Field Notes toolbar">
        <div className="field-notes-toolbar-library">
          <span className="field-notes-toolbar-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>Field Notes</strong>
            <small>{noteCount}</small>
          </span>
        </div>
        <div className="field-notes-toolbar-note">
          {selectedNote && (
            <>
              <span className="field-notes-toolbar-context">{selectedNote.week}</span>
              <div className="field-notes-toolbar-actions">
                <span className="field-note-copy-status" role="status" aria-live="polite">
                  {copyStatus === 'copied' && 'Link copied.'}
                  {copyStatus === 'fallback' && 'Copy manually below.'}
                </span>
                <button type="button" onClick={copyLink}>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M5.25 6.25h-1.5A1.75 1.75 0 0 0 2 8v4.25C2 13.22 2.78 14 3.75 14H8c.97 0 1.75-.78 1.75-1.75v-1.5M6.25 5.25v-1.5C6.25 2.78 7.03 2 8 2h4.25c.97 0 1.75.78 1.75 1.75V8c0 .97-.78 1.75-1.75 1.75h-1.5M8.5 7.5l4-4m-2.75 0H12.5v2.75" />
                  </svg>
                  <span>Copy link</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <aside className="field-notes-list" aria-label="Field Notes entries">
        <header className="field-notes-identity">
          <h2>Notes</h2>
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
              <strong>{note.title}</strong>
              <span className="field-note-list-meta">
                <span className="field-note-week">{note.week}</span>
                <time>{note.date}</time>
              </span>
              <span className="field-note-list-preview">{note.paragraphs[0]}</span>
              {selectedNote?.slug === note.slug && <span className="sr-only">Selected note</span>}
            </button>
          ))}
        </nav>
      </aside>

      <section className="field-note-reader" aria-label="Field Note reader">
        {selectedNote ? (
          <article ref={articleRef} tabIndex={-1} aria-labelledby={scopedId('field-note-title')}>
            <button className="field-notes-back" type="button" onClick={onBackToIndex}>‹ Back to Field Notes</button>
            <header className="field-note-header">
              <time>{selectedNote.date}</time>
              <span>{selectedNote.week}</span>
              <h1 id={scopedId('field-note-title')}>{selectedNote.title}</h1>
            </header>

            {copyStatus === 'fallback' && (
              <p className="field-note-copy-fallback">
                Copy this URL: <a href={`${FIELD_NOTES_ORIGIN}/field-notes/${selectedNote.slug}`}>{FIELD_NOTES_ORIGIN}/field-notes/{selectedNote.slug}</a>
              </p>
            )}

            <aside className="field-note-pinned" aria-label="Pinned thought">
              <span>PINNED THOUGHT</span>
              <p>{selectedNote.pinnedThought}</p>
            </aside>

            <div className="field-note-reflection">
              {selectedNote.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            <section className="field-note-ai-use" aria-labelledby={scopedId('field-note-ai-heading')}>
              <h2 id={scopedId('field-note-ai-heading')}>AI USE</h2>
              <p>{selectedNote.aiUseNote}</p>
              <details>
                <summary>View prompt</summary>
                <div className="field-note-prompt">
                  <h3>Prompt used</h3>
                  <p>{selectedNote.aiPrompt}</p>
                </div>
              </details>
            </section>
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
