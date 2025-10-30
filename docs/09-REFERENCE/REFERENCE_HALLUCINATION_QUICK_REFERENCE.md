# Hallucination Prevention Quick Reference

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 4 minutes

## Purpose
Without explicit data in the product content, the AI must NEVER:

## Quick Links
- [🚫 What the AI Must NEVER Do](#-what-the-ai-must-never-do)
- [✅ What the AI Should Do Instead](#-what-the-ai-should-do-instead)
- [🧪 Quick Test Commands](#-quick-test-commands)
- [📍 Key Files](#-key-files)
- [⚡ Emergency Fix](#-emergency-fix)

## Keywords
commands, emergency, files, golden, hallucination, instead, must, never, quick, reference

---


## 🚫 What the AI Must NEVER Do

Without explicit data in the product content, the AI must NEVER:

- ❌ State technical specifications (HP, PSI, dimensions, weight)
- ❌ Claim what's included with a product
- ❌ Provide stock quantities or availability
- ❌ Give delivery timeframes or dates
- ❌ Quote warranty periods or terms
- ❌ Confirm product compatibility
- ❌ Compare prices or offer discounts
- ❌ State manufacturing locations
- ❌ Provide installation instructions

## ✅ What the AI Should Do Instead

When information is missing:

```
"I don't have that specific information available."
"Please contact customer service for [requested details]."
"I don't have specific details about what's included with this product."
```

## 🧪 Quick Test Commands

Test if the AI hallucinates:

```bash
# Test technical specs
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What HP is the A4VTG90 pump?", "session_id": "test", "domain": "thompsonseparts.co.uk"}' \
  | jq -r '.message'

# Test product inclusion
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Does the pump include mounting brackets?", "session_id": "test", "domain": "thompsonseparts.co.uk"}' \
  | jq -r '.message'

# Test stock availability
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many pumps in stock?", "session_id": "test", "domain": "thompsonseparts.co.uk"}' \
  | jq -r '.message'
```

## 📍 Key Files

- **Rules:** `/app/api/chat/route.ts` (lines 701-721, 819-834)
- **Tests:** `/test-hallucination-prevention.ts`
- **Full Docs:** `/docs/HALLUCINATION_PREVENTION.md`

## ⚡ Emergency Fix

If hallucinations are detected in production:

1. **Immediate:** Add the pattern to forbidden responses in `route.ts:708-716`
2. **Test:** Run `npx tsx test-hallucination-prevention.ts`
3. **Deploy:** Push changes immediately
4. **Document:** Update this reference with new pattern

## 🎯 Golden Rule

**When in doubt, admit uncertainty!**

Better to say "I don't have that information" than to guess wrong.
