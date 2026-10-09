# API Error Handling

For external services such as Google APIs:
- Handle authentication errors, rate limits, server errors, and timeouts.
- Use bounded retries with backoff for retryable errors.
- Do not retry unsafe operations blindly.
- Return a clear, non-sensitive user-facing message.
- Log a correlation ID and error category, not secrets.
- Test offline and quota-exceeded scenarios.
