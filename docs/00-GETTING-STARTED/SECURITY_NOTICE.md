# Security Notice

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