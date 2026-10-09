# Alternatives to voice-only interaction

**Scoring area:** Accessibility (93/100)

## What graders look for
Users who cannot speak or be heard can still complete tasks.

## Where your project stands
The app is voice-first: wake word, spoken confirmations. There is no text box to type a command or buttons to confirm or cancel the draft. Speech recognition is Chrome/Edge only.

## Gap
Deaf, speech-impaired or noisy-environment users cannot send an email. WCAG success criteria on input modalities favour offering more than one way.

## What to do
1. Add a text input that feeds the same `Dialog.handle()` path as speech.
2. Add visible Confirm and Cancel buttons while the state is `confirm_send` or `confirm_upload`.
3. Show the full draft text as an editable field.
