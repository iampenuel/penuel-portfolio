import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fittedVerseRailWidth, homePageOffset, phoneVisibleHeight } from '../src/lib/phoneLayout.ts';
import { createPreparedVideo } from '../src/lib/preparedVideo.ts';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('phone removes synthetic status UI and shares a centered dynamic-viewport rail', () => {
  const shell = source('src/components/adaptive/MobileShell.tsx');
  const css = source('src/styles/mobile-shell.css');
  assert.doesNotMatch(shell, /MobileStatusBar|mobile-status-bar/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /margin-inline: auto/);
  assert.match(css, /\.mobile-library-search input\s*\{[^}]*font-size: 16px/s);
  assert.doesNotMatch(css, /translateX\(/);
});

test('snap offsets use actual page starts, independent of ancestor gutters', () => {
  assert.equal(homePageOffset([21, 411], 0), 0);
  assert.equal(homePageOffset([21, 411], 1), 390);
  assert.equal(homePageOffset([34, 409], 1), 375);
  assert.equal(homePageOffset([], 0), 0);
});

test('visible-height sizing handles expanded chrome and keyboard without interfering with zoom', () => {
  assert.equal(phoneVisibleHeight(844, { height: 664, offsetTop: 0, scale: 1 }), 664);
  assert.equal(phoneVisibleHeight(844, { height: 812, offsetTop: 0, scale: 1 }), 812);
  assert.equal(phoneVisibleHeight(844, { height: 350, offsetTop: 90, scale: 1 }), 440);
  assert.equal(phoneVisibleHeight(844, { height: 422, offsetTop: 0, scale: 2 }), null);
  assert.equal(phoneVisibleHeight(568), 568);
  const css = source('src/styles/mobile-shell.css');
  assert.match(css, /--mobile-bottom-inset: calc\(env\(safe-area-inset-bottom\) \+ var\(--mobile-bottom-breathing-room\)\)/);
  assert.match(css, /height: min\(100dvh, var\(--mobile-visible-height, 100dvh\)\)/);
});

test('Page 2 artwork and copy share full rail width, retaining square art and clean scrolling', () => {
  const css = source('src/styles/mobile-shell.css');
  const home = source('src/components/adaptive/MobileHomeScreen.tsx');
  assert.match(css, /\.mobile-verse-artwork,\s*\.mobile-verse-copy\s*\{[^}]*width: 100%;/s);
  assert.match(css, /\.mobile-verse-artwork\s*\{[^}]*aspect-ratio: 1;/s);
  assert.match(css, /\.mobile-home-page\s*\{[^}]*overflow-y: auto;/s);
  assert.match(css, /\.mobile-home-page--reflection\s*\{[^}]*padding-bottom: 20px;/s);
  assert.doesNotMatch(css + home, /mobile-verse-art-size|verseArtworkSize/);
});

test('normal-phone rail fitting keeps the widest fit and never reduces width beyond 8%', () => {
  assert.equal(fittedVerseRailWidth(350, 600, width => width + 240), 350);
  assert.equal(fittedVerseRailWidth(350, 580, width => width + 240), 340);
  // Account for a wrapping threshold rather than assuming narrower always fits better.
  assert.equal(fittedVerseRailWidth(350, 580, width => width + (width < 342 ? 265 : 240)), 350);
  assert.equal(fittedVerseRailWidth(350, 500, width => width + 240), 350);
});

test('fit adjustments are Page 2-only, normal-height-only, and retain text/touch sizes', () => {
  const css = source('src/styles/mobile-shell.css');
  const compact = css.split('@media (min-height: 760px) {')[1].split('\n}\n')[0];
  const home = source('src/components/adaptive/MobileHomeScreen.tsx');
  assert.match(compact, /mobile-home-page--reflection/);
  assert.match(compact, /data-active-page="1"/);
  assert.doesNotMatch(compact, /font-size|line-height|mobile-resume|mobile-primary-grid|mobile-dock/);
  assert.match(home, /if \(!normalPhone\.matches \|\| !page\.clientWidth/);
  assert.match(css, /width: min\(100%, var\(--mobile-verse-rail-width, 100%\)\)/);
});

const segment = { videoId: 'dQw4w9WgXcQ', startSeconds: 42, endSeconds: 60 };
function mockPlayer(calls) {
  return {
    cueVideoById: value => calls.push(['cue', value]),
    pauseVideo: () => calls.push('pause'),
    unMute: () => calls.push('unmute'),
    setVolume: volume => calls.push(['volume', volume]),
    playVideo: () => calls.push('play')
  };
}

test('idle preparation only cues; the original tap synchronously unmutes and plays', () => {
  const calls = [];
  const controller = createPreparedVideo(segment);
  controller.attach(mockPlayer(calls));
  assert.deepEqual(calls, [['cue', segment]]);
  assert.equal(controller.isRequested(), false);
  controller.openFromGesture();
  assert.deepEqual(calls.slice(1), ['unmute', ['volume', 40], 'play']);
  assert.equal(controller.isRequested(), true);
});

test('close cancels pending launch, pauses and re-cues; reopening uses the same player', () => {
  const calls = [];
  const controller = createPreparedVideo(segment);
  controller.openFromGesture();
  controller.close();
  controller.attach(mockPlayer(calls));
  assert.deepEqual(calls, [['cue', segment]]);
  controller.openFromGesture();
  controller.close();
  assert.deepEqual(calls.slice(-2), ['pause', ['cue', segment]]);
  controller.openFromGesture();
  assert.deepEqual(calls.slice(-3), ['unmute', ['volume', 40], 'play']);
  controller.detach();
  const count = calls.length;
  controller.close();
  assert.equal(calls.length, count);
});

test('early tap attempts playback on ready without playing before user intent', () => {
  const calls = [];
  const controller = createPreparedVideo(segment);
  controller.openFromGesture();
  assert.deepEqual(calls, []);
  controller.attach(mockPlayer(calls));
  assert.deepEqual(calls, [['cue', segment], 'unmute', ['volume', 40], 'play']);
});

test('phone launch reveals the resident frame synchronously and warming is deferred', () => {
  const shell = source('src/components/adaptive/MobileShell.tsx');
  const player = source('src/components/RickrollPlayer.tsx');
  assert.match(shell, /flushSync\([\s\S]*rickrollLaunchRef\.current\?\.openFromGesture\(\)/);
  assert.match(shell, /requestIdleCallback/);
  assert.match(shell, /}, 1_500\)/);
  assert.match(shell, /inert=\{!rickrollOpen \|\| !isActive\}/);
  assert.match(player, /autoplay: prepareAtIdle \? 0 : 1/);
  assert.match(player, /showRickroll && !prepareAtIdle/);
  assert.match(player, /visibilitychange/);
});
