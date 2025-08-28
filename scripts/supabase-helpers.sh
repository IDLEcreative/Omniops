#!/bin/bash

# Supabase CLI Helper Scripts
# Usage: source ./scripts/supabase-helpers.sh

# Set your Supabase access token (add to your shell profile for persistence)
export SUPABASE_ACCESS_TOKEN=sbp_07995d9918ee19ab0b37fd1f1b0dbe5bbd6e21c9
export SUPABASE_PROJECT_ID=birugqyuqhiahxvxeyqg

# Generate TypeScript types from database
generate_types() {
    echo "Generating TypeScript types from Supabase database..."
    supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/supabase.ts
    echo "Types generated successfully at types/supabase.ts"
}

# Pull database schema changes
pull_schema() {
    echo "Pulling database schema from Supabase..."
    supabase db pull --project-id $SUPABASE_PROJECT_ID
    echo "Schema pulled successfully"
}

# Create a new migration
new_migration() {
    if [ -z "$1" ]; then
        echo "Usage: new_migration <migration_name>"
        return 1
    fi
    supabase migration new "$1"
    echo "Migration created: supabase/migrations/$(date +%Y%m%d%H%M%S)_$1.sql"
}

# List all migrations
list_migrations() {
    echo "Current migrations:"
    ls -la supabase/migrations/*.sql
}

# Start Supabase locally (requires Docker)
start_local() {
    echo "Starting Supabase locally..."
    supabase start
}

# Stop local Supabase
stop_local() {
    echo "Stopping local Supabase..."
    supabase stop
}

# Show available commands
show_commands() {
    echo "Available Supabase helper commands:"
    echo "  generate_types  - Generate TypeScript types from database"
    echo "  pull_schema     - Pull remote database schema"
    echo "  new_migration   - Create a new migration file"
    echo "  list_migrations - List all migration files"
    echo "  start_local     - Start Supabase locally (requires Docker)"
    echo "  stop_local      - Stop local Supabase"
    echo ""
    echo "Direct Supabase CLI commands:"
    echo "  supabase status       - Show local Supabase status"
    echo "  supabase db reset     - Reset local database"
    echo "  supabase db push      - Push local migrations to remote"
}

echo "Supabase helpers loaded! Run 'show_commands' to see available commands."