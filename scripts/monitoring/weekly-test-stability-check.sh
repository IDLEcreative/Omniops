#!/bin/bash
# Weekly Test Stability Check
#
# Purpose: Automatically run test stability monitoring and generate weekly reports
# Schedule: Run this via cron every Monday at 9:00 AM
#
# Crontab entry:
# 0 9 * * 1 cd /Users/jamesguy/Omniops && bash scripts/monitoring/weekly-test-stability-check.sh
#
# Or use launchd on macOS:
# See: scripts/monitoring/com.omniops.test-stability.plist

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs/test-stability"
REPORT_DIR="$PROJECT_ROOT/logs/test-stability/weekly-reports"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
WEEKLY_REPORT="$REPORT_DIR/report_$TIMESTAMP.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "  Weekly Test Stability Check"
echo "  $(date)"
echo "============================================"
echo ""

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

cd "$PROJECT_ROOT"

# Step 1: Run tests with monitoring
echo "📊 Step 1: Running tests with stability monitoring..."
if npm run monitor:test-stability > "$LOG_DIR/test-run-$TIMESTAMP.log" 2>&1; then
  echo -e "${GREEN}✅ Tests completed successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Tests completed with some failures (this is OK for monitoring)${NC}"
fi

# Step 2: Generate detailed report
echo ""
echo "📄 Step 2: Generating stability report..."
npm run monitor:test-report > "$WEEKLY_REPORT" 2>&1
echo -e "${GREEN}✅ Report generated: $WEEKLY_REPORT${NC}"

# Step 3: Analyze patterns
echo ""
echo "📈 Step 3: Analyzing patterns..."
npm run monitor:test-analyze > "$LOG_DIR/analysis-$TIMESTAMP.log" 2>&1
echo -e "${GREEN}✅ Pattern analysis complete${NC}"

# Step 4: Extract key metrics for summary
echo ""
echo "============================================"
echo "  Summary"
echo "============================================"

# Parse the report for key metrics
if [ -f "$WEEKLY_REPORT" ]; then
  echo ""
  echo "Key Metrics:"
  grep -A 3 "## Summary" "$WEEKLY_REPORT" | tail -n 3

  echo ""
  echo "Recommendations:"
  grep -A 20 "## Recommendations" "$WEEKLY_REPORT" | tail -n 20
fi

# Step 5: Check for SIGKILL threshold alert
SIGKILL_COUNT=$(grep -c "SIGKILL" "$LOG_DIR/test-run-$TIMESTAMP.log" || echo "0")

if [ "$SIGKILL_COUNT" -gt 0 ]; then
  echo ""
  echo -e "${RED}⚠️  ALERT: SIGKILL detected $SIGKILL_COUNT times in this test run${NC}"
  echo "   Review report at: $WEEKLY_REPORT"

  # Optional: Send alert (email, Slack, etc.)
  # notify_alert "SIGKILL detected in test stability check"
else
  echo ""
  echo -e "${GREEN}✅ No SIGKILL occurrences detected${NC}"
fi

# Step 6: Archive old reports (keep last 12 weeks)
echo ""
echo "🗂️  Step 6: Archiving old reports..."
find "$REPORT_DIR" -name "report_*.md" -mtime +84 -delete
echo -e "${GREEN}✅ Cleanup complete${NC}"

# Step 7: Generate trend comparison
echo ""
echo "============================================"
echo "  4-Week Trend"
echo "============================================"

# Get the last 4 reports for comparison
RECENT_REPORTS=$(ls -t "$REPORT_DIR"/report_*.md 2>/dev/null | head -n 4)

if [ -n "$RECENT_REPORTS" ]; then
  echo "Last 4 weekly reports:"
  for report in $RECENT_REPORTS; do
    report_date=$(basename "$report" | sed 's/report_\(.*\)\.md/\1/')
    sigkill_freq=$(grep "SIGKILL Frequency:" "$report" | awk '{print $NF}' || echo "N/A")
    success_rate=$(grep "Average Success Rate:" "$report" | awk '{print $NF}' || echo "N/A")
    echo "  $report_date - Success: $success_rate, SIGKILL: $sigkill_freq"
  done
else
  echo "  (Not enough historical data yet)"
fi

echo ""
echo "============================================"
echo "  Weekly Test Stability Check Complete"
echo "============================================"
echo ""
echo "📊 Full report: $WEEKLY_REPORT"
echo "📁 Test log: $LOG_DIR/test-run-$TIMESTAMP.log"
echo "📈 Analysis: $LOG_DIR/analysis-$TIMESTAMP.log"
echo ""