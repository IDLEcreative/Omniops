#!/bin/bash
# Stripe Integration Test Script
# Tests the complete Stripe integration with automated checks

set -e

echo "🧪 Testing Stripe Integration..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check environment variables
echo -e "${BLUE}Checking environment variables...${NC}"
MISSING_VARS=0

check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}❌ Missing: $1${NC}"
        MISSING_VARS=1
    else
        echo -e "${GREEN}✓ $1 is set${NC}"
    fi
}

# Load .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

check_env_var "STRIPE_SECRET_KEY"
check_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
check_env_var "STRIPE_WEBHOOK_SECRET"
check_env_var "NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID"
check_env_var "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID"
check_env_var "NEXT_PUBLIC_APP_URL"

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ Some environment variables are missing${NC}"
    echo "Please update your .env.local file"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All environment variables present${NC}"
echo ""

# Check if dev server is running
echo -e "${BLUE}Checking development server...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Development server running on port 3000${NC}"
else
    echo -e "${RED}❌ Development server not running${NC}"
    echo "Start it with: npm run dev"
    exit 1
fi
echo ""

# Test API endpoints
echo -e "${BLUE}Testing API endpoints...${NC}"

# Test 1: Stripe client initialization
echo "Testing /api/stripe/subscription..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stripe/subscription?organizationId=test)
if [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "403" ]; then
    echo -e "${GREEN}✓ Subscription endpoint responding (auth required)${NC}"
else
    echo -e "${YELLOW}⚠️  Subscription endpoint returned: $RESPONSE${NC}"
fi

# Test 2: Billing page
echo "Testing /billing page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/billing)
if [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "307" ] || [ "$RESPONSE" == "401" ]; then
    echo -e "${GREEN}✓ Billing page responding${NC}"
else
    echo -e "${YELLOW}⚠️  Billing page returned: $RESPONSE${NC}"
fi

echo ""

# Check database migrations
echo -e "${BLUE}Checking database schema...${NC}"
echo "Note: This requires Supabase access"
echo -e "${YELLOW}Manual check required:${NC}"
echo "1. Log into Supabase Dashboard"
echo "2. Check that these tables exist:"
echo "   - organizations (with stripe_customer_id, stripe_subscription_id columns)"
echo "   - billing_events"
echo "   - invoices"
echo ""

# Check Stripe products
echo -e "${BLUE}Verifying Stripe products...${NC}"
if command -v stripe &> /dev/null; then
    echo "Checking if price IDs exist in Stripe..."

    if stripe prices retrieve $NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID &> /dev/null; then
        echo -e "${GREEN}✓ Starter price exists${NC}"
    else
        echo -e "${RED}❌ Starter price not found${NC}"
    fi

    if stripe prices retrieve $NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID &> /dev/null; then
        echo -e "${GREEN}✓ Professional price exists${NC}"
    else
        echo -e "${RED}❌ Professional price not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Stripe CLI not installed - skipping product verification${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Basic integration checks complete${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start webhook forwarding: ./scripts/stripe/setup-webhook.sh"
echo "2. Test checkout flow manually in browser"
echo "3. Use test card: 4242 4242 4242 4242"
echo "4. Verify webhook events are received"
echo ""
echo -e "${BLUE}For detailed testing:${NC}"
echo "See /tmp/claude/STRIPE_INTEGRATION_TEST_PLAN.md"
echo ""
