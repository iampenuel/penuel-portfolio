import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { awards } from '../src/data/experience.ts';
import { fieldNotes, publishedFieldNotes } from '../src/data/fieldNotes.ts';
import { projects } from '../src/data/projects.ts';
import { fieldNotePath, resolvePortfolioRoute } from '../src/lib/portfolioRoutes.ts';

const digest = (data) => createHash('sha256').update(JSON.stringify(data)).digest('hex');

test('ICDS student poster placement leads Awards without replacing the scholarship amount', () => {
  assert.equal(awards.length, 2);
  const [poster, scholarship] = awards;
  assert.equal(poster.title, 'ICDS Symposium 2026 — Third Place');
  assert.equal(poster.date, 'October 14, 2026');
  assert.equal(poster.issuer, 'Penn State Institute for Computational and Data Sciences');
  assert.equal(poster.placement, 'Third Place');
  assert.equal(poster.amount, undefined);
  assert.match(poster.description, /third place in the student research poster competition/);
  assert.match(poster.description, /independent research/);
  assert.equal(scholarship.title, 'Ackroyd Family Healthier Days Scholarship');
  assert.equal(scholarship.amount, '$1,500');
  assert.equal(scholarship.placement, undefined);
});

test('the symposium photograph is a local WebP with intrinsic dimensions and descriptive alt text', () => {
  const { photo } = awards[0];
  assert.equal(photo.src, '/assets/photos/icds-symposium-2026.webp');
  assert.equal(photo.width, 960);
  assert.equal(photo.height, 1020);
  assert.match(photo.alt, /Penuel standing beside his .*research poster/);
  const bytes = readFileSync(new URL(`../public${photo.src}`, import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.ok(bytes.length < 200_000);
  const component = readFileSync(new URL('../src/components/PortfolioContent.tsx', import.meta.url), 'utf8');
  assert.match(component, /item\.placement \?\? item\.amount/);
  assert.match(component, /className="award-photo"[^>]+alt=\{item\.photo\.alt\}[^>]+width=\{item\.photo\.width\}[^>]+height=\{item\.photo\.height\}[^>]+loading="lazy"/);
});

test('the MRI award is an additive highlight; every prior project field and limitation stays unchanged', () => {
  const mri = projects.find(project => project.id === 'neonatal-mri');
  assert.equal(mri.highlights.length, 6);
  assert.match(mri.highlights.at(-1), /third place in the student research poster competition/);
  assert.match(mri.highlights.at(-1), /independent undergraduate research/);
  const previousProjects = projects.map(project => project.id === 'neonatal-mri'
    ? { ...project, highlights: project.highlights.slice(0, -1) }
    : project);
  assert.equal(digest(previousProjects), 'c4315c22b4d49f65aa723f7e3de0f29eea29ff70dc96a9a4fda6fe287ef88536');
});

test('one published catch-up note precedes the four unchanged reflections and retains deep linking', () => {
  assert.deepEqual(publishedFieldNotes.map(note => note.slug), ['weeks-05-08', 'week-04', 'week-03', 'week-02', 'week-01']);
  const note = fieldNotes[0];
  assert.equal(note.week, 'Weeks 05–08');
  assert.equal(note.title, 'From an Idea to a Team Effort');
  assert.equal(note.date, 'September 21–October 18, 2026');
  assert.equal(note.paragraphs.length, 7);
  assert.equal(note.pinnedThought, 'A good project needs more than a strong idea. It needs people who believe in it enough to build it together.');
  assert.match(note.paragraphs[0], /platform we're envisioning/);
  assert.match(note.paragraphs[2], /currently leading the group/);
  assert.equal(note.aiTool, 'ChatGPT');
  assert.match(note.aiPrompt, /^Summary of the writing request:/);
  assert.equal(fieldNotePath(note.slug), '/field-notes/weeks-05-08');
  assert.equal(resolvePortfolioRoute(fieldNotePath(note.slug)).fieldNoteSlug, note.slug);
  assert.equal(digest(fieldNotes.slice(1)), '0aaf7f78530501843a0e3dd710d0a0c033562b68987aed04fa64842978d32e6d');
});
