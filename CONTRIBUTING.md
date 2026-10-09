# Contributing to VoiceMail

Thank you for helping improve VoiceMail, a voice-first, AI-assisted communication workflow.

## Before You Start

1. Read `README.md` for project capabilities and limitations.
2. Follow `SetUp.md` (if present) to configure the development environment.
3. Never commit `.env` files, credentials, OAuth tokens, real user messages, or private test data.
4. For substantial changes, open an issue first so the proposed behavior can be discussed.

## Suggested Workflow

1. Create a focused branch.
2. Make the smallest change that solves the problem.
3. Run the available checks from the relevant package directory.
4. Test both the successful path and at least one failure path.
5. Update documentation when behavior, configuration, or limitations change.
6. Open a pull request describing the problem, solution, testing performed, and any security or privacy implications.

## Quality Guidelines

- Prefer clear, maintainable code over clever shortcuts.
- Validate untrusted input at the backend boundary.
- Keep provider integrations behind small, testable functions.
- Do not allow AI output alone to authorize external actions.
- Keep email sending behind explicit user confirmation and server-side checks.
- Do not claim a test passed unless it was actually run.
- Include screenshots or a short recording for user-interface changes when practical.

## Pull Request Checklist

- [ ] The change has a clear purpose.
- [ ] Existing behavior is preserved unless intentionally changed.
- [ ] Relevant tests or manual verification were performed.
- [ ] Documentation and example environment variables are updated if needed.
- [ ] No secrets or private data are included.
- [ ] Known limitations are documented.
