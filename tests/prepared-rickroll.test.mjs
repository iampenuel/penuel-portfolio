import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreparedRickroll } from '../src/lib/preparedRickroll.ts';

const segment = { videoId: 'dQw4w9WgXcQ', startSeconds: 42, endSeconds: 60 };
function fixture(t, apiPromise = Promise.resolve({})) {
  const calls = [], events = [], players = [], logs = [];
  const controller = createPreparedRickroll({
    segment,
    loadApi: () => { calls.push('api'); return apiPromise; },
    createPlayer: (_api, handlers) => {
      calls.push('construct');
      let state = -1, time = 42;
      const player = {
        mute: () => calls.push('mute'), unMute: () => calls.push('unmute'),
        setVolume: value => calls.push(['volume', value]),
        cueVideoById: value => { calls.push(['cue', value]); state = 5; },
        playVideo: () => calls.push('play'), pauseVideo: () => calls.push('pause'),
        stopVideo: () => calls.push('stop'), destroy: () => calls.push('destroy'),
        getPlayerState: () => state, getCurrentTime: () => time,
        setState: value => { state = value; handlers.onStateChange({ target: player, data: value }); },
        setTime: value => { time = value; }
      };
      players.push(player); events.push(handlers);
      return player;
    },
    log: (event, detail) => logs.push([event, detail])
  });
  t.after(() => controller.dispose());
  const ready = async () => {
    controller.prepare(); await Promise.resolve();
    events.at(-1).onReady({ target: players.at(-1) }); players.at(-1).setState(5);
  };
  return { controller, calls, events, players, logs, ready };
}

test('preparation begins immediately without playback; onReady alone is not cue readiness', async t => {
  const f = fixture(t); f.controller.prepare();
  assert.deepEqual(f.calls, ['api']); await Promise.resolve();
  assert.deepEqual(f.calls, ['api', 'construct']);
  f.events[0].onReady({ target: f.players[0] });
  assert.equal(f.controller.getSnapshot().ready, false);
  assert.deepEqual(f.calls.slice(-2), ['mute', ['cue', segment]]);
  f.players[0].setState(5);
  assert.equal(f.controller.getSnapshot().phase, 'ready');
  assert.equal(f.calls.includes('play'), false);
});

test('ready tap reveals first, then synchronously unmutes/sets volume/plays on the same instance', async t => {
  const f = fixture(t); await f.ready(); f.calls.length = 0;
  const original = f.players[0];
  f.controller.openFromGesture(() => f.calls.push('reveal'));
  assert.deepEqual(f.calls, ['reveal', 'unmute', ['volume', 40], 'play']);
  assert.equal(f.players.length, 1); assert.equal(f.players[0], original);
  assert.equal(f.controller.getSnapshot().phase, 'requested');
});

test('Home pauses/re-cues and repeated opens retain the same player', async t => {
  const f = fixture(t); await f.ready();
  for (let i = 0; i < 5; i++) {
    f.controller.openFromGesture(() => {}); f.players[0].setState(1);
    f.calls.length = 0; f.controller.close();
    assert.deepEqual(f.calls, ['pause', 'mute', ['cue', segment]]);
    assert.equal(f.controller.getSnapshot().ready, false); f.players[0].setState(5);
    assert.equal(f.controller.getSnapshot().ready, true);
  }
  assert.equal(f.players.length, 1);
});

test('early tap waits for cue confirmation without a fatal readiness deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = fixture(t); f.controller.prepare(); f.controller.openFromGesture(() => f.calls.push('reveal'));
  await Promise.resolve(); t.mock.timers.tick(60_000);
  assert.equal(f.calls.includes('destroy'), false); assert.equal(f.calls.includes('play'), false);
  f.events[0].onReady({ target: f.players[0] }); assert.equal(f.calls.includes('play'), false);
  f.players[0].setState(5); assert.equal(f.calls.at(-1), 'play');
});

test('closing before readiness cancels pending playback but retains preparation', async t => {
  const f = fixture(t); f.controller.prepare(); f.controller.openFromGesture(() => {}); f.controller.close();
  await Promise.resolve(); f.events[0].onReady({ target: f.players[0] }); f.players[0].setState(5);
  assert.equal(f.calls.includes('play'), false); assert.equal(f.controller.getSnapshot().ready, true);
});

test('autoplay blocking retains an in-app synchronous fallback, not Player Unavailable', async t => {
  const f = fixture(t); await f.ready(); f.controller.openFromGesture(() => {}); f.events[0].onAutoplayBlocked();
  assert.equal(f.controller.getSnapshot().phase, 'blocked');
  assert.equal(f.controller.getSnapshot().needsGesture, true); assert.equal(f.controller.getSnapshot().error, null);
  f.calls.length = 0; f.controller.playFromGesture();
  assert.deepEqual(f.calls, ['unmute', ['volume', 40], 'play']);
});

