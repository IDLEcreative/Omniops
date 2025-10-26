#!/bin/bash
# Brand Reference Monitoring Script
# Purpose: Monitor application logs for hardcoded brand references
# Usage: ./scripts/monitor-brand-references.sh [log-file]

LOG_FILE="${1:-/var/log/app.log}"
ALERT_EMAIL="${BRAND_ALERT_EMAIL:-}"

# Brand terms to monitor
BRANDS=(
  "thompsonseparts"
  "Thompson's"
  "Thompsons"
  "Cifa"
  "Agri Flip"
  "agri-flip"
  "A4VTG90"
  "K2053463"
)

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Starting brand reference monitoring..."
echo "📄 Log file: $LOG_FILE"
echo "⏰ Started at: $(date)"
echo ""

# Create pattern for grep
PATTERN=$(IFS="|"; echo "${BRANDS[*]}")

# Monitor log file in real-time
tail -f "$LOG_FILE" | grep --line-buffered -iE "$PATTERN" | while read -r line; do
  echo -e "${RED}⚠️  BRAND REFERENCE DETECTED${NC}"
  echo -e "${YELLOW}Timestamp: $(date)${NC}"
  echo -e "${YELLOW}Log entry: $line${NC}"
  echo ""

  # Send alert email if configured
  if [ -n "$ALERT_EMAIL" ]; then
    echo "Brand reference detected: $line" | mail -s "⚠️ Brand Reference Alert" "$ALERT_EMAIL"
  fi
done
