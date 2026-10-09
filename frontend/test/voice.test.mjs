import test from 'node:test';
import assert from 'node:assert/strict';

// Fake browser speech recognition
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => '' };
const made = [];
globalThis.SpeechRecognition = class { constructor() { made.push(this); } start() {} abort() { this.onend && this.onend(); } };
const { listen } = await import('../src/voice.js');
const final = (t) => ({ results: [Object.assign([{ transcript: t }], { isFinal: true })] });
const pending = (p) => Promise.race([p, new Promise((r) => setTimeout(() => r('PENDING'), 50))]);

test('late onend of an old recognizer does not cancel the next listen', async () => {
  const p1 = listen();
  made[0].onresult(final('hello'));
  assert.equal((await p1).text, 'hello');
  const p2 = listen();
  made[0].onend();                        // late event from recognizer #1
  assert.equal(await pending(p2), 'PENDING');
  made[1].onresult(final('hey my assistant'));
  assert.equal((await p2).text, 'hey my assistant');
});

test('native result: JSON array and old plain-text both work', async () => {
  globalThis.Android = { listen() {}, stopListening() {} };
  const m = await import('../src/voice.js?native'); // fresh module instance with Android present
  const a = m.listen(); window.onNative('result', JSON.stringify(['a b c', 'abc']));
  assert.deepEqual((await a).alts, ['a b c', 'abc']);
  const b = m.listen(); window.onNative('result', 'plain old text');
  assert.equal((await b).text, 'plain old text');
  delete globalThis.Android;
});
