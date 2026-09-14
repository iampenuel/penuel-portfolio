import test from 'node:test';
import assert from 'node:assert/strict';
import { nowPlayingView, safeMusicUrl, safeArtworkUrl } from '../src/lib/nowPlaying.ts';

const now = new Date('2026-09-14T12:00:00Z');
const data = {
  title: 'Example track', artist: 'Example artist', source: 'YouTube Music',
  artwork: '/assets/example.png', url: 'https://music.youtube.com/watch?v=example',
  updatedAt: '2026-09-14T11:55:00Z', status: 'now-playing'
};
const snapshot = (changes = {}) => ({isSample:false, data:{...data, ...changes}});

test('samples are explicitly identified, never presented as live', () => {
  const view = nowPlayingView({isSample:true, data:{...data, updatedAt:null}}, null);
  assert.equal(view.label, 'Sample selection');
  assert.equal(view.isSample, true);
});
test('fresh now-playing and recent updates have distinct labels', () => {
  assert.equal(nowPlayingView(snapshot(), now).label, 'Now Playing');
  assert.equal(nowPlayingView(snapshot({status:'recently-played'}), now).label, 'Recently Playing');
  assert.equal(nowPlayingView(snapshot({updatedAt:'2026-09-14T11:00:00Z'}), now).label, 'Recently Playing');
});
test('missing, unavailable, invalid, stale, and future live data stay hidden', () => {
  for (const changes of [
    {status:'unavailable'}, {status:'unknown'}, {title:' '}, {updatedAt:null},
    {updatedAt:'invalid'}, {updatedAt:'2026-09-12T12:00:00Z'}, {updatedAt:'2026-09-14T13:00:00Z'}
  ]) assert.equal(nowPlayingView(snapshot(changes), now), null);
  assert.equal(nowPlayingView({isSample:false,data:null}, now), null);
  assert.equal(nowPlayingView(snapshot(), null), null);
});
test('unsafe and non-real links never create an open action', () => {
  for (const url of [null, '', 'javascript:alert(1)', 'data:text/html,example', '/track', 'http://example.com', 'https://user:secret@example.com']) {
    assert.equal(safeMusicUrl(url), null);
    assert.equal(nowPlayingView(snapshot({url}), now).url, null);
  }
  assert.equal(safeMusicUrl(data.url), data.url);
});
test('artwork accepts local assets and HTTPS, not executable or protocol-relative URLs', () => {
  assert.equal(safeArtworkUrl('/assets/mobile/cover.svg'), '/assets/mobile/cover.svg');
  assert.equal(safeArtworkUrl('https://example.com/cover.png'), 'https://example.com/cover.png');
  assert.equal(safeArtworkUrl('//example.com/cover.png'), null);
  assert.equal(safeArtworkUrl('javascript:alert(1)'), null);
});
