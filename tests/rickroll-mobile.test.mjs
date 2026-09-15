import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const player = readFileSync(new URL('../src/components/RickrollPlayer.tsx', import.meta.url), 'utf8');
const host = readFileSync(new URL('../src/components/adaptive/MobileAppHost.tsx', import.meta.url), 'utf8');
const lifetime = readFileSync(new URL('../src/lib/videoLifetime.ts', import.meta.url), 'utf8');

test('mobile Rickroll keeps inline playback and a synchronous sound-enabled tap fallback', () => {
  assert.match(player, /playsinline: 1/);
  assert.match(host, /playLabel="Tap to open file"/);
  const handler = player.split('const playFromFallback = () => {')[1].split('\n  };')[0];
  assert.match(handler, /player\.unMute\(\);[\s\S]*player\.setVolume\(40\);[\s\S]*player\.playVideo\(\);/);
  assert.doesNotMatch(handler, /await|setTimeout|window\.open|location\./);
  assert.match(player, /onClick=\{playFromFallback\}/);
});

test('autoplay blocking stays in-app; actual embed errors retain local QA codes and cleanup', () => {
  const blocked = player.split('onAutoplayBlocked: () => {')[1].split('\n          }')[0];
  assert.match(blocked, /setShowPlayFallback\(true\)/);
  assert.doesNotMatch(blocked, /setPhase\('error'\)|window\.open/);
  assert.match(player, /onError: \(\{ data \}\) =>/);
  assert.match(player, /logMediaDiagnostic\(scope, 'youtube-error', \{ code: data, attempt \}\)/);
  assert.match(player, /player\.pauseVideo\(\)/);
  assert.match(lifetime, /target\.stopVideo\(\)/);
  assert.match(lifetime, /target\.destroy\(\)/);
  assert.match(player, /lifetime\.dispose\(\)/);
});
