# Google Calendar API Evaluation

Consider Google Calendar integration only if scheduling is central to the app.

Security and quality checklist:
- Request explicit user authorisation.
- Use the smallest necessary OAuth scope.
- Handle time zones and daylight-saving transitions.
- Prevent duplicate event creation on retries.
- Test denied permissions and expired tokens.

Status: Optional integration proposal.