test('buffering is not autoplay blocking and PLAYING clears the fallback timer', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = fixture(t); await f.ready(); f.controller.openFromGesture(() => {});
  f.players[0].setState(3); t.mock.timers.tick(2_000); assert.equal(f.controller.getSnapshot().needsGesture, false);
  f.players[0].setState(1); t.mock.timers.tick(2_000); assert.equal(f.controller.getSnapshot().phase, 'playing');
});

test('error 150 is logged separately; Retry creates fresh ownership and ignores stale events', async t => {
  const f = fixture(t); await f.ready(); f.controller.openFromGesture(() => {});
  f.events[0].onError({ target: f.players[0], data: 150 });
  assert.equal(f.controller.getSnapshot().error, 'YouTube error 150');
  assert.equal(f.logs.find(([event]) => event === 'youtube-error')[1].code, 150);
  assert.equal(f.calls.filter(c => c === 'destroy').length, 1);
  f.controller.retry(); await Promise.resolve(); const before = f.controller.getSnapshot();
  f.events[0].onReady({ target: f.players[0] }); f.events[0].onError({ target: f.players[0], data: 150 });
  f.events[0].onAutoplayBlocked(); f.players[0].setState(1);
  assert.deepEqual(f.controller.getSnapshot(), before);
  f.events[1].onReady({ target: f.players[1] }); f.players[1].setState(5);
  assert.equal(f.players.length, 2);
  f.controller.close(); f.players[1].setState(5); f.calls.length = 0;
  f.controller.openFromGesture(() => f.calls.push('reveal'));
  assert.deepEqual(f.calls, ['reveal', 'unmute', ['volume', 40], 'play']);
});

test('background pauses/re-cues without foreground auto-resume; next Home/icon tap works', async t => {
  const f = fixture(t); await f.ready(); f.controller.openFromGesture(() => {}); f.players[0].setState(1);
  f.calls.length = 0; f.controller.setVisible(false);
  assert.deepEqual(f.calls, ['pause', 'mute', ['cue', segment]]);
  f.players[0].setState(5); f.controller.setVisible(true);
  assert.equal(f.calls.includes('play'), false); assert.equal(f.controller.getSnapshot().needsGesture, true);
  f.controller.close(); f.players[0].setState(5); f.controller.openFromGesture(() => {});
  assert.equal(f.calls.at(-1), 'play');
});

test('background before onReady cancels early-tap autoplay', async t => {
  const f = fixture(t); f.controller.prepare(); f.controller.openFromGesture(() => {}); f.controller.setVisible(false);
  await Promise.resolve(); f.events[0].onReady({ target: f.players[0] }); f.players[0].setState(5); f.controller.setVisible(true);
  assert.equal(f.calls.includes('play'), false);
});

test('unsolicited PLAYING while staged is immediately silenced', async t => {
  const f = fixture(t); await f.ready(); f.calls.length = 0; f.players[0].setState(1);
  assert.deepEqual(f.calls, ['pause', 'mute']);
});

test('segment end re-cues for replay without replacing the player', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const f = fixture(t); await f.ready(); f.controller.openFromGesture(() => {}); f.players[0].setState(1);
  f.players[0].setTime(60); t.mock.timers.tick(200); assert.equal(f.controller.getSnapshot().phase, 'ended');
  f.players[0].setState(5); f.calls.length = 0; f.controller.playFromGesture();
  assert.deepEqual(f.calls, ['unmute', ['volume', 40], 'play']); assert.equal(f.players.length, 1);
});

test('disposal invalidates unresolved API work; shell reactivation gets a fresh generation', async t => {
  let resolve;
  const f = fixture(t, new Promise(r => { resolve = r; }));
  f.controller.prepare(); f.controller.dispose(); resolve({}); await Promise.resolve(); assert.equal(f.players.length, 0);
  f.controller.prepare(); await Promise.resolve(); assert.equal(f.players.length, 1);
});

test('failed stop cannot skip destruction; rejected API load remains a genuine failure', async t => {
  const f = fixture(t); await f.ready(); f.players[0].stopVideo = () => { throw new Error('already failed'); };
  assert.doesNotThrow(() => f.events[0].onError({ target: f.players[0], data: 153 })); assert.equal(f.calls.at(-1), 'destroy');
  const g = fixture(t, Promise.reject(new Error('API offline')));
  g.controller.prepare(); await Promise.resolve(); await Promise.resolve();
  assert.equal(g.controller.getSnapshot().error, 'API offline');
});
