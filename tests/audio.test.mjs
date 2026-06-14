import assert from "node:assert/strict";
import {
  createAudioEngine,
  createAudioSettings,
  soundCue,
  toggleMute
} from "../src/audio.js";

const settings = createAudioSettings();
assert.equal(settings.muted, false);
assert.equal(settings.volume, 0.28);

assert.deepEqual(toggleMute(settings), { muted: true, volume: 0.28 });
assert.deepEqual(toggleMute(settings), { muted: false, volume: 0.28 });

assert.deepEqual(soundCue("shoot"), {
  type: "tone",
  waveform: "square",
  startFrequency: 620,
  endFrequency: 920,
  duration: 0.06,
  gain: 0.1
});

assert.equal(soundCue("enemyDestroyed").type, "burst");
assert.equal(soundCue("campaignComplete").type, "jingle");
assert.equal(soundCue("unknown").type, "tone");

let lastGainNode;
class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.state = "running";
  }

  createGain() {
    lastGainNode = {
      gain: { value: -1, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {}
    };
    return lastGainNode;
  }

  createOscillator() {
    return {
      frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      start() {},
      stop() {}
    };
  }

  resume() {}
}

const engine = createAudioEngine({ AudioContextClass: FakeAudioContext });
engine.unlock();
assert.equal(lastGainNode.gain.value, 0.28);
engine.toggleMute();
assert.equal(lastGainNode.gain.value, 0);
engine.toggleMute();
assert.equal(lastGainNode.gain.value, 0.28);

console.log("audio tests passed");
