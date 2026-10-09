# Safe email encoding

**Scoring area:** Security (96)

## Why this earns a high score
Properly encoded mail prevents header injection and mangled text.

## Evidence in your project
- `buildRaw` encodes the subject as RFC 2047 base64 (`=?UTF-8?B?...?=`) and the body as base64 with UTF-8.
- The recipient regex excludes whitespace, so line breaks cannot be smuggled into headers.
- A test decodes the output and checks the body matches exactly.

## Takeaway
International text works and headers cannot be injected through user fields.
