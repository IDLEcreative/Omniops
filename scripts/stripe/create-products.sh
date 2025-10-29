#!/bin/bash
# Stripe Product Creation Script
# This script creates the Omniops subscription products and prices in Stripe
# Prerequisites: Stripe CLI installed and authenticated (`stripe login`)

set -e  # Exit on error

echo "🚀 Creating Stripe products for Omniops..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install it first:"
    echo "   brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if authenticated
if ! stripe config --list &> /dev/null; then
    echo "❌ Not authenticated with Stripe. Run: stripe login"
    exit 1
fi

echo "✅ Stripe CLI found and authenticated"
echo ""

# Create Starter Product
echo -e "${BLUE}Creating Starter Product...${NC}"
STARTER_PRODUCT=$(stripe products create \
  --name="Omniops Starter" \
  --description="Perfect for small teams getting started with AI customer service. Includes 1,000 messages/month, web scraping, and basic integrations." \
  --format=json)

STARTER_PRODUCT_ID=$(echo $STARTER_PRODUCT | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo -e "${GREEN}✓ Created product: $STARTER_PRODUCT_ID${NC}"

# Create Starter Price
echo -e "${BLUE}Creating Starter Price (£29/month)...${NC}"
STARTER_PRICE=$(stripe prices create \
  --product=$STARTER_PRODUCT_ID \
  --unit-amount=2900 \
  --currency=gbp \
  --recurring[interval]=month \
  --format=json)

STARTER_PRICE_ID=$(echo $STARTER_PRICE | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo -e "${GREEN}✓ Created price: $STARTER_PRICE_ID${NC}"
echo ""

# Create Professional Product
echo -e "${BLUE}Creating Professional Product...${NC}"
PROFESSIONAL_PRODUCT=$(stripe products create \
  --name="Omniops Professional" \
  --description="For growing businesses. Includes 10,000 messages/month, priority support, advanced analytics, and WooCommerce/Shopify integrations." \
  --format=json)

PROFESSIONAL_PRODUCT_ID=$(echo $PROFESSIONAL_PRODUCT | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo -e "${GREEN}✓ Created product: $PROFESSIONAL_PRODUCT_ID${NC}"

# Create Professional Price
echo -e "${BLUE}Creating Professional Price (£99/month)...${NC}"
PROFESSIONAL_PRICE=$(stripe prices create \
  --product=$PROFESSIONAL_PRODUCT_ID \
  --unit-amount=9900 \
  --currency=gbp \
  --recurring[interval]=month \
  --format=json)

PROFESSIONAL_PRICE_ID=$(echo $PROFESSIONAL_PRICE | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo -e "${GREEN}✓ Created price: $PROFESSIONAL_PRICE_ID${NC}"
echo ""

# Create Enterprise Product (no price - custom)
echo -e "${BLUE}Creating Enterprise Product...${NC}"
ENTERPRISE_PRODUCT=$(stripe products create \
  --name="Omniops Enterprise" \
  --description="Custom solution for large organizations. Unlimited messages, dedicated support, custom integrations, and SLA guarantees." \
  --format=json)

ENTERPRISE_PRODUCT_ID=$(echo $ENTERPRISE_PRODUCT | grep -o '"id": "[^"]*' | head -1 | grep -o '[^"]*$')
echo -e "${GREEN}✓ Created product: $ENTERPRISE_PRODUCT_ID${NC}"
echo ""

# Display results
echo "=========================================="
echo "✅ All products created successfully!"
echo "=========================================="
echo ""
echo -e "${YELLOW}📋 Add these to your .env.local:${NC}"
echo ""
echo "NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=$STARTER_PRICE_ID"
echo "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=$PROFESSIONAL_PRICE_ID"
echo ""
echo -e "${YELLOW}📦 Product IDs (for reference):${NC}"
echo "Starter Product:      $STARTER_PRODUCT_ID"
echo "Professional Product: $PROFESSIONAL_PRODUCT_ID"
echo "Enterprise Product:   $ENTERPRISE_PRODUCT_ID"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Copy the price IDs above to your .env.local file"
echo "2. Restart your development server"
echo "3. Run: ./scripts/stripe/setup-webhook.sh"
echo ""
