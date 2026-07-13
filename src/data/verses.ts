export type Verse = {
  reference: string;
  excerpt: string;
  translation: 'ESV';
};

// The rotation is deterministic by local calendar day and contains only Penuel's
// curated verse references.
export const verses: Verse[] = [
  {
    reference: 'John 3:16',
    excerpt: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    translation: 'ESV'
  },
  {
    reference: 'Romans 8:28',
    excerpt: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
    translation: 'ESV'
  },
  {
    reference: 'Romans 5:8',
    excerpt: 'but God shows his love for us in that while we were still sinners, Christ died for us.',
    translation: 'ESV'
  },
  {
    reference: '1 John 4:19',
    excerpt: 'We love because he first loved us.',
    translation: 'ESV'
  },
  {
    reference: '1 John 4:16',
    excerpt: 'So we have come to know and to believe the love that God has for us. God is love, and whoever abides in love abides in God, and God abides in him.',
    translation: 'ESV'
  }
];

const DAY_IN_MILLISECONDS = 86_400_000;
const ROTATION_START = Date.UTC(2026, 6, 13);

export function verseForDate(date: Date): Verse {
  const localCalendarDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceRotationStart = Math.floor((localCalendarDay - ROTATION_START) / DAY_IN_MILLISECONDS);
  const index = ((daysSinceRotationStart % verses.length) + verses.length) % verses.length;
  return verses[index];
}
