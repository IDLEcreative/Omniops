# Deno Setup for MCP Code Execution

**Type:** Setup Guide
**Status:** Active
**Last Updated:** 2025-11-05
**Purpose:** Instructions for installing Deno to run MCP code execution

---

## Why Deno?

Deno was selected for MCP code execution because:
- ✅ Native TypeScript support (no compilation needed)
- ✅ Sub-100ms cold starts
- ✅ Vercel-compatible (unlike Docker)
- ✅ Granular permission model for security
- ✅ Production-proven (Val Town, Slack, Netlify, Supabase)

See [Sandbox Technology Evaluation](../04-ANALYSIS/ANALYSIS_SANDBOX_TECHNOLOGY_EVALUATION.md) for complete analysis.

---

## Installation Instructions

### Option 1: Homebrew (Recommended for macOS)

```bash
brew install deno
```

**Note:** If you get permission errors, fix Homebrew ownership first:
```bash
sudo chown -R $(whoami) /opt/homebrew
brew install deno
```

### Option 2: Shell Installer

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Add to your shell profile (~/.zshrc or ~/.bashrc):
```bash
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

Reload your shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Option 3: Direct Binary Download

```bash
# Download latest release
cd ~/Downloads
curl -LO https://github.com/denoland/deno/releases/latest/download/deno-x86_64-apple-darwin.zip

# Extract and install
unzip deno-x86_64-apple-darwin.zip
sudo mv deno /usr/local/bin/
chmod +x /usr/local/bin/deno
```

### Option 4: Project-Local Installation

If you prefer to keep Deno isolated to this project:

```bash
# From project root
mkdir -p bin
cd bin
curl -LO https://github.com/denoland/deno/releases/latest/download/deno-x86_64-apple-darwin.zip
unzip deno-x86_64-apple-darwin.zip
chmod +x deno
rm deno-x86_64-apple-darwin.zip
cd ..

# Add to PATH for this project
export PATH="$PWD/bin:$PATH"
```

---

## Verification

After installation, verify Deno is working:

```bash
deno --version
```

You should see output like:
```
deno 1.38.0 (release, x86_64-apple-darwin)
v8 12.0.267.8
typescript 5.2.2
```

Test execution:
```bash
deno eval "console.log('Deno is working!')"
```

Expected output:
```
Deno is working!
```

---

## Permission Test

Verify Deno's security model works:

```bash
# This should work (no permissions needed for eval)
deno eval "console.log('Hello')"

# This should fail (no read permission)
deno eval "await Deno.readTextFile('/etc/passwd')"
```

Expected error:
```
error: Uncaught (in promise) PermissionDenied: Requires read access to "/etc/passwd", run again with the --allow-read flag
```

This confirms Deno's permission model is working correctly.

---

## Project Configuration

For this project, we'll use these Deno permissions:

```bash
deno run \
  --allow-read=./servers \
  --allow-write=/tmp/mcp-execution \
  --no-prompt \
  --no-remote \
  script.ts
```

This restricts execution to:
- **Read**: Only MCP servers directory
- **Write**: Only temporary execution directory
- **Network**: Blocked (no --allow-net)
- **Subprocess**: Blocked (no --allow-run)
- **Environment**: Blocked (no --allow-env)

---

## Troubleshooting

### "deno: command not found"

**Cause:** Deno not in PATH

**Solution:**
```bash
# Find where Deno was installed
which deno

# If using Homebrew
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# If using shell installer
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "Permission denied" when running deno

**Cause:** Executable permissions not set

**Solution:**
```bash
chmod +x $(which deno)
```

### Homebrew ownership errors

**Cause:** Homebrew directories owned by wrong user

**Solution:**
```bash
sudo chown -R $(whoami) /opt/homebrew
```

---

## Next Steps

After installing Deno:

1. ✅ Verify installation with `deno --version`
2. ✅ Test permission model
3. ✅ Continue with [MCP POC Implementation](../04-ANALYSIS/ANALYSIS_MCP_CODE_EXECUTION_IMPLEMENTATION_PLAN.md)

---

## Alternative: Development Without Deno

If you cannot install Deno for any reason, you can:

1. **Use Node.js temporarily** - The POC can work with Node.js vm module (less secure)
2. **Use Vercel deployment** - Deploy to Vercel which has Deno support built-in
3. **Use Docker** - Run Deno in a container (slower but works)

These are temporary workarounds. Production deployment requires actual Deno.

---

## Related Documentation

- [Sandbox Technology Evaluation](../04-ANALYSIS/ANALYSIS_SANDBOX_TECHNOLOGY_EVALUATION.md) - Why Deno was chosen
- [Security Architecture](../03-REFERENCE/REFERENCE_MCP_SECURITY_ARCHITECTURE.md) - Security model
- [Technical Specification](../03-REFERENCE/REFERENCE_MCP_CODE_EXECUTION_TECHNICAL_SPEC.md) - Complete implementation spec
