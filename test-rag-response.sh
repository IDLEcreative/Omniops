#!/bin/bash

echo "🤖 Testing RAG-Enabled Chat Response"
echo "====================================="
echo ""
echo "Query: 'What tipper sheet systems do you offer for trailers?'"
echo ""
echo "Response from AI:"
echo "-----------------"

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What tipper sheet systems do you offer for trailers?",
    "session_id": "demo-'$(date +%s)'",
    "domain": "thompsonseparts.co.uk",
    "config": {
      "features": {
        "websiteScraping": {
          "enabled": true
        }
      }
    }
  }' | python3 -c "
import json
import sys
import textwrap

data = json.load(sys.stdin)

# Print the AI response
print(textwrap.fill(data.get('message', 'No response'), width=70))
print()

# Print sources if available
if 'sources' in data and data['sources']:
    print('📚 Sources Used by AI:')
    print('---------------------')
    for i, source in enumerate(data['sources'], 1):
        print(f'{i}. {source[\"title\"].strip()}')
        print(f'   URL: {source[\"url\"]}')
        print(f'   Relevance: {source[\"relevance\"]:.1%}')
        print()
else:
    print('⚠️  No sources found - AI used general knowledge')
"