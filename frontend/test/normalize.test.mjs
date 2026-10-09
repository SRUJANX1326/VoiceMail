import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSpokenEmail as n, spellEmail } from '../src/emailNormalize.js';

const cases = [
  ['APC at Gmail dot com', 'apc@gmail.com'],
  ['A P C at Gmail dot com', 'apc@gmail.com'],
  ['john dot doe at Gmail dot com', 'john.doe@gmail.com'],
  ['s r u j a n x 1326 at gmail.com', 'srujanx1326@gmail.com'],
  ['john underscore doe dash 99 at the rate of yahoo dot co dot in', 'john_doe-99@yahoo.co.in'],
  ['abc one two three at gmail dot com', 'abc123@gmail.com'],
  ['abc at symbol outlook period com', 'abc@outlook.com'],
  ['John.Doe@Gmail.com', 'john.doe@gmail.com'],
  ['No, I meant abc123 at gmail dot com', 'abc123@gmail.com'],
  ['meet me at noon, my email is apc at gmail dot com.', 'apc@gmail.com'],
  ['write a mail to my boss whose email address would be s r u j a n x 1326 at gmail.com and tell him I am sick', 'srujanx1326@gmail.com'],
];
for (const [input, want] of cases) test(`"${input}" -> ${want}`, () => assert.equal(n(input).email, want));

test('address in a sentence is replaced inside the text sent to the LLM', () => {
  assert.equal(n('tell my boss a p c at gmail dot com that I am sick').text, 'tell my boss apc@gmail.com that i am sick');
});
test('no address -> null', () => {
  assert.equal(n('I am at home').email, null);
  assert.equal(n('meet at noon at gmail').email, null);
});
test('spellEmail', () => assert.equal(spellEmail('a.b@gmail.com'), 'A, dot, B, at, gmail dot com'));
