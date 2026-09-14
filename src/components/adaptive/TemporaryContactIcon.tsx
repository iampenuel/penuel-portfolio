/**
 * TEMPORARY: replace the Contact registry icon mapping with the approved PNG
 * once it is supplied. This component must not ship to master.
 */
export function TemporaryContactIcon() {
  return (
    <span className="temporary-contact-icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" focusable="false">
        <path d="M13 14.5h38a7 7 0 0 1 7 7v21a7 7 0 0 1-7 7H31L18.5 57v-7.5H13a7 7 0 0 1-7-7v-21a7 7 0 0 1 7-7Z" />
      </svg>
    </span>
  );
}
