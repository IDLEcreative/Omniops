# Setting Up MCP Server for Customer Service Supabase Project

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 6 minutes

## Purpose
This MCP (Model Context Protocol) server allows Claude to directly interact with your Supabase project (`birugqyuqhiahxvxeyqg`) to manage database operations.

## Quick Links
- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Available MCP Commands](#available-mcp-commands)
- [Security Notes](#security-notes)
- [Testing the Connection](#testing-the-connection)

## Keywords
available, commands, connection, details, instructions, mcp, notes, overview, project, security

---


## Overview
This MCP (Model Context Protocol) server allows Claude to directly interact with your Supabase project (`birugqyuqhiahxvxeyqg`) to manage database operations.

## Setup Instructions

### Option 1: Using Claude Desktop App

1. Open Claude Desktop settings
2. Go to Developer Settings > MCP Servers
3. Add a new server with these details:
   - **Name**: `supabase-customer-service`
   - **Command**: `npx`
   - **Arguments**: `-y @supabase/mcp-server-supabase@latest`
   - **Environment Variables**:
     - `SUPABASE_URL`: `https://birugqyuqhiahxvxeyqg.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: (use the key from .env.local)

### Option 2: Using Configuration File

1. Copy the configuration to Claude's config directory:
   ```bash
   # macOS
   cp mcp-supabase-config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Or merge with existing config if you have one
   ```

2. Restart Claude Desktop

### Option 3: Using Claude CLI

```bash
# Install the MCP server globally (optional)
npm install -g @supabase/mcp-server-supabase

# Set environment variables
export SUPABASE_URL="https://birugqyuqhiahxvxeyqg.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run with Claude
claude mcp add supabase-customer-service
```

## Available MCP Commands

Once configured, Claude can use these Supabase operations:

### Database Operations
- `list_tables` - List all tables in the database
- `execute_sql` - Run SQL queries
- `apply_migration` - Apply database migrations

### Customer Tables Management
- Create/read/update/delete operations on:
  - `conversations`
  - `messages`
  - `customer_verifications`
  - `customer_access_logs`
  - `customer_data_cache`
  - `customer_configs`

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit the service role key to git**
   - The `mcp-supabase-config.json` file contains sensitive credentials
   - Add it to `.gitignore` if not already there

2. **Service Role Key Access**
   - This key bypasses Row Level Security (RLS)
   - Only use in secure, server-side environments
   - Never expose in client-side code

3. **Environment Variables**
   - Consider using environment variables instead of hardcoding:
   ```json
   {
     "env": {
       "SUPABASE_URL": "${SUPABASE_URL}",
       "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
     }
   }
   ```

## Testing the Connection

After setup, ask Claude to test the connection:
```
"Can you list the tables in my Supabase project using the MCP?"
```

## Project Details

- **Project ID**: `birugqyuqhiahxvxeyqg`
- **Project URL**: https://birugqyuqhiahxvxeyqg.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg

## Troubleshooting

### MCP Not Connecting
1. Ensure Claude Desktop is up to date
2. Check that the service role key is correct
3. Verify the project URL matches your .env.local

### Tables Not Found
1. Run the SQL script in `scripts/create-customer-tables.sql`
2. Check the Supabase Dashboard to confirm tables exist
3. Verify you're using the correct project

### Permission Errors
1. Ensure you're using the service role key, not the anon key
2. Check that RLS policies are properly configured
3. Verify the key hasn't expired or been regenerated
