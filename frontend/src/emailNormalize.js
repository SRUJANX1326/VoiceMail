// Deterministic spoken-email normalizer. Runs BEFORE any LLM sees the text.
const NUMW = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };
const STOP = new Set(['is', 'are', 'was', 'be', 'email', 'mail', 'e-mail', 'address', 'id', 'to', 'whose', 'which', 'that', 'goes', 'by',
  'would', 'will', 'should', 'the', 'my', 'his', 'her', 'their', 'our', 'your', 'it', 'its', "it's", 'send', 'write', 'compose', 'draft',
  'tell', 'and', 'or', 'for', 'of', 'with', 'from', 'meant', 'mean', 'no', 'yes', 'actually', 'me', 'please', 'as', 'then', 'sorry']);
const SEP = { DOT: '.', US: '_', DASH: '-' };

function toTokens(text) {
  const s = text.toLowerCase()
    .replace(/\bat\s+(?:the\s+)?(?:rate|symbol|sign)(?:\s+of)?\b/g, ' @ ')
    .replace(/\bfull\s+stop\b/g, ' dot ')
    .replace(/\bunder\s+score\b/g, ' underscore ')
    .replace(/@/g, ' @ ')
    .replace(/[,;:!?()"“”]/g, ' ')
    .replace(/\.(?=\s|$)/g, ' '); // sentence-ending periods
  return s.split(/\s+/).filter(Boolean).map((w) => {
    if (w === '@' || w === 'at') return { t: 'AT', raw: w };
    if (['dot', 'period', 'point'].includes(w)) return { t: 'DOT', raw: w };
    if (w === 'underscore') return { t: 'US', raw: w };
    if (['dash', 'hyphen', 'minus'].includes(w)) return { t: 'DASH', raw: w };
    if (w in NUMW) return { t: 'D', v: NUMW[w], raw: w };
    if (/^\d+$/.test(w)) return { t: 'D', v: w, raw: w };
    if (/^[a-z]$/.test(w)) return { t: 'L', v: w, raw: w };
    if (STOP.has(w)) return { t: 'STOP', raw: w };
    if (/^[a-z0-9._+-]+$/.test(w)) return { t: 'W', v: w, raw: w };
    return { t: 'STOP', raw: w };
  });
}

const EMAIL_RE = /^[a-z0-9][a-z0-9._+-]*@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

/** Returns { email: string|null, text: string } where text has the spoken address replaced by the real one. */
export function normalizeSpokenEmail(input) {
  const original = String(input || '').trim();
  const toks = toTokens(original);
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t !== 'AT') continue;

    // ---- local part: walk backwards ----
    let j = i - 1;
    const local = [];
    while (j >= 0) {
      const k = toks[j], next = toks[j + 1];
      if (k.t === 'W') { if (next.t === 'L' || next.t === 'W') break; }
      else if (!['L', 'D', 'DOT', 'US', 'DASH'].includes(k.t)) break;
      local.unshift(k); j--;
    }
    while (local.length && SEP[local[0].t]) local.shift(); // drop leading separators
    if (!local.length || SEP[local[local.length - 1].t]) continue;
    const start = i - local.length;
    const lp = local.map((k) => SEP[k.t] || k.v).join('');

    // ---- domain: walk forwards (label (. label)+) ----
    let k = i + 1, dom = '', expect = true, end = i, prev = null;
    for (; k < toks.length; k++) {
      const t = toks[k];
      if (expect) {
        if ((t.t === 'W' && /^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(t.v)) || t.t === 'L' || t.t === 'D') { dom += t.v; end = k; expect = false; }
        else break;
      } else if (t.t === 'DOT') { dom += '.'; expect = true; }
      else if (t.t === 'DASH') { dom += '-'; expect = true; }
      else if ((t.t === 'L' || t.t === 'D') && prev && (prev.t === 'L' || prev.t === 'D')) { dom += t.v; end = k; } // spelled "c o m"
      else break;
      prev = t;
    }
    const email = `${lp}@${dom.replace(/[.-]+$/, '')}`;
    if (!EMAIL_RE.test(email)) continue;
    const text = [...toks.slice(0, start).map((x) => x.raw), email, ...toks.slice(end + 1).map((x) => x.raw)].join(' ');
    return { email, text };
  }
  return { email: null, text: original };
}

/** "A, P, C, at, gmail dot com" - what the TTS should say so the user can verify letter by letter. */
export function spellEmail(email) {
  const [l, d] = email.split('@');
  const sp = [...l].map((c) => (c === '.' ? 'dot' : c === '_' ? 'underscore' : c === '-' ? 'dash' : c.toUpperCase())).join(', ');
  return `${sp}, at, ${d.replace(/\./g, ' dot ')}`;
}
