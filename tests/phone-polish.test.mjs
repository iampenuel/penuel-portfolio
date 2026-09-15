import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fittedVerseRailWidth, homePageOffset, phoneVisibleHeight, reflectionContentRegion } from '../src/lib/phoneLayout.ts';
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

test('Page 2 reserves actual controls plus bottom inset once, independently of layout height', () => {
  const layout = { contentTop: 47, controlsTop: 600, controlsBottom: 810, shellBottom: 844, bottomInset: 34, viewportBottom: 844 };
  assert.deepEqual(reflectionContentRegion(layout), { persistentControlsHeight: 244, contentHeight: 553 });
  // Expanded browser chrome can shrink the visual viewport before the shell/grid updates.
  assert.deepEqual(reflectionContentRegion({ ...layout, viewportBottom: 664 }), { persistentControlsHeight: 244, contentHeight: 373 });
  // Trust the rendered controls boundary even if another sizing calculation claims more space.
  assert.equal(reflectionContentRegion({ ...layout, controlsTop: 580, controlsBottom: 790 }).contentHeight, 533);
  assert.equal(reflectionContentRegion({ ...layout, viewportBottom: 200 }).contentHeight, 0);
});

test('immersive Page 2 releases the controls height, retaining only the safe bottom inset', () => {
  const layout = { contentTop: 47, shellBottom: 844, bottomInset: 34, viewportBottom: 844 };
  assert.deepEqual(reflectionContentRegion(layout), { persistentControlsHeight: 34, contentHeight: 763 });
  assert.deepEqual(reflectionContentRegion({ ...layout, viewportBottom: 664 }), { persistentControlsHeight: 34, contentHeight: 583 });
});

test('Page 2 unmounts the lower controls but retains the pager and keyboard return path', () => {
  const home = source('src/components/adaptive/MobileHomeScreen.tsx');
  const css = source('src/styles/mobile-shell.css');
  const controls = home.split('{activePage === 0 && <>')[1].split('</>}')[0];
  assert.match(controls, /mobile-page-controls/);
  assert.match(controls, /mobile-library-trigger/);
  assert.match(controls, /mobile-dock/);
  assert.doesNotMatch(controls, /mobile-home-pages|MobileVerseWidget/);
  assert.match(home, /scroller\.focus\(\{ preventScroll: true \}\)/);
  assert.match(home, /scroller\.clientWidth !== previousWidth/);
  assert.match(home, /event\.key === 'ArrowLeft'/);
  assert.match(home, /event\.key === 'ArrowRight'/);
  assert.match(css, /\.mobile-home-screen\[data-active-page="1"\]\s*\{ grid-template-rows: minmax\(0, 1fr\); \}/);
});

test('only Page 2 gets a measured scrollport and real trailing space; controls stay in grid flow', () => {
  const css = source('src/styles/mobile-shell.css');
  const home = source('src/components/adaptive/MobileHomeScreen.tsx');
  const reflection = css.split('.mobile-home-page--reflection {')[1].split('\n}')[0];
  assert.match(reflection, /display: block/);
  assert.match(reflection, /height: min\(100%, var\(--phone-page-content-height, 100%\)\)/);
  assert.match(reflection, /padding-bottom: 20px/);
  assert.match(reflection, /scroll-padding-bottom: 20px/);
  assert.equal(css.match(/--phone-page-content-height/g).length, 1);
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) auto auto/);
  assert.match(home, /\[shell, scroller, controls, dock\]/);
  assert.match(home, /viewport\?\.addEventListener\('resize', scheduleMeasurement\)/);
  assert.match(home, /viewport\?\.addEventListener\('scroll', scheduleMeasurement\)/);
  assert.match(home, /viewport\?\.removeEventListener\('resize', scheduleMeasurement\)/);
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
  assert.match(compact, /--mobile-verse-rail-clearance: 8px/);
  assert.doesNotMatch(compact.split('.mobile-home-page--reflection {')[1].split('}')[0], /padding-bottom/);
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
