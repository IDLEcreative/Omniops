**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Customer Journey Testing - Staging Domain

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-30
**Verified For:** v0.1.0
**Dependencies:** [E2E_TESTING_PLAN.md](/home/user/Omniops/TESTING/customer-journey-staging/E2E_TESTING_PLAN.md), [FINDINGS_AND_ISSUES.md](/home/user/Omniops/TESTING/customer-journey-staging/FINDINGS_AND_ISSUES.md)
**Estimated Read Time:** 6 minutes

## Purpose

End-to-end testing documentation for staging domain onboarding and A/B comparison with production.

**Test Scenario:** Pretend to be a new customer setting up an AI chat agent on `epartstaging.wpengine.com` and compare results with production (`thompsonseparts.co.uk`).

---

## 📁 Files in This Folder

### [COMPLETE_FEATURE_INVENTORY.md](./COMPLETE_FEATURE_INVENTORY.md)
**Type:** Feature Catalog (Reference)
**Purpose:** Complete map of all application features

**What's Inside:**
- 36 pages documented
- 121 API endpoints categorized
- 13 dashboard sections with full feature lists
- 91+ UI components mapped
- Integration testing scenarios
- Critical user flows
- Testing priority matrix
- Known limitations and gotchas

**How to Use:**
1. Review before testing to understand full scope
2. Reference during testing to ensure coverage
3. Use testing checklists for each feature
4. Cross-reference with E2E plan for detailed steps

---

### [E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md)
**Type:** Testing Script (Read-Only)
**Purpose:** Your step-by-step testing guide

**What's Inside:**
- 10 phases covering entire customer journey
- Account creation → Widget installation → Chat testing
- Expected results at each step
- Success criteria checklists
- Debugging hints
- Common issues and solutions

**How to Use:**
1. Open this file
2. Follow phases in order (1 → 10)
3. Check off success criteria as you go
4. Document any deviations in FINDINGS_AND_ISSUES.md

---

### [FINDINGS_AND_ISSUES.md](./FINDINGS_AND_ISSUES.md)
**Type:** Working Document (Editable)
**Purpose:** Your testing notebook

**What's Inside:**
- Session log (track multiple testing sessions)
- Issues tracker (bug reports with severity)
- Todo list (action items discovered)
- Decisions made (why you chose certain options)
- Performance observations
- Improvement ideas
- Lessons learned

**How to Use:**
1. Open alongside E2E_TESTING_PLAN.md
2. Document issues AS YOU FIND THEM (don't wait)
3. Rate severity (🔴 Critical → 🟢 Low)
4. Add todos for follow-up
5. Capture insights and observations

---

## 🎯 Testing Goals

### Primary Goal
**Validate that a real customer can successfully:**
1. Create an account
2. Configure a domain
3. Scrape their website
4. Install the widget
5. Have a working AI chat agent

### Secondary Goals
- **A/B Testing:** Compare staging vs production performance
- **UX Evaluation:** Identify confusing or frustrating points
- **Bug Discovery:** Find issues before real customers do
- **Documentation Validation:** Verify guides are accurate

---

## 🚀 Quick Start

**First Time Testing:**
1. Read [E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md) overview (10 min)
2. Open [FINDINGS_AND_ISSUES.md](./FINDINGS_AND_ISSUES.md) in editor
3. Start with Phase 1: Account Creation
4. Document as you go

**Resuming Testing:**
1. Check FINDINGS_AND_ISSUES.md for where you left off
2. Review "Testing Sessions Log" for last session summary
3. Continue from next incomplete phase
4. Update session log when done

---

## 📊 Testing Status

**Last Updated:** 2025-10-30
**Phases Complete:** 0 / 10
**Issues Found:** 0
**Overall Status:** 🔴 Not Started

---

## 🔍 What to Look For

### Critical Issues (Must Fix)
- Widget doesn't load
- Chat doesn't respond
- Hallucinations (making up products/prices)
- Data leakage between domains
- Security vulnerabilities

### Important Issues (Should Fix)
- Slow performance (> 10s response time)
- Confusing UX (user gets lost)
- Missing features expected by customers
- Poor error messages

### Nice-to-Have Improvements
- UI polish
- Better onboarding flow
- Additional customization options
- Performance optimizations

---

## 💡 Testing Tips

1. **Actually Pretend:** Don't cheat by looking at code. Experience what customers experience.

2. **Document Immediately:** Write down issues AS YOU FIND THEM. Don't trust your memory.

3. **Take Screenshots:** Visual evidence is gold for debugging.

4. **Test Edge Cases:** Try weird queries, break things intentionally.

5. **Compare Constantly:** Keep production open in another tab for A/B comparison.

6. **Time Yourself:** Note how long each phase takes - this reveals UX friction.

7. **Think Out Loud:** Imagine explaining each step to a non-technical person. If it's hard to explain, it's probably too complex.

---

## 🐛 Reporting Issues

**When you find an issue:**

1. Stop and document it immediately in FINDINGS_AND_ISSUES.md
2. Include:
   - Phase/step where it occurred
   - What you expected
   - What actually happened
   - Error messages (console, network tab)
   - Screenshot (if relevant)
3. Rate severity (🔴/🟠/🟡/🟢)
4. Add to todo list if it needs fixing
5. Continue testing

**For critical issues:**
- Note in a new conversation: "Found critical issue at Phase X"
- Include exact reproduction steps
- Claude will help debug immediately

---

## 📝 Session Management

### Starting a New Session

1. Open FINDINGS_AND_ISSUES.md
2. Add new session entry with date
3. Note which phases you plan to complete
4. Start testing

### Ending a Session

1. Update session entry with:
   - Time spent
   - Phases completed
   - Overall status
   - Key observations
2. Save file
3. Commit to git (optional but recommended):
   ```bash
   git add TESTING/customer-journey-staging/FINDINGS_AND_ISSUES.md
   git commit -m "test: session X findings - [brief summary]"
   ```

---

## 🔗 Related Resources

**In This Repo:**
- [../../CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Database reference
- [../../docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md](../../docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md) - API docs

**External:**
- Dashboard: https://www.omniops.co.uk/dashboard
- Staging Site: https://epartstaging.wpengine.com
- Production Site: https://www.thompsonseparts.co.uk

---

## 🎬 Next Steps

**Haven't started testing yet?**
1. Read E2E_TESTING_PLAN.md overview
2. Block 2-3 hours for first session
3. Start with Phase 1
4. Go at your own pace - it's okay to split across multiple sessions

**Already testing?**
1. Check where you left off in FINDINGS_AND_ISSUES.md
2. Continue from next phase
3. Document everything

**Finished testing?**
1. Complete "Final Summary" section in FINDINGS_AND_ISSUES.md
2. Share findings in new conversation for bug fixes
3. Consider testing with real users

---

**Good luck! 🚀**

Remember: The goal is to validate the entire customer experience, not just check boxes. Think like a customer, document everything, and don't hesitate to ask questions in a new conversation!
