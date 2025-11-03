#!/bin/bash

# Create New 4-Tier Pricing Structure in Stripe
# Based on ARCHITECTURE_PRICING_MODEL.md

set -e

echo "🎯 Creating New 4-Tier Pricing Structure in Stripe..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if authenticated
if ! stripe config --list &> /dev/null; then
    echo "❌ Not authenticated with Stripe. Run: stripe login"
    exit 1
fi

echo -e "${BLUE}Creating products and prices...${NC}"
echo ""

# ------------------------------
# TIER 1: SMALL BUSINESS - £500/month
# ------------------------------
echo -e "${GREEN}Creating Tier 1: Small Business (£500/month)${NC}"

PRODUCT_SMALL=$(stripe products create \
  --name="Small Business" \
  --description="Perfect for growing online shops and local businesses (2,500 conversations/month)" \
  --metadata[tier]="small_business" \
  --metadata[conversations]="2500" \
  --metadata[target_visitors]="20000-100000" \
  --metadata[overage_rate]="0.12" \
  --format=json | jq -r '.id')

PRICE_SMALL=$(stripe prices create \
  --product="${PRODUCT_SMALL}" \
  --unit-amount=50000 \
  --currency=gbp \
  --recurring[interval]=month \
  --metadata[tier]="small_business" \
  --metadata[included_conversations]="2500" \
  --metadata[overage_rate]="0.12" \
  --format=json | jq -r '.id')

echo "  Product ID: ${PRODUCT_SMALL}"
echo "  Price ID: ${PRICE_SMALL}"
echo ""

# ------------------------------
# TIER 2: SME - £1,000/month
# ------------------------------
echo -e "${GREEN}Creating Tier 2: SME (£1,000/month)${NC}"

PRODUCT_SME=$(stripe products create \
  --name="SME" \
  --description="Established e-commerce brands and B2B businesses (5,000 conversations/month)" \
  --metadata[tier]="sme" \
  --metadata[conversations]="5000" \
  --metadata[target_visitors]="100000-500000" \
  --metadata[overage_rate]="0.10" \
  --metadata[popular]="true" \
  --format=json | jq -r '.id')

PRICE_SME=$(stripe prices create \
  --product="${PRODUCT_SME}" \
  --unit-amount=100000 \
  --currency=gbp \
  --recurring[interval]=month \
  --metadata[tier]="sme" \
  --metadata[included_conversations]="5000" \
  --metadata[overage_rate]="0.10" \
  --metadata[popular]="true" \
  --format=json | jq -r '.id')

echo "  Product ID: ${PRODUCT_SME}"
echo "  Price ID: ${PRICE_SME}"
echo ""

# ------------------------------
# TIER 3: MID-MARKET - £5,000/month
# ------------------------------
echo -e "${GREEN}Creating Tier 3: Mid-Market (£5,000/month)${NC}"

PRODUCT_MID=$(stripe products create \
  --name="Mid-Market" \
  --description="Large e-commerce operations and enterprise retailers (25,000 conversations/month)" \
  --metadata[tier]="mid_market" \
  --metadata[conversations]="25000" \
  --metadata[target_visitors]="500000-2000000" \
  --metadata[overage_rate]="0.08" \
  --format=json | jq -r '.id')

PRICE_MID=$(stripe prices create \
  --product="${PRODUCT_MID}" \
  --unit-amount=500000 \
  --currency=gbp \
  --recurring[interval]=month \
  --metadata[tier]="mid_market" \
  --metadata[included_conversations]="25000" \
  --metadata[overage_rate]="0.08" \
  --format=json | jq -r '.id')

echo "  Product ID: ${PRODUCT_MID}"
echo "  Price ID: ${PRICE_MID}"
echo ""

# ------------------------------
# TIER 4: ENTERPRISE - £10,000/month
# ------------------------------
echo -e "${GREEN}Creating Tier 4: Enterprise (£10,000/month)${NC}"

PRODUCT_ENT=$(stripe products create \
  --name="Enterprise" \
  --description="Enterprise-level support with dedicated account management (100,000 conversations/month)" \
  --metadata[tier]="enterprise" \
  --metadata[conversations]="100000" \
  --metadata[target_visitors]="2000000+" \
  --metadata[overage_rate]="0.05" \
  --format=json | jq -r '.id')

PRICE_ENT=$(stripe prices create \
  --product="${PRODUCT_ENT}" \
  --unit-amount=1000000 \
  --currency=gbp \
  --recurring[interval]=month \
  --metadata[tier]="enterprise" \
  --metadata[included_conversations]="100000" \
  --metadata[overage_rate]="0.05" \
  --format=json | jq -r '.id')

echo "  Product ID: ${PRODUCT_ENT}"
echo "  Price ID: ${PRICE_ENT}"
echo ""

# ------------------------------
# OUTPUT CONFIGURATION
# ------------------------------
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All pricing tiers created successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Add these to your .env.local:${NC}"
echo ""
echo "# New 4-Tier Pricing Structure"
echo "NEXT_PUBLIC_STRIPE_SMALL_BUSINESS_PRICE_ID=${PRICE_SMALL}"
echo "NEXT_PUBLIC_STRIPE_SME_PRICE_ID=${PRICE_SME}"
echo "NEXT_PUBLIC_STRIPE_MID_MARKET_PRICE_ID=${PRICE_MID}"
echo "NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=${PRICE_ENT}"
echo ""
echo "# Product IDs (for reference)"
echo "STRIPE_SMALL_BUSINESS_PRODUCT_ID=${PRODUCT_SMALL}"
echo "STRIPE_SME_PRODUCT_ID=${PRODUCT_SME}"
echo "STRIPE_MID_MARKET_PRODUCT_ID=${PRODUCT_MID}"
echo "STRIPE_ENTERPRISE_PRODUCT_ID=${PRODUCT_ENT}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Copy the environment variables above to .env.local"
echo "2. Run the database migration: npx tsx scripts/database/migrate-pricing-model.ts"
echo "3. Update the billing components to use new pricing"
echo "4. Test the checkout flow"
echo ""
echo -e "${YELLOW}Migration Guide:${NC}"
echo "See docs/01-ARCHITECTURE/ARCHITECTURE_PRICING_MODEL.md#migration-from-old-model"
echo ""
