# Security Policy

## Prototype scope

MaterialLoop AI is a public hackathon prototype. Do not upload confidential customer certificates, personal data or controlled industrial information.

## Credential handling

- The browser never receives Google Cloud credentials.
- Local development uses Application Default Credentials.
- Cloud Run uses a dedicated service account.
- `.env`, OAuth tokens, service-account keys and browser profiles must never enter the repository.

## Reporting a security issue

Do not open a public issue containing credentials, private documents or exploit details. Contact the repository owner through the private contact method listed on the owner's GitHub profile.

## Production gaps

The public competition deployment does not provide production authentication, tenant isolation, rate limiting or a commercial data-retention policy. Treat all outputs as synthetic demonstration results.
