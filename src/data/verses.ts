export type Verse = {
  reference: string;
  excerpt: string;
  translation: 'NIV';
};

// Brief NIV excerpts are used in this starter. Replace them with your licensed
// full-verse text later if desired. The rotation is deterministic by calendar day.
export const verses: Verse[] = [
  { reference: 'John 3:16', excerpt: 'For God so loved the world...', translation: 'NIV' },
  { reference: 'Romans 8:28', excerpt: 'God works for the good...', translation: 'NIV' },
  { reference: 'Romans 5:8', excerpt: 'Christ died for us.', translation: 'NIV' },
  { reference: '1 John 4:19', excerpt: 'He first loved us.', translation: 'NIV' },
  { reference: '1 John 4:16', excerpt: 'God is love.', translation: 'NIV' }
];
