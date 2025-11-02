#!/bin/bash

# Script to fix git push issues with proxy/network restrictions
# This script tries multiple methods to push to GitHub

echo "🔧 Git Push Fix Script"
echo "======================"
echo ""

# Check current git status
echo "📊 Current Git Status:"
git status --short
echo ""

# Show unpushed commits
echo "📝 Unpushed Commits:"
git log origin/main..HEAD --oneline
echo ""

# Method 1: Try with HTTPS and proxy
echo "Method 1: Trying HTTPS with proxy..."
git config remote.origin.url https://github.com/IDLEcreative/Omniops.git
git config http.proxy http://localhost:60674
git config https.proxy http://localhost:60674
if git push origin main 2>&1; then
    echo "✅ Success with HTTPS + proxy!"
    exit 0
else
    echo "❌ HTTPS with proxy failed"
fi
echo ""

# Method 2: Try SSH with SOCKS proxy
echo "Method 2: Trying SSH with SOCKS proxy..."
git config remote.origin.url git@github.com:IDLEcreative/Omniops.git
git config --unset http.proxy 2>/dev/null
git config --unset https.proxy 2>/dev/null
export GIT_SSH_COMMAND="ssh -o ProxyCommand='nc -X 5 -x localhost:60675 %h %p'"
if git push origin main 2>&1; then
    echo "✅ Success with SSH + SOCKS proxy!"
    exit 0
else
    echo "❌ SSH with SOCKS proxy failed"
fi
echo ""

# Method 3: Try direct connection (no proxy)
echo "Method 3: Trying direct connection..."
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy GIT_SSH_COMMAND
if git push origin main 2>&1; then
    echo "✅ Success with direct connection!"
    exit 0
else
    echo "❌ Direct connection failed"
fi
echo ""

# If all methods fail, provide manual instructions
echo "❌ All automatic methods failed."
echo ""
echo "📋 Manual Resolution Options:"
echo "1. Wait for network restrictions to be lifted"
echo "2. Try from a different network/location"
echo "3. Create a bundle for manual transfer:"
echo "   git bundle create omniops-commits.bundle origin/main..HEAD"
echo "4. Use GitHub web interface to upload changes"
echo ""
echo "Your commits are safely stored locally and ready to push when network allows."
echo ""
echo "Current remote URL: $(git config remote.origin.url)"
echo "Current HTTP proxy: $(git config http.proxy || echo 'none')"
echo "Current HTTPS proxy: $(git config https.proxy || echo 'none')"