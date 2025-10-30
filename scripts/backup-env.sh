#!/bin/bash
# Backup .env.local to prevent accidental loss of API keys

BACKUP_DIR=".env-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if .env.local exists and has real keys (not placeholders)
if [ -f ".env.local" ]; then
  if grep -q "eyJ" .env.local; then
    # File has real keys (JWT tokens start with eyJ)
    cp .env.local "$BACKUP_DIR/.env.local.$TIMESTAMP"
    echo "✅ Backed up .env.local to $BACKUP_DIR/.env.local.$TIMESTAMP"

    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/.env.local.* | tail -n +11 | xargs rm -f 2>/dev/null
    echo "🧹 Cleaned old backups (keeping last 10)"
  else
    echo "⚠️  .env.local contains placeholder values - not backing up"
  fi
else
  echo "❌ .env.local not found"
fi
