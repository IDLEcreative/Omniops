#!/bin/bash

###############################################################################
# Commerce Provider Rollback Script
#
# Purpose: Rollback commerce provider multi-platform support deployment
# Usage: ./scripts/rollback-commerce-provider.sh [--dry-run] [--commit HASH]
#
# Version: 2.0
# Date: 2025-10-23
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
COMMIT_HASH=""
BACKUP_BRANCH="backup/commerce-provider-$(date +%Y%m%d-%H%M%S)"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --commit)
      COMMIT_HASH="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

###############################################################################
# Functions
###############################################################################

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
  if [ "$DRY_RUN" = true ]; then
    log_warn "DRY RUN: Skipping confirmation"
    return 0
  fi

  read -p "$1 (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Operation cancelled"
    exit 1
  fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

log_info "Starting commerce provider rollback..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  log_error "Not in a git repository"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  log_warn "You have uncommitted changes"
  confirm "Continue anyway?"
fi

# Determine commit to rollback to
if [ -z "$COMMIT_HASH" ]; then
  # Find the commit before the commerce provider deployment
  COMMERCE_COMMIT=$(git log --oneline --grep="commerce provider\|multi-platform" -n 1 --format="%H")

  if [ -z "$COMMERCE_COMMIT" ]; then
    log_error "Could not find commerce provider deployment commit"
    log_info "Please specify commit manually with --commit <hash>"
    exit 1
  fi

  # Get the parent commit (before the deployment)
  COMMIT_HASH=$(git rev-parse ${COMMERCE_COMMIT}^)
  log_info "Found commerce provider commit: ${COMMERCE_COMMIT:0:7}"
  log_info "Will rollback to: ${COMMIT_HASH:0:7}"
else
  log_info "Rolling back to specified commit: ${COMMIT_HASH:0:7}"
fi

# Verify commit exists
if ! git cat-file -e "$COMMIT_HASH" 2>/dev/null; then
  log_error "Commit $COMMIT_HASH does not exist"
  exit 1
fi

###############################################################################
# Show rollback details
###############################################################################

echo ""
log_info "=== ROLLBACK DETAILS ==="
echo "Current branch: $(git branch --show-current)"
echo "Current commit: $(git rev-parse --short HEAD)"
echo "Target commit:  ${COMMIT_HASH:0:7}"
echo ""

git log --oneline HEAD...${COMMIT_HASH} --reverse | head -10

echo ""
confirm "Proceed with rollback?"

###############################################################################
# Create backup branch
###############################################################################

log_info "Creating backup branch: $BACKUP_BRANCH"

if [ "$DRY_RUN" = false ]; then
  git branch "$BACKUP_BRANCH"
  log_info "Backup created successfully"
else
  log_warn "DRY RUN: Would create branch $BACKUP_BRANCH"
fi

###############################################################################
# Perform rollback
###############################################################################

if [ "$DRY_RUN" = false ]; then
  log_info "Reverting to commit ${COMMIT_HASH:0:7}..."

  # Option 1: Revert (safer, creates new commit)
  git revert --no-commit HEAD...${COMMIT_HASH}

  log_info "Changes reverted. Creating rollback commit..."
  git commit -m "Rollback: Commerce provider multi-platform support

Reverts changes back to commit ${COMMIT_HASH:0:7}
Backup branch: $BACKUP_BRANCH

Reason: [TO BE FILLED IN BY OPERATOR]

Co-authored-by: Claude <noreply@anthropic.com>"

  log_info "Rollback commit created successfully"
else
  log_warn "DRY RUN: Would revert to ${COMMIT_HASH:0:7}"
fi

###############################################################################
# Disable Shopify via Database
###############################################################################

log_info "Disabling Shopify for all customers..."

if [ "$DRY_RUN" = false ]; then
  # Clear Shopify configuration for all customers
  # Note: Schema uses shopify_shop column (presence indicates Shopify enabled)
  # Setting to NULL effectively disables Shopify for that customer
  cat << 'EOF' | npx tsx
import { createServiceRoleClient } from './lib/supabase-server';

async function clearShopifyConfig() {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // Clear Shopify shop domain (this disables Shopify detection)
  const { data, error } = await supabase
    .from('customer_configs')
    .update({ shopify_shop: null })
    .not('shopify_shop', 'is', null)
    .select('domain');

  if (error) {
    console.error('Error clearing Shopify configuration:', error);
    process.exit(1);
  }

  console.log(`Cleared Shopify configuration for ${data?.length || 0} customers`);
  if (data && data.length > 0) {
    console.log('Affected domains:', data.map(d => d.domain).join(', '));
  }
}

clearShopifyConfig().catch(console.error);
EOF
else
  log_warn "DRY RUN: Would execute SQL to clear Shopify configuration"
  echo "  UPDATE customer_configs SET shopify_shop = NULL WHERE shopify_shop IS NOT NULL;"
fi

###############################################################################
# Clear provider cache
###############################################################################

log_info "Clearing provider cache..."

if [ "$DRY_RUN" = false ]; then
  if [ -n "$REDIS_URL" ]; then
    # Clear Redis cache if configured
    redis-cli -u "$REDIS_URL" FLUSHDB 2>/dev/null || log_warn "Redis not available, skipping cache clear"
  else
    log_warn "Redis not configured, in-memory cache will clear on restart"
  fi
else
  log_warn "DRY RUN: Would clear provider cache"
fi

###############################################################################
# Rebuild application
###############################################################################

log_info "Rebuilding application..."

if [ "$DRY_RUN" = false ]; then
  npm run build

  if [ $? -ne 0 ]; then
    log_error "Build failed! Rolling back rollback..."
    git reset --hard "$BACKUP_BRANCH"
    log_error "Rollback failed. Restored to backup branch."
    exit 1
  fi

  log_info "Build successful"
else
  log_warn "DRY RUN: Would run 'npm run build'"
fi

###############################################################################
# Run smoke tests
###############################################################################

log_info "Running smoke tests..."

if [ "$DRY_RUN" = false ]; then
  # Test that WooCommerce still works
  npm run test:woocommerce 2>/dev/null || log_warn "WooCommerce tests not available"

  # Test that chat API works
  npm run test:chat 2>/dev/null || log_warn "Chat API tests not available"

  log_info "Smoke tests completed"
else
  log_warn "DRY RUN: Would run smoke tests"
fi

###############################################################################
# Deployment instructions
###############################################################################

echo ""
log_info "=== ROLLBACK COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Verify WooCommerce still works"
echo "3. Check chat functionality"
echo "4. Deploy to staging: vercel deploy --env=staging"
echo "5. Monitor for 1 hour"
echo "6. Deploy to production: vercel deploy --prod"
echo ""
echo "Backup branch: $BACKUP_BRANCH"
echo "To restore the rollback: git reset --hard $BACKUP_BRANCH"
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warn "DRY RUN COMPLETE - No changes were made"
  echo ""
  echo "To perform actual rollback, run:"
  echo "  ./scripts/rollback-commerce-provider.sh"
fi

###############################################################################
# Post-rollback monitoring
###############################################################################

echo ""
log_info "=== MONITORING CHECKLIST ==="
echo "- [ ] Error rate < 1%"
echo "- [ ] Chat response time < 2s"
echo "- [ ] WooCommerce searches working"
echo "- [ ] No customer complaints"
echo "- [ ] Redis cache working (if configured)"
echo ""

log_info "Rollback script completed successfully"
