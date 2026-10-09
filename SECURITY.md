# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities in public issues. Contact the repository maintainer privately through the contact method listed on the GitHub profile. Include the affected component, impact, and steps to reproduce. Do not include real credentials, access tokens, or private user data.

## Security Expectations

VoiceMail handles communication workflows and may connect to third-party accounts. Contributors and deployers should:

- Keep API keys, OAuth client secrets, database credentials, and tokens on the server side.
- Use environment variables for secrets and commit only placeholder values in `.env.example` files.
- Never log message bodies, OAuth tokens, authorization headers, or other sensitive content unnecessarily.
- Validate inputs on the server, enforce user-level authorization for stored data, and treat uploaded files and retrieved email content as untrusted input.
- Require explicit user confirmation before sending an email. WhatsApp handoff should leave the final Send action to the user.
- Use the minimum OAuth scopes needed and provide a way to revoke access.
- Avoid exposing stack traces or secret configuration in production responses.

## Deployment Checklist

- [ ] Production secrets are configured in the hosting provider, not in source control.
- [ ] OAuth redirect URLs are restricted to the intended deployment.
- [ ] Database row-level security / ownership checks are enabled where applicable.
- [ ] Upload size and file-type limits are enforced server-side.
- [ ] Authentication, authorization, and send-confirmation paths have been tested.
- [ ] Logs are reviewed for accidental personal data or secrets.
- [ ] Users understand what information is stored and how to delete it.

This document describes recommended practices; it is not a certification or a claim that every item is currently implemented.
