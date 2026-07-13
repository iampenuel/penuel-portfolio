export type Verse = {
  reference: string;
  excerpt: string;
  translation: 'NIV';
};

// The rotation is deterministic by local calendar day and contains only Penuel's
// curated verse references.
export const verses: Verse[] = [
  {
    reference: 'John 3:16',
    excerpt: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    translation: 'NIV'
  },
  {
    reference: 'Romans 8:28',
    excerpt: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    translation: 'NIV'
  },
  {
    reference: 'Romans 5:8',
    excerpt: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
    translation: 'NIV'
  },
  {
    reference: '1 John 4:19',
    excerpt: 'We love because he first loved us.',
    translation: 'NIV'
  },
  {
    reference: '1 John 4:16',
    excerpt: 'And so we know and rely on the love God has for us. God is love. Whoever lives in love lives in God, and God in them.',
    translation: 'NIV'
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
