#!/bin/bash

# Migrate from customerId/customer_id to organizationId/organization_id

echo "🔄 Migrating from customerId to organizationId..."

# Update TypeScript/JavaScript files
find lib/autonomous -name "*.ts" -type f -exec sed -i '' 's/customerId/organizationId/g' {} +
find lib/autonomous -name "*.ts" -type f -exec sed -i '' 's/customer_id/organization_id/g' {} +

find app/api/autonomous -name "*.ts" -type f -exec sed -i '' 's/customerId/organizationId/g' {} +
find app/api/autonomous -name "*.ts" -type f -exec sed -i '' 's/customer_id/organization_id/g' {} +

echo "✅ Migration complete!"

echo ""
echo "📋 Updated files:"
echo "   - lib/autonomous/**/*.ts"
echo "   - app/api/autonomous/**/*.ts"

echo ""
echo "⚠️  Manual updates still needed:"
echo "   - API route comments that reference 'customer'"
echo "   - Documentation files"
echo "   - Test files"
