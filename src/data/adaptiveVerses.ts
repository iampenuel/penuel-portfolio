import manifest from './adaptive-verse-manifest.json' with { type: 'json' };

export type AdaptiveVerse = Readonly<{
  id: string;
  reference: string;
  text: string;
  artwork: string;
}>;

/** Supplied mobile artwork/text only; the existing shared local-day rotation stays unchanged. */
export const adaptiveVerses: readonly AdaptiveVerse[] = manifest.verses.map((entry) => ({
  id: entry.id,
  reference: entry.reference,
  text: entry.text,
  artwork: entry.asset.replace('production-assets/', '/assets/mobile/')
}));

export function adaptiveVerseForReference(reference: string): AdaptiveVerse | null {
  return adaptiveVerses.find((verse) => verse.reference === reference) ?? null;
}
