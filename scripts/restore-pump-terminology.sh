#!/bin/bash

# Restore Thompson's pump terminology in test files
# This script replaces generic product terms with Thompson's specific terms

FILES=(
  "__tests__/integration/agent-flow-e2e.test.ts"
  "__tests__/integration/agent4-pronoun-correction-tests.test.ts"
  "__tests__/integration/conversation-metadata-e2e.test.ts"
  "__tests__/integration/multi-turn-conversation-e2e-agent-tests.test.ts"
  "__tests__/lib/agents/customer-service-agent-intelligent.test.ts"
  "__tests__/lib/agents/customer-service-agent.test.ts"
  "__tests__/enhanced-context-scenarios.test.ts"
  "__tests__/api/chat/metadata-integration.test.ts"
  "__tests__/lib/chat/conversation-metadata-integration.test.ts"
  "__tests__/lib/chat/response-parser-core.test.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Backup
    cp "$file" "$file.bak"

    # Test query replacements
    sed -i '' "s/'Show me products'/'Show me pumps'/g" "$file"
    sed -i '' 's/"Show me products"/"Show me pumps"/g' "$file"
    sed -i '' "s/Show me all available products/Show me all available pumps/g" "$file"
    sed -i '' "s/Show me hydraulic products/Show me hydraulic pumps/g" "$file"
    sed -i '' "s/Do you have any products/Do you have any pumps/g" "$file"

    # Comment and documentation replacements
    sed -i '' "s/about products/about pumps/g" "$file"
    sed -i '' "s/the products/the pumps/g" "$file"
    sed -i '' "s/available products/available pumps/g" "$file"
    sed -i '' "s/product search/pump search/g" "$file"

    echo "✓ Completed $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "Done! Review changes with: git diff"
echo "To restore backups if needed: for f in __tests__/**/*.bak; do mv \"\$f\" \"\${f%.bak}\"; done"
