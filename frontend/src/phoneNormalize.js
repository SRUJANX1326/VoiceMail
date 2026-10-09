// Deterministic spoken-phone-number normalizer (runs before any AI).
// "nine eight seven six five four three two one zero" / "98765 43210" / "plus nine one 98765 43210" -> digits
const NUMW = { zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };

function toItems(text) {
  const toks = String(text).toLowerCase().replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean);
  const items = [];
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i];
    const rep = w === 'double' ? 2 : w === 'triple' ? 3 : 0;
    const nxt = toks[i + 1];
    if (rep && nxt && (nxt in NUMW || /^\d$/.test(nxt))) { items.push({ raw: `${w} ${nxt}`, d: (NUMW[nxt] ?? nxt).repeat(rep) }); i++; continue; }
    if (w === 'plus') items.push({ raw: w, d: '', plus: true });
    else if (/^\+?\d[\d-]*$/.test(w)) items.push({ raw: w, d: w.replace(/\D/g, ''), plus: w.startsWith('+') });
    else if (w in NUMW) items.push({ raw: w, d: NUMW[w], weak: w === 'oh' });
    else items.push({ raw: w, d: null });
  }
  return items;
}

/** Finds a phone number in spoken text. Returns { phone: '+919876543210' | '9876543210', rest } or null. */
export function extractSpokenPhone(text) {
  const items = toItems(text);
  let best = null;
  for (let i = 0; i < items.length; ) {
    if (items[i].d === null) { i++; continue; }
    let j = i; while (j < items.length && items[j].d !== null) j++;
    let a = i, b = j;
    while (a < b && items[a].weak) a++;                // "oh" at the edges is just a word
    while (b > a && items[b - 1].weak) b--;
    const run = items.slice(a, b);
    const digits = run.map((x) => x.d).join('');
    if (digits.length >= 8 && digits.length <= 15 && (!best || digits.length > best.digits.length)) best = { a, b, digits, plus: run.some((x) => x.plus) };
    i = j;
  }
  if (!best) return null;
  const rest = [...items.slice(0, best.a), ...items.slice(best.b)].map((x) => x.raw).join(' ');
  return { phone: (best.plus ? '+' : '') + best.digits, rest };
}

/** "+919876" -> "plus, 9, 1, 9, 8, 7, 6" so the TTS reads it digit by digit. */
export const spellDigits = (p) => String(p).split('').map((c) => (c === '+' ? 'plus' : c)).join(', ');
