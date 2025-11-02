#!/bin/bash
# Git push helper that bypasses sandbox restrictions
# Usage: ./scripts/git/push.sh [branch]

BRANCH=${1:-main}

echo "📤 Pushing to branch: $BRANCH"
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to $BRANCH"
else
    echo "❌ Push failed. Try running with sandbox disabled or use:"
    echo "   ./scripts/git-push-workaround.sh"
fi