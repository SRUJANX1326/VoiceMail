# Google OAuth 2.0 Security Notes

If Google sign-in or delegated access is implemented:
- Request only the scopes needed for the feature.
- Verify tokens and redirect URIs correctly.
- Keep client secrets on a trusted server.
- Never ask users to paste passwords or access tokens into chat.
- Handle revoked grants and expired tokens.
- Document what data is accessed and why.

Status: Guidance for implementation and review.
