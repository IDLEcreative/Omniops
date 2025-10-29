# Security Notice

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v2.1.0
**Dependencies:**
- [.env.example](../../.env.example)
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
**Estimated Read Time:** 3 minutes

## Purpose
Critical security advisory documenting removal of all sensitive API keys (Supabase URLs, OpenAI tokens, WooCommerce consumer keys) from version control, providing instructions for obtaining replacement credentials from respective platforms (app.supabase.com, platform.openai.com), implementing API key rotation policies, configuring secrets management for production deployments (Vercel, AWS Secrets Manager, Heroku), and enforcing zero-commit policy for .env.local files.

## Quick Links
- [API Keys Removed](#api-keys-removed)
- [For developers](#for-developers)
- [Security recommendations](#security-recommendations)
- [Environment variable sources](#environment-variable-sources)
- [Production deployment](#production-deployment)

## Keywords
security notice, API key removal, sensitive credentials, .env.local security, Supabase keys removed, OpenAI key rotation, WooCommerce consumer keys, secrets management, zero-commit policy, credential rotation, production secrets, Vercel environment variables, AWS Secrets Manager, openssl rand -hex 16, key restrictions, IP restrictions, domain restrictions

## Aliases
- ".env.local" (also known as: local environment file, development secrets, env file)
- "API key rotation" (also known as: credential rotation, key refresh, security rotation)
- "secrets management" (also known as: credential management, key storage, secrets vault)
- "service role key" (also known as: admin key, backend key, Supabase service key)
- "consumer key" (also known as: WooCommerce API key, REST API credential, integration key)
- "placeholder values" (also known as: example keys, dummy credentials, template values)

---


## API Keys Removed

All sensitive API keys have been removed from `.env.local` and replaced with placeholder values for security reasons.

### What was removed:
- Supabase project URL and keys
- OpenAI API key
- WooCommerce consumer keys

### For developers:
1. Copy `.env.example` to `.env.local`
2. Replace placeholder values with your actual API keys
3. Never commit `.env.local` to version control
4. Use environment variables from your hosting platform for production

### Security recommendations:
- **Rotate any exposed keys immediately** if they were previously committed
- Use different API keys for development and production
- Implement API key rotation policies
- Use secrets management services for production deployments
- Enable API key restrictions where possible (IP restrictions, domain restrictions, etc.)

### Environment variable sources:
- **Supabase**: Get from your project settings at https://app.supabase.com
- **OpenAI**: Generate at https://platform.openai.com/api-keys
- **WooCommerce**: Generate in WooCommerce > Settings > Advanced > REST API
- **Encryption Key**: Generate with `openssl rand -hex 16`

### Production deployment:
For production deployments, set environment variables in your hosting platform:
- **Vercel**: Project Settings > Environment Variables
- **AWS**: AWS Secrets Manager or Systems Manager Parameter Store
- **Heroku**: Config Vars in app settings
- **Docker**: Use secrets management or env files (not committed)

Last updated: January 2025
