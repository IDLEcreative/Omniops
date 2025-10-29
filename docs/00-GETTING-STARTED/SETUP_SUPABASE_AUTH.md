# Supabase Authentication Setup

This document outlines the authentication system that has been implemented for the Customer Service Agent.

## What Has Been Implemented

### 1. Authentication Infrastructure
- **Auth Provider**: Client-side authentication state management using React Context
- **Auth Utilities**: Server-side helper functions for user authentication
- **Protected Routes**: Middleware that protects admin routes from unauthorized access
- **Login/Signup Pages**: Full authentication flow with forms and error handling

### 2. Database Changes
- **Auth Integration**: Linked customers table with Supabase Auth users
- **Row Level Security (RLS)**: Enabled on all tables with proper policies
- **Automatic User Creation**: Trigger that creates customer record on signup
- **Customer Config Updates**: Added customer_id reference for multi-tenant support

### 3. Protected Areas
- `/admin/*` - Admin dashboard and configuration
- `/setup/*` - Initial setup wizard
- API routes now verify authentication before allowing access

## Setup Instructions

### 1. Enable Supabase Auth
In your Supabase dashboard:
1. Go to Authentication → Providers
2. Enable Email provider (enabled by default)
3. Configure email templates if desired
4. Set up redirect URLs for your domain

### 2. Run Database Migrations
Execute the following SQL migrations in order:
1. `001_initial_schema.sql` - Base tables
2. `002_add_auth.sql` - Auth integration and RLS
3. `003_update_customer_configs.sql` - Customer config updates

### 3. Configure Environment Variables
Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Test the Authentication Flow
1. Navigate to `/signup` to create a new account
2. Check your email for verification (if email confirmations are enabled)
3. Login at `/login`
4. Access the admin panel at `/admin`
5. Sign out using the button in the admin panel

## How It Works

### User Registration Flow
1. User signs up with email/password at `/signup`
2. Supabase creates auth.users record
3. Database trigger automatically creates customers record
4. User is redirected to login page
5. After login, user can access protected areas

### Security Features
- **Middleware Protection**: Automatically redirects unauthenticated users
- **Row Level Security**: Users can only access their own data
- **API Authentication**: All API routes verify user authentication
- **Secure Cookie Management**: Auth tokens stored in httpOnly cookies

### Multi-Tenant Architecture
- Each user has their own customer record
- All data is segregated by customer_id
- RLS policies ensure data isolation
- Service role bypasses RLS for admin operations

## Next Steps

### Optional Enhancements
1. **Social Login**: Add Google, GitHub, etc. providers in Supabase
2. **Password Reset**: Implement forgot password flow
3. **Email Verification**: Require email confirmation before access
4. **2FA**: Add two-factor authentication for extra security
5. **User Management**: Build admin interface to manage users

### Production Considerations
1. **Email Configuration**: Set up SMTP in Supabase for production emails
2. **Security Headers**: Review and enhance CSP policies
3. **Rate Limiting**: Add rate limiting to auth endpoints
4. **Monitoring**: Set up auth event tracking and alerts
5. **Backup**: Regular backups of user data

## Troubleshooting

### Common Issues
1. **"Unauthorized" errors**: Check if user is logged in and cookies are set
2. **RLS errors**: Ensure migrations have been run and policies are active
3. **Email not sending**: Configure SMTP settings in Supabase dashboard
4. **Cookie issues**: Check middleware configuration and CORS settings

### Debug Tips
- Check browser DevTools for auth cookies
- Monitor Supabase logs for auth events
- Test RLS policies in Supabase SQL editor
- Verify environment variables are loaded correctly