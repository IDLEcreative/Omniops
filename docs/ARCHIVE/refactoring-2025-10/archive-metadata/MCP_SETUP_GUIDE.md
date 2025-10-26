# MCP Server Setup Guide for Claude Code

This guide documents how to add MCP (Model Context Protocol) servers to Claude Code, using the Supabase MCP server as a reference implementation.

## Table of Contents
- [Understanding MCP Servers](#understanding-mcp-servers)
- [Configuration File Structure](#configuration-file-structure)
- [Step-by-Step Setup Process](#step-by-step-setup-process)
- [Common MCP Server Configurations](#common-mcp-server-configurations)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Understanding MCP Servers

MCP servers are bridge applications that allow Claude Code to interact with external services and tools. They:
- Run as separate processes spawned by Claude Code
- Communicate via JSON-RPC protocol
- Provide tools and resources that Claude can use
- Are configured via `.mcp.json` in your project root

## Configuration File Structure

### Basic Structure
```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

### Field Explanations
- `mcpServers`: Root object containing all server configurations
- `server-name`: Unique identifier for your server (you choose this)
- `command`: The executable to run (e.g., `npx`, `node`, `python`)
- `args`: Array of command-line arguments
- `env`: Environment variables passed to the server process

## Step-by-Step Setup Process

### 1. Identify Required Information
Before adding any MCP server, gather:
- [ ] NPM package name or executable path
- [ ] Required authentication tokens/credentials
- [ ] Project identifiers or configuration values
- [ ] Any specific flags or options needed

### 2. Check for Existing Configuration
```bash
# Check if .mcp.json already exists
ls -la .mcp.json

# Check for existing environment variables
grep -E "RELEVANT_TOKEN|API_KEY" .env* 2>/dev/null
```

### 3. Create or Update `.mcp.json`
```bash
# If creating new file
touch .mcp.json

# If file exists, back it up first
cp .mcp.json .mcp.json.backup
```

### 4. Add Server Configuration
Edit `.mcp.json` and add your server configuration. If file already has servers, add yours to the existing `mcpServers` object.

### 5. Restart Claude Code
Configuration changes require a restart to take effect:
1. Close Claude Code completely
2. Reopen Claude Code
3. Verify server is loaded (check for available tools)

### 6. Test the Connection
Try using a simple command related to the service to verify it's working.

## Common MCP Server Configurations

### Supabase MCP Server
```json
{
  "mcpServers": {
    "supabase-omni": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

**Configuration Options:**
- `--read-only`: Restrict to read-only operations
- `--features=database,docs`: Limit to specific features
- `--project-ref`: Scope to specific project (recommended)

### GitHub MCP Server (Example)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### Filesystem MCP Server (Example)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/directory"
      ]
    }
  }
}
```

### Multiple Servers Configuration
```json
{
  "mcpServers": {
    "supabase-dev": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase", "--project-ref=dev-project"],
      "env": {"SUPABASE_ACCESS_TOKEN": "dev-token"}
    },
    "supabase-prod": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase", "--project-ref=prod-project", "--read-only"],
      "env": {"SUPABASE_ACCESS_TOKEN": "prod-token"}
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "github-token"}
    }
  }
}
```

## Configuration Patterns

### Using NPX (Recommended for npm packages)
```json
{
  "command": "npx",
  "args": ["-y", "@org/package-name", "--flag"]
}
```
- Automatically downloads latest version
- No local installation required
- `-y` flag skips confirmation prompts

### Using Local Executables
```json
{
  "command": "node",
  "args": ["./path/to/server.js"]
}
```

### Using Python Scripts
```json
{
  "command": "python",
  "args": ["./mcp_server.py", "--config", "config.json"]
}
```

## Environment Variable Management

### Option 1: Hardcoded in .mcp.json
```json
"env": {
  "API_KEY": "sk-1234567890"
}
```
⚠️ Don't commit sensitive tokens to version control!

### Option 2: Reference from .env file
First, ensure tokens are in `.env`:
```bash
SUPABASE_TOKEN=sbp_xxx
GITHUB_TOKEN=ghp_xxx
```

Then manually copy to `.mcp.json` configuration.

### Option 3: Using Environment Variable References (if supported)
Some MCP clients support environment variable expansion:
```json
"env": {
  "API_KEY": "${API_KEY}"
}
```

## Troubleshooting

### Server Not Loading
1. **Check syntax**: Validate JSON syntax with `jq . .mcp.json`
2. **Verify paths**: Ensure executable exists and is accessible
3. **Check logs**: Look in `~/.claude/logs/` for error messages
4. **Restart Claude Code**: Changes require full restart

### Authentication Failures
1. **Verify tokens**: Ensure tokens are valid and not expired
2. **Check scopes**: Token might lack required permissions
3. **Test manually**: Try running the command directly in terminal

### Common Issues and Solutions

**Issue**: "Command not found"
```bash
# Solution: Install Node.js if using npx
node --version  # Should be v18+ or LTS
```

**Issue**: "Permission denied"
```bash
# Solution: Make executable if using local script
chmod +x ./mcp_server.sh
```

**Issue**: "Server timeout"
```json
// Solution: Add timeout configuration if supported
"timeout": 30000  // milliseconds
```

## Security Best Practices

### 1. Token Management
- Never commit tokens to version control
- Use read-only tokens when possible
- Rotate tokens regularly
- Add `.mcp.json` to `.gitignore` if it contains secrets

### 2. Scope Limitation
- Always use project/repo scoping when available
- Enable read-only mode for production environments
- Limit features to only what's needed

### 3. .gitignore Configuration
```gitignore
# MCP Configuration (if contains secrets)
.mcp.json

# Keep template version
!.mcp.json.template
```

### 4. Template File for Team Sharing
Create `.mcp.json.template`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=REPLACE_WITH_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "REPLACE_WITH_TOKEN"
      }
    }
  }
}
```

## Quick Reference Checklist

When adding a new MCP server:

- [ ] Identify the MCP server package/executable
- [ ] Gather required credentials and configuration
- [ ] Create/update `.mcp.json` in project root
- [ ] Add server configuration with unique name
- [ ] Include all required arguments and environment variables
- [ ] Save the file with valid JSON syntax
- [ ] Add `.mcp.json` to `.gitignore` if it contains secrets
- [ ] Restart Claude Code completely
- [ ] Test with a simple command to verify connection
- [ ] Document any project-specific configuration

## Additional Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)

## Notes for Future Additions

When adding new MCP servers to this project:
1. Follow the patterns established above
2. Document any unique configuration requirements
3. Test in development before adding production servers
4. Keep this guide updated with new examples

---
Last Updated: 2025-01-16
Created for: Omniops Project MCP Configuration