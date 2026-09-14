import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { adaptiveVerses, adaptiveVerseForReference } from '../src/data/adaptiveVerses.ts';
import { verses, verseForDate } from '../src/data/verses.ts';
import { portfolioApps } from '../src/data/portfolioApps.ts';
import { resolvePortfolioRoute } from '../src/lib/portfolioRoutes.ts';

test('the five manifest texts and artwork pairings match the unchanged ESV rotation', () => {
  assert.equal(adaptiveVerses.length, 5);
  assert.equal(new Set(adaptiveVerses.map(verse => verse.artwork)).size, 5);
  for (const verse of verses) {
    const adaptive = adaptiveVerseForReference(verse.reference);
    assert.equal(adaptive.text, verse.excerpt);
    assert.match(adaptive.artwork, /^\/assets\/mobile\/verse-art\/\d\d_[\w-]+\.png$/);
  }
  assert.equal(adaptiveVerseForReference('Unknown reference'), null);
});

test('local-day rotation is stable, covers all five entries, and wraps deterministically', () => {
  const references = new Set();
  for (let day = 14; day < 19; day++) {
    const early = verseForDate(new Date(2026, 8, day, 0, 0));
    const late = verseForDate(new Date(2026, 8, day, 23, 59));
    assert.equal(early.reference, late.reference);
    assert.equal(early.reference, verseForDate(new Date(2026, 8, day + 5)).reference);
    assert.ok(adaptiveVerseForReference(early.reference));
    references.add(early.reference);
  }
  assert.equal(references.size, 5);
});

test('all compact-shell icons are supplied assets, including Contact, with unchanged destinations', () => {
  assert.equal(portfolioApps.length, 9);
  for (const app of portfolioApps) {
    assert.equal(app.icon.kind, 'asset');
    assert.ok(readFileSync(new URL(`../public${app.icon.src}`, import.meta.url)).length > 0);
  }
  assert.equal(portfolioApps.find(app => app.id === 'contact').icon.src, '/assets/mobile/icons/contact.png');
  assert.equal(portfolioApps.find(app => app.id === 'github').externalUrl, 'https://github.com/iampenuel');
  assert.equal(portfolioApps.find(app => app.id === 'linkedin').externalUrl, 'https://www.linkedin.com/in/penuel-stanley-zebulon/');
  for (const path of ['/field-notes', '/field-notes/week-01', '/field-notes/week-02', '/field-notes/week-03']) {
    assert.equal(resolvePortfolioRoute(path).appId, 'field-notes');
    assert.equal(resolvePortfolioRoute(path).pathname, path);
  }
});

test('production icon, wallpaper, verse artwork, and PDF bytes match the supplied refinement pack', () => {
  const hashes = {
    'resume/Penuel_Stanley-Zebulon_Resume.pdf': '4fb486792ee4bde50085c2fbfcfacb3120092f214e40d22f7a5063fb08cd5b5e',
    'icons/projects.png': '5d5d85968be72adf48bc5b964667ff89951ceca20f0d4d7268ff056fadaafc51',
    'icons/about-me.png': 'e2e09d99a2022792f3288242939006dab1f2a0576e8754f174378d815ef9f8bf',
    'icons/experience.png': '186d30a8804fdc459c8c0041e366fd2c1b2ec2208a281a4f9aafcaf08a5b36eb',
    'icons/resume.png': '5f28049fe57544ecac7e424e9a174c53d54e375e78a007d8871c012f127219de',
    'icons/field-notes.png': '589a34ed097ed09c444239e9f2efd76bcb6b02983a82f246c6cbded69f03eae5',
    'icons/contact.png': 'f6d8d435839d62854d3f5b2b9b6e815cce6c2fb5efc7a3db8759a3a6770b14f1',
    'icons/github.png': '7afa3bed28c036825ab87cd077d3c99500c7397d65b08a672b947919b1d7929f',
    'icons/linkedin.png': '6a9e47edeaff8d6b11d1d1b6ac1680eb62882abbcf230bd8739d17d0fa441b20',
    'icons/definitely-important.png': '9b390fe700e9607e762aadf259bcddf791d29ccc28d76791c8671211d148a161',
    'wallpaper/01_mobile-bear-wallpaper.png': '9a413b32df6892a71989b161eb4e951b02538a0b3fe966a561477510f88786cc',
    'verse-art/04_john_3_16_artwork_REFERENCE.png': '9f7760b89749eacadb1a659ab58d388df3c922cd3d6ad8c3484d19618ba7a41b',
    'verse-art/02_romans-8-28.png': '8d542e68f469b1d73ed7e8a1f38f30869bc5ae9c803058f9935e6fb1c571c2d3',
    'verse-art/03_romans-5-8.png': 'ce2938187c2f1820ea0607542899d4e9c74a18a9084fe5d31777444c5092fb50',
    'verse-art/04_1-john-4-19.png': 'd7a72246af39ba359135d6e864255772d9faba6828d8f4382e31992ca2674f79',
    'verse-art/05_1-john-4-16.png': '4260c0d2089c6319a64216de52a0125f81d7fba5db22f761510537b8028f892a'
  };
  for (const [asset, expected] of Object.entries(hashes)) {
    const bytes = readFileSync(new URL(`../public/assets/mobile/${asset}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, asset);
  }
});
