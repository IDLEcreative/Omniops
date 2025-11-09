#!/bin/bash

# Apply Funnel System Migrations via Supabase Dashboard SQL Editor
#
# This script provides the SQL you need to copy-paste into the Supabase Dashboard

echo "================================================================================================"
echo "  APPLY FUNNEL SYSTEM MIGRATIONS"
echo "================================================================================================"
echo ""
echo "Follow these steps:"
echo ""
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/editor"
echo ""
echo "2. Go to: SQL Editor → New Query"
echo ""
echo "3. Copy and run Migration 1: Conversation Funnel Tracking"
echo "   File: supabase/migrations/20250109000001_conversation_funnel_tracking.sql"
echo ""
echo "4. Copy and run Migration 2: Funnel Alerts"
echo "   File: supabase/migrations/20250109000002_funnel_alerts.sql"
echo ""
echo "OR use Supabase CLI:"
echo "  supabase db push"
echo ""
echo "================================================================================================"
echo ""

# Display file paths
echo "Migration files location:"
echo "  1. $(pwd)/supabase/migrations/20250109000001_conversation_funnel_tracking.sql"
echo "  2. $(pwd)/supabase/migrations/20250109000002_funnel_alerts.sql"
echo ""
