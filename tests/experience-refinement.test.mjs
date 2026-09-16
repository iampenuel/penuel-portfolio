import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { experience, leadership, awards, certifications } from '../src/data/experience.ts';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const content = readFileSync(new URL('../src/components/PortfolioContent.tsx', import.meta.url), 'utf8');
const desktopRules = css.split('/* Desktop Experience refinement only;')[1].split('.resume-shell')[0].replace(/^[\s\S]*?\*\//, '').replace(/\/\*[\s\S]*?\*\//g, '');

test('AI 100 uses the approved role, responsibilities, dates, and existing Penn State asset', () => {
  const item = experience[0];
  assert.equal(item.id, 'ai-100-la');
  assert.equal(item.role, 'Learning Assistant — AI 100');
  assert.equal(item.organization, 'Penn State Harrisburg');
  assert.equal(item.dates, 'September 2026 – Present');
  assert.equal(item.description, 'Support students in AI 100 through office hours, concept clarification, assignment feedback, and classroom learning support.');
  assert.deepEqual(item.bullets, [
    'Hold weekly office hours to help students work through foundational AI concepts and course material.',
    'Provide assignment feedback and clarify concepts when students are unsure where to begin.',
    'Support the instructional team in creating an approachable, student-centered learning environment.'
  ]);
  assert.equal(item.logo, experience.find(role => role.id === 'penn-state-cte').logo);
});

test('current roles lead the timeline, with the latest start first, followed by prior programs', () => {
  assert.deepEqual(experience.map(item => item.id), ['ai-100-la', 'penn-state-cte', 'ibm', 'ai4all', 'aws-scholar', 'adobe-ambassador']);
  assert.ok(experience.slice(0, 2).every(item => item.dates.endsWith('Present')));
  assert.ok(experience.slice(2).every(item => !item.dates.endsWith('Present')));
});

test('all pre-existing Experience, Leadership, Awards, and Certification facts are unchanged', () => {
  // Approved production data, ignoring order and the new presentation-only metadata.
  const expected = {
    experience: '4d1e62aa95ce3f7e421c7c6fe125778da9e4b37c333c9cdd66d0d54ae049ad07',
    leadership: '2288411b18bb2fe51b9cbbb35b20bb8c492bf887c144ee704c8ea9117d875252',
    awards: '0896278abda7ff7d1b50667dee85f71ae530982fb526040120bcaff3215c367b',
    certifications: '648d44fbdb85672d1155acb055ac5b1b43c56538ca4c53c41232b74cc892088e'
  };
  for (const [name, items] of Object.entries({ experience: experience.filter(item => item.id !== 'ai-100-la'), leadership, awards, certifications })) {
    const normalized = items.map(({ logoTreatment, ...item }) => item).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    assert.equal(createHash('sha256').update(JSON.stringify(normalized)).digest('hex'), expected[name], name);
  }
});

test('only full-tile AWS and Udacity artwork opt into fill; all logos remain existing local assets', () => {
  const items = [...experience, ...leadership, ...awards, ...certifications];
  assert.deepEqual(items.filter(item => item.logoTreatment === 'fill').map(item => item.logo).sort(), ['/assets/logos/aws.png', '/assets/logos/udacity.png']);
  for (const item of items) {
    assert.ok(['mark', 'fill'].includes(item.logoTreatment ?? 'mark'));
    assert.ok(readFileSync(new URL(`../public${item.logo}`, import.meta.url)).length > 0);
  }
  assert.equal(certifications[0].title, 'SAP Certified – SAP Generative AI Developer');
  assert.match(content, /data-logo-treatment=\{item.logoTreatment \?\? 'mark'\}/);
  assert.match(css, /\.experience-card img[^}]*object-fit: contain/);
  assert.match(css, /\.cert-logo img[^}]*object-fit: contain/);
  const fillRule = [...desktopRules.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, , declarations]) => declarations.includes('object-fit: cover'));
  assert.ok(fillRule);
  assert.ok(fillRule[1].split(',').every(selector => selector.includes("[data-logo-treatment='fill']")));
});

test('neutral card and logo refinements stay inside the desktop Experience shell', () => {
  const rules = [...desktopRules.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  assert.ok(rules.length >= 10);
  for (const [, selector, declarations] of rules) {
    assert.ok(selector.trim().startsWith('.desktop .experience-shell'), selector);
    assert.doesNotMatch(declarations, /gradient|rgba?\(\s*10\s*,\s*132\s*,\s*255/);
    if (!selector.includes(':focus-visible')) assert.doesNotMatch(declarations, /var\(--blue\)/);
  }
  assert.match(desktopRules, /\.featured\s*\{\s*border-color: var\(--window-border\);\s*background: var\(--window-panel\)/);
  assert.doesNotMatch(desktopRules, /font-size|grid-template-columns|transition|animation/);
});

test('section buttons expose selection and keep keyboard-only focus separate from active styling', () => {
  assert.match(content, /<button type="button" aria-pressed=\{tab === item\}/);
  assert.match(desktopRules, /button:focus:not\(:focus-visible\)\s*\{ outline: none; \}/);
  assert.match(desktopRules, /button:focus-visible\s*\{ outline: 2px solid var\(--blue\); outline-offset: 2px; \}/);
  assert.doesNotMatch(content.slice(content.indexOf('export function ExperienceWindow')), /tabIndex=\{-1\}/);
});
