#!/bin/bash

echo "Testing chat API directly with curl..."
echo "=================================="

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What tipper sheet systems do you offer?",
    "session_id": "test-'$(date +%s)'",
    "domain": "thompsonseparts.co.uk",
    "config": {
      "features": {
        "websiteScraping": {
          "enabled": true
        }
      }
    }
  }' | python3 -m json.tool

echo ""
echo "=================================="
echo "If sources array is populated, RAG is working!"