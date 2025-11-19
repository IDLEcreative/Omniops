# Pod Orchestrator Quick Reference

**Type:** Reference - Quick Decision Guide
**Status:** Active
**Last Updated:** 2025-11-19

---

## Decision Tree (30 Seconds)

```
Pod has 25+ files?
├─ NO → Use direct pod agent ✅
└─ YES → Continue...

Security/bugs/implementation?
├─ YES → Use direct pod agent ✅
└─ NO → Continue...

Research/analysis/documentation?
├─ YES → Use pod orchestrator with safeguards ✅
└─ NO → Use direct pod agent ✅
```

---

## Key Numbers

| Metric | Value | Meaning |
|--------|-------|---------|
| **Minimum pod size** | 25 files | Below this, use direct pods |
| **Context savings** | 76.7% | With safeguards |
| **Critical preservation** | 100% | With safeguards |
| **Token cost** | 1,500-2,000 | Per orchestrated pod |
| **Sweet spot** | 50-100 files | Best ROI |

---

## Safe Use Cases

✅ Documentation quality analysis
✅ Pattern identification across files
✅ Code exploration/research
✅ Style guide validation
✅ Architecture review
✅ Dependency analysis

---

## Unsafe Use Cases

❌ Security vulnerability detection
❌ Critical bug fixing
❌ Production code changes
❌ Compliance/audit work
❌ Implementation requiring file:line precision

---

## Template (Copy-Paste)

```markdown
## Pod [X] Orchestrator - [Domain]

**CRITICAL RULES:**

1. **Preserve Critical Issues Verbatim (100%)**
   - ✅ COPY exactly as written
   - ✅ PRESERVE file:line refs
   - ❌ DO NOT summarize critical issues

2. **Verification Checklist**
   - [ ] Critical count matches sub-agents
   - [ ] All have file:line refs
   - [ ] Severity preserved

**Token Budget:**
- Critical: NO LIMIT
- Important: ~600-800
- Minor: ~200-300

## Deploy Sub-Agents

[Deploy 3 sub-agents in parallel]

## Consolidate

### Critical Issues (EXACT COPY)
[List each critical issue separately]

### Important Findings
[Preserve file refs, may group identical]

### Minor Issues
[Summary allowed]
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| ❌ Using for <25 files | Use direct pod instead |
| ❌ No verification checklist | Always verify counts match |
| ❌ "Summarize everything" | Only summarize Info-level |
| ❌ Security-critical work | Use direct pods for security |
| ❌ No token limit for critical | "NO LIMIT" for critical section |

---

## Quick Comparison

| Approach | Tokens | Critical | Use When |
|----------|--------|----------|----------|
| **Direct Pods** | 7,950 | 100% ✅ | <25 files or critical work |
| **Orchestrator (no safeguards)** | 750 | 0% ❌ | NEVER USE |
| **Orchestrator (with safeguards)** | 1,850 | 100% ✅ | 25+ files, research work |

---

## Validation Checklist

First time using orchestrators? Verify:

- [ ] Read orchestrator report
- [ ] Check 2-3 critical issues against sub-reports
- [ ] Verify file:line refs are accurate
- [ ] Confirm you can implement fixes from report
- [ ] All critical issues have severity labels

---

## Resources

- **Full Guide:** [GUIDE_POD_ORCHESTRATOR_SAFEGUARDS.md](../02-GUIDES/GUIDE_POD_ORCHESTRATOR_SAFEGUARDS.md)
- **Test Results:** [POD_ORCHESTRATOR_SAFEGUARDS_VALIDATION.md](../../ARCHIVE/completion-reports-2025-11/POD_ORCHESTRATOR_SAFEGUARDS_VALIDATION.md)
- **CLAUDE.md:** Lines 1189-1314

---

**Remember:** ALWAYS use safeguards template or you'll lose all critical information!