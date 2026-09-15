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

/** Reserve the rendered controls and the shell's existing bottom inset exactly once. */
export function reflectionContentRegion({ contentTop, controlsTop, controlsBottom, shellBottom, bottomInset, viewportBottom }: {
  contentTop: number;
  controlsTop?: number;
  controlsBottom?: number;
  shellBottom: number;
  bottomInset: number;
  viewportBottom: number;
}) {
  // Immersive Page 2 has no controls: reserve only the existing safe/browser bottom inset.
  const controlsHeight = controlsTop !== undefined && controlsBottom !== undefined
    ? Math.max(0, controlsBottom - controlsTop) : 0;
  const persistentControlsHeight = controlsHeight + bottomInset;
  // A stale layout viewport or grid measurement must never extend content under controls.
  const contentBottom = Math.min(controlsTop ?? Infinity, Math.min(shellBottom, viewportBottom) - persistentControlsHeight);
  return { persistentControlsHeight, contentHeight: Math.max(0, contentBottom - contentTop) };
}

/** Pick the widest shared rail that fits, allowing at most an 8% reduction. */
export function fittedVerseRailWidth(fullWidth: number, availableHeight: number, measureHeight: (width: number) => number) {
  if (measureHeight(fullWidth) <= availableHeight) return fullWidth;
  for (let width = fullWidth - 1; width >= fullWidth * 0.92; width -= 1) {
    // Measure real wrapping: narrower copy can be taller, so do not assume monotonicity.
    if (measureHeight(width) <= availableHeight) return width;
  }
  // Preserve substantial, full-width cards when fitting would require a larger sacrifice.
  return fullWidth;
}
