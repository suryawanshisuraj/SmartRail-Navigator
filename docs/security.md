# Security

## Authentication

Use JWT authentication.

## Passwords

Never store plain-text passwords.

Use secure password hashing.

## API Keys

Never put API keys in frontend code.

Use:

.env

## Input Validation

Validate:

- Email
- Password
- User input
- API parameters
- IDs

## Authorization

Roles:

USER
ADMIN
KIOSK

Users must not access admin APIs.

## Error Handling

Do not expose:

- Database credentials
- API keys
- Stack traces
- Internal server information

## QR Security

QR codes should contain location identifiers,
not sensitive information.
