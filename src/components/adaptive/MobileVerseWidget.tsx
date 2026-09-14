import type { AdaptiveVerse } from '../../data/adaptiveVerses';

const ESV_COPYRIGHT_NOTICE = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. ESV Text Edition: 2025. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated in whole or in part into any other language. Used by permission. All rights reserved.';

export function MobileVerseWidget({ verse }: { verse: AdaptiveVerse | null }) {
  return (
    <article className="mobile-verse-widget" aria-labelledby="mobile-verse-title">
      <div className="mobile-verse-artwork">
        {verse && <img src={verse.artwork} alt={`Provided artwork for ${verse.reference}`} width="1254" height="1254" decoding="async" />}
      </div>
      <div className="mobile-verse-copy">
        <p className="mobile-widget-label">Verse of the Day</p>
        <h2 id="mobile-verse-title">{verse?.reference ?? '—'} <span>· ESV</span></h2>
        <blockquote>{verse?.text ?? ''}</blockquote>
        <details>
          <summary>ESV Scripture attribution</summary>
          <p>{ESV_COPYRIGHT_NOTICE}</p>
        </details>
      </div>
    </article>
  );
}
