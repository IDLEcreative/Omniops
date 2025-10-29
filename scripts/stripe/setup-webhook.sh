#!/bin/bash
# Stripe Webhook Setup Script
# This script sets up webhook forwarding for local development
# Prerequisites: Stripe CLI installed and authenticated

set -e

echo "🔗 Setting up Stripe webhook forwarding..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI not found${NC}"
    echo "Install it with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if authenticated
if ! stripe config --list &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Stripe${NC}"
    echo "Run: stripe login"
    exit 1
fi

echo -e "${GREEN}✅ Stripe CLI ready${NC}"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Development server not detected on port 3000${NC}"
    echo "Make sure to start it with: npm run dev"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo -e "${BLUE}Starting webhook forwarding to localhost:3000/api/stripe/webhook${NC}"
echo ""
echo -e "${YELLOW}📋 Important Instructions:${NC}"
echo "1. Keep this terminal window open while developing"
echo "2. Copy the webhook signing secret that appears below"
echo "3. Add it to your .env.local as STRIPE_WEBHOOK_SECRET"
echo "4. Restart your dev server after adding the secret"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop webhook forwarding${NC}"
echo ""
echo "=========================================="
echo ""

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
