#!/bin/bash

# Supabase project details
PROJECT_REF="birugqyuqhiahxvxeyqg"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "Executing SQL migration to fix search_embeddings function..."
echo ""
echo "Unfortunately, Supabase doesn't allow executing DDL statements (CREATE FUNCTION) via API."
echo "You need to run this manually in the Supabase Dashboard."
echo ""
echo "Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
echo "2. Copy the contents of fix-search-embeddings.sql"
echo "3. Paste and execute in the SQL editor"
echo ""
echo "The SQL file is located at: $(pwd)/fix-search-embeddings.sql"
echo ""
echo "Opening the SQL file for you to copy..."

# Display the SQL content
cat fix-search-embeddings.sql