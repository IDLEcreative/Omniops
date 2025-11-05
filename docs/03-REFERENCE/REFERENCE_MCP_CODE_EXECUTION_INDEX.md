# MCP Code Execution Documentation Index

**Type:** Reference Index
**Status:** Active
**Last Updated:** 2025-11-05
**Purpose:** Guide readers to the appropriate MCP code execution documentation based on their needs

---

## Two Versions Available

We maintain two versions of MCP code execution documentation, each serving different purposes:

### 1. Faithful Reference (Source-Only)
**File:** [REFERENCE_MCP_CODE_EXECUTION_FAITHFUL.md](./REFERENCE_MCP_CODE_EXECUTION_FAITHFUL.md)

**Contains:**
- ✅ **Only** information from Anthropic's article
- ✅ Direct quotes for key concepts
- ✅ Marked inferences where logical conclusions drawn
- ✅ Explicit list of what article does NOT cover

**Content Mix:** 100% from Anthropic's engineering blog

**Use When:**
- Citing Anthropic's official position
- Understanding what Anthropic actually recommends
- Need authoritative source for discussions/decisions
- Writing documentation that requires source attribution
- Verifying claims about MCP best practices

**Example Use Cases:**
- "According to Anthropic, code execution reduces tokens by 98.7%..."
- "Anthropic's article mentions these six benefits..."
- "The official guidance does NOT recommend specific technologies..."

---

### 2. Comprehensive Implementation Guide
**File:** [REFERENCE_MCP_CODE_EXECUTION_COMPREHENSIVE.md](./REFERENCE_MCP_CODE_EXECUTION_COMPREHENSIVE.md)

**Contains:**
- ✅ Core concepts from Anthropic (~11%)
- ✅ Implementation patterns (~25%)
- ✅ Security best practices (~15%)
- ✅ Cost/ROI analysis (~10%)
- ✅ Detailed use cases (~20%)
- ✅ Integration approaches (~10%)
- ✅ Best practices (~9%)

**Content Mix:** ~11% Anthropic article + ~89% community/implementation guidance

**Use When:**
- Planning implementation
- Estimating costs and ROI
- Making architecture decisions
- Evaluating trade-offs
- Need practical deployment guidance
- Want specific technology recommendations

**Example Use Cases:**
- "How do I implement this securely?"
- "What will this cost to deploy?"
- "Which sandbox technology should I use?"
- "What are the implementation best practices?"

---

## Quick Decision Tree

```
Do you need to cite what Anthropic officially stated?
├─ YES → Use FAITHFUL version
└─ NO → Continue...

Do you need implementation details, costs, or specific technologies?
├─ YES → Use COMPREHENSIVE version
└─ NO → Start with FAITHFUL, refer to COMPREHENSIVE for details
```

---

## Content Comparison

| Topic | Faithful | Comprehensive |
|-------|----------|---------------|
| **Core Problem** | ✅ Article's description | ✅ Same + expanded context |
| **98.7% Token Reduction** | ✅ Exact metric cited | ✅ Same + use case examples |
| **File-Based Discovery** | ✅ Pattern described | ✅ Same + implementation code |
| **Six Benefits** | ✅ Article's list | ✅ Same + detailed explanations |
| **Trade-offs** | ✅ Infrastructure complexity | ✅ Same + cost breakdowns |
| **Sandbox Technologies** | ❌ Not in article | ✅ Docker, gVisor, Firecracker, Deno |
| **Cost Analysis** | ❌ Not in article | ✅ $11k-$20k setup, $2k-$4k/mo |
| **ROI Calculations** | ❌ Not in article | ✅ Break-even analysis |
| **Implementation Time** | ❌ Not in article | ✅ 110-200 hours estimated |
| **Security Details** | ❌ Not in article | ✅ Detailed security patterns |
| **Best Practices** | ❌ Not in article | ✅ 10 practices with examples |
| **Use Cases** | ❌ Not in article | ✅ 4 detailed scenarios |

---

## Why Two Versions?

### The Original Problem
The first documentation attempt included extensive implementation guidance, but **89% was extrapolated** from general knowledge rather than the source article. This created two issues:

1. **Attribution confusion:** Unclear what Anthropic said vs. what we inferred
2. **Source fidelity:** Couldn't cite documentation as "Anthropic's position"

### The Solution
Rather than choose between accuracy and usefulness, we maintain both:

- **Faithful** = What Anthropic actually stated (authoritative reference)
- **Comprehensive** = What you need to implement it (practical guide)

Both documents cross-reference each other and clearly label their content sources.

---

## Historical Note

**Original Documentation Created:** 2025-11-05
- Combined Anthropic concepts with implementation guidance
- ~1,842 lines total
- No clear distinction between source and extrapolation

**Documentation Split:** 2025-11-05
- **Faithful version:** 331 lines (100% from article)
- **Comprehensive version:** 1,842 lines (11% article + 89% guidance)
- Clear labeling and cross-references added

This split is an example of the **faithful-docs skill** preventing documentation that mixes authoritative sources with extrapolations.

---

## Related Documentation

- [AGENT_PROMPT_TEMPLATES.md](../../.claude/AGENT_PROMPT_TEMPLATES.md) - Templates that enforce source fidelity
- [VERIFICATION_AGENT_PATTERN.md](../../.claude/VERIFICATION_AGENT_PATTERN.md) - Two-agent verification process
- [faithful-docs Skill](../../.claude/skills/faithful-docs/SKILL.md) - Skill used to create faithful version

---

## For Documentation Authors

When documenting external sources in the future:

1. **Always create faithful version first** using `/faithful-docs` skill
2. **Create comprehensive version separately** if needed for implementation
3. **Label clearly** what's from source vs. what's extrapolated
4. **Cross-reference** between versions
5. **Maintain both** - they serve different audiences

**The Rule:** Source attribution requires source fidelity. Implementation guidance requires practical details. Don't mix them without clear labeling.

---

**Last Review:** 2025-11-05
**Next Review:** 2025-12-05 (monthly, or when source article updates)
