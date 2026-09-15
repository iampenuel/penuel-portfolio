/** Fit the real verse copy first, retaining a useful square on short phones. */
export function verseArtworkSize(width: number, height: number, copyHeight: number, gap: number) {
  return Math.min(width, Math.max(Math.min(240, width), height - copyHeight - gap));
}

/** Snap to the actual rendered page, including fractional rail widths. */
export function homePageOffset(offsets: number[], page: number) {
  return (offsets[page] ?? offsets[0] ?? 0) - (offsets[0] ?? 0);
}

/** Follow browser chrome/keyboard, but never reflow the layout to defeat pinch zoom. */
export function phoneVisibleHeight(layoutHeight: number, viewport?: { height: number; offsetTop: number; scale: number }) {
  if (!viewport) return layoutHeight;
  if (Math.abs(viewport.scale - 1) > 0.01 || viewport.height <= 0) return null;
  return Math.min(layoutHeight, viewport.height + Math.max(0, viewport.offsetTop));
}
