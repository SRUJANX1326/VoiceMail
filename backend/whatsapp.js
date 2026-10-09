// WhatsApp "click to chat": builds a wa.me link that opens WhatsApp with the message pre-filled.
// Free, no API key. The user taps Send inside WhatsApp - nothing is ever sent automatically.
export const defaultCountryCode = () => String(process.env.DEFAULT_COUNTRY_CODE || '91').replace(/\D/g, '');
export const MAX_TEXT = 1000;

/** Returns digits in international format without "+" (e.g. "919876543210") or null. */
export function normalizePhone(raw, cc = defaultCountryCode()) {
  const s = String(raw || '').trim();
  let digits = s.replace(/\D/g, '');
  if (!digits) return null;
  const international = s.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (international) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  digits = digits.replace(/^0+/, '');            // trunk prefix, e.g. 098765 43210
  if (digits.length === 10) return cc + digits;   // national number -> add country code
  if (digits.length >= 11 && digits.length <= 15) return digits; // already contains a country code
  return null;
}

export const displayPhone = (digits) => `+${digits}`;

export function buildLink(digits, text) {
  const t = String(text || '').slice(0, MAX_TEXT);
  return `https://wa.me/${digits}?text=${encodeURIComponent(t)}`;
}
