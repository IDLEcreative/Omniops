#!/bin/bash

# Permanent workaround for git push restrictions
# This script creates a portable bundle of commits that can be transferred

set -e

echo "🔧 Git Push Workaround Script"
echo "============================="
echo ""
echo "⚠️  Network restrictions detected. Using alternative methods."
echo ""

# Function to show current status
show_status() {
    echo "📊 Repository Status:"
    echo "--------------------"

    # Count unpushed commits
    UNPUSHED=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
    echo "• Unpushed commits: $UNPUSHED"

    if [ "$UNPUSHED" -gt 0 ]; then
        echo ""
        echo "📝 Unpushed Commits:"
        git log origin/main..HEAD --oneline
    fi

    echo ""
    echo "• Current branch: $(git branch --show-current)"
    echo "• Remote URL: $(git config remote.origin.url)"
    echo ""
}

# Function to create a git bundle
create_bundle() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BUNDLE_NAME="omniops_commits_${TIMESTAMP}.bundle"

    echo "📦 Creating Git Bundle..."
    echo "------------------------"

    if git bundle create "$BUNDLE_NAME" origin/main..HEAD; then
        echo "✅ Bundle created: $BUNDLE_NAME"
        echo ""
        echo "📋 To apply this bundle on another machine:"
        echo "1. Transfer the file: $BUNDLE_NAME"
        echo "2. On the target machine, run:"
        echo "   git bundle verify $BUNDLE_NAME"
        echo "   git fetch $BUNDLE_NAME main:temp-branch"
        echo "   git merge temp-branch"
        echo "   git push origin main"
        return 0
    else
        echo "❌ Failed to create bundle"
        return 1
    fi
}

# Function to create a patch file
create_patch() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    PATCH_NAME="omniops_patches_${TIMESTAMP}.patch"

    echo "🔨 Creating Patch File..."
    echo "------------------------"

    if git format-patch origin/main..HEAD --stdout > "$PATCH_NAME"; then
        echo "✅ Patch created: $PATCH_NAME"
        echo ""
        echo "📋 To apply this patch on another machine:"
        echo "1. Transfer the file: $PATCH_NAME"
        echo "2. On the target machine, run:"
        echo "   git am < $PATCH_NAME"
        echo "   git push origin main"
        return 0
    else
        echo "❌ Failed to create patch"
        return 1
    fi
}

# Function to generate commit info for manual entry
generate_commit_info() {
    echo "📝 Commit Information for Manual Push:"
    echo "-------------------------------------"
    echo ""

    git log origin/main..HEAD --format="Commit: %h%nAuthor: %an <%ae>%nDate: %ad%nMessage:%n%B%n----%n" --date=iso

    echo ""
    echo "📋 Files changed:"
    git diff --name-status origin/main..HEAD
}

# Main execution
main() {
    show_status

    if [ "$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")" -eq "0" ]; then
        echo "✅ No unpushed commits. Repository is up to date!"
        exit 0
    fi

    echo "🔄 Creating portable formats for your commits..."
    echo ""

    # Try creating a bundle
    if create_bundle; then
        echo ""
    fi

    # Try creating a patch
    if create_patch; then
        echo ""
    fi

    # Generate commit info
    echo ""
    generate_commit_info

    echo ""
    echo "🎯 Next Steps:"
    echo "-------------"
    echo "1. Use the bundle or patch file to transfer commits"
    echo "2. Or wait for network restrictions to be lifted"
    echo "3. Or manually apply changes using the commit info above"
    echo ""
    echo "💡 Tip: Add this script to your PATH for easy access:"
    echo "   echo 'alias gitfix=\"$PWD/scripts/git-push-workaround.sh\"' >> ~/.zshrc"
}

# Run main function
main "$@"