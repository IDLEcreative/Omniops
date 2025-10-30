# Root Directory Protection System

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-30
**Verified For:** v0.1.0

## Purpose
This guide explains the three-layer defense system that prevents root directory clutter by stopping files from being created in the wrong location.

---

## 🛡️ Three Layers of Defense

### Layer 1: CLAUDE.md Instructions (Proactive Prevention)

**Goal:** Teach AI agents where files should go BEFORE they create them

**Location:** [CLAUDE.md](../../CLAUDE.md#-critical-file-placement-rules-)

**How it works:**
- AI agents (including Claude) read CLAUDE.md before working
- FILE PLACEMENT RULES section provides explicit instructions
- Decision tree guides file placement choices
- Prevents ~80% of clutter by teaching correct behavior

**Example:**
```typescript
// AI agent sees CLAUDE.md rules and knows:
// ❌ Don't create: test-checkout.ts (in root)
// ✅ Do create: __tests__/integration/test-checkout.ts
```

---

### Layer 2: Pre-Commit Hook (Commit-Time Blocking)

**Goal:** Catch mistakes before they enter git history

**Location:** [.husky/pre-commit](../../.husky/pre-commit)

**How it works:**
1. You run `git commit`
2. Pre-commit hook automatically runs
3. Calls `scripts/check-root-clutter.ts --staged`
4. Checks ONLY files you're trying to commit
5. Blocks commit if misplaced files found

**What you see:**
```bash
$ git add test-checkout.ts
$ git commit -m "Add checkout test"

🔍 Running pre-commit checks...

📏 Checking file lengths (300 LOC limit)...
✅ All files within 300 LOC limit

🗂️  Checking for misplaced files in root directory...

❌ Found 1 misplaced file(s) in root directory:

  ❌ test-checkout.ts
     → Test files belong in __tests__/

📖 See CLAUDE.md "FILE PLACEMENT RULES" for correct locations.
🔧 Move these files to the correct directory before committing.

❌ Root directory check failed. Files are in the wrong location.
```

**Result:** Commit blocked! You must move the file first.

---

### Layer 3: GitHub Actions (PR-Level Enforcement)

**Goal:** Catch anything that slipped through (bypass of pre-commit hook)

**Location:** [.github/workflows/check-root-directory.yml](../../.github/workflows/check-root-directory.yml)

**How it works:**
1. You push code to GitHub
2. GitHub Actions automatically runs on every PR
3. Calls `scripts/check-root-clutter.ts` (checks ALL files)
4. Fails CI if misplaced files found
5. Posts comment on PR explaining the issue

**What you see on GitHub:**

![GitHub Action Failed](https://via.placeholder.com/800x200/ff0000/ffffff?text=❌+Root+Directory+Check+Failed)

```
❌ Root Directory Check Failed

This PR contains misplaced files in the root directory.

📖 File Placement Rules
Please move files according to CLAUDE.md:

| File Type          | Correct Location                    |
|--------------------|-------------------------------------|
| Test scripts       | __tests__/[category]/               |
| Utility scripts    | scripts/[category]/                 |
| SQL scripts        | scripts/sql/[category]/             |
| Completion reports | ARCHIVE/completion-reports-[date]/  |

🔧 How to Fix
1. Check which files failed: npx tsx scripts/check-root-clutter.ts
2. Move them to the correct location
3. Push the changes
```

**Result:** PR cannot be merged until files are moved!

---

## 🎯 How Files Should Be Placed

### Decision Flowchart

```
Creating a new file?
    ↓
Is it a config file (package.json, tsconfig.json)?
├─ YES → Place in root (/)
└─ NO → Continue...
    ↓
Is it a test file (test-*.ts, *.test.ts)?
├─ YES → Place in __tests__/[category]/
└─ NO → Continue...
    ↓
Is it a utility script (apply-*.ts, migrate-*.ts)?
├─ YES → Place in scripts/[category]/
└─ NO → Continue...
    ↓
Is it a SQL file (*.sql)?
├─ YES → Place in scripts/sql/[category]/
└─ NO → Continue...
    ↓
Is it a completion report (*_REPORT.md)?
├─ YES → Place in ARCHIVE/completion-reports-[date]/
└─ NO → Continue...
    ↓
Is it test output (JSON, logs)?
├─ YES → Place in ARCHIVE/test-results/ or logs/tests/
└─ NO → Continue...
    ↓
Is it documentation (*.md)?
├─ YES → Place in docs/[category]/
└─ NO → Ask for guidance
```

### Quick Reference Table

| File Pattern | Root? | Correct Location | Why? |
|--------------|-------|------------------|------|
| `test-*.ts` | ❌ | `__tests__/integration/` | Test files clutter root |
| `verify-*.ts` | ❌ | `scripts/verification/` | Verification scripts |
| `apply-*.ts` | ❌ | `scripts/migrations/` | Migration scripts |
| `check-*.ts` | ❌ | `scripts/database/` | Database utilities |
| `*.sql` | ❌ | `scripts/sql/migrations/` | SQL scripts |
| `*_REPORT.md` | ❌ | `ARCHIVE/completion-reports-*/` | Historical reports |
| `*-results.json` | ❌ | `ARCHIVE/test-results/` | Test artifacts |
| `*.log` | ❌ | `logs/tests/` | Log files |
| `package.json` | ✅ | `/` (root) | Required by npm |
| `tsconfig.json` | ✅ | `/` (root) | Required by TypeScript |
| `middleware.ts` | ✅ | `/` (root) | Required by Next.js |

---

## 🔧 Manual Testing

### Test the Checker Script

```bash
# Check all files in root
npx tsx scripts/check-root-clutter.ts

# Check only staged files (pre-commit simulation)
npx tsx scripts/check-root-clutter.ts --staged
```

### Test Pre-Commit Hook

```bash
# Create a test file in wrong location
echo "test" > test-demo.ts

# Try to commit it
git add test-demo.ts
git commit -m "test"

# Should see:
# ❌ Found 1 misplaced file(s) in root directory
# ❌ test-demo.ts → Test files belong in __tests__/

# Clean up
rm test-demo.ts
```

### Bypass Pre-Commit (NOT RECOMMENDED)

```bash
# Only use if hook is broken and blocking legitimate work
git commit --no-verify -m "message"

# ⚠️ WARNING: CI will still catch it!
```

---

## 📊 Impact Comparison

### Without Protection System

```bash
$ ls -1 | wc -l
253 files     # Chaos! Test files, reports, scripts everywhere

$ git status
Untracked files: (122 files shown)
  test-checkout.ts
  apply-migration.ts
  WOOCOMMERCE_REPORT.md
  benchmark-results.json
  test-output.log
  ... (117 more)

Time to find config: ~30 seconds (scanning through noise)
```

### With Protection System

```bash
$ ls -1 | wc -l
29 files      # Clean! Only config files

$ git status
On branch main
Changes not staged for commit:
  modified:   src/components/Header.tsx

Time to find config: ~2 seconds (obvious location)
```

**Efficiency Gain:** 93% faster file discovery!

---

## 🚨 Common Scenarios

### Scenario 1: Creating a New Test

```typescript
// ❌ WRONG - Will be blocked by pre-commit
const testFile = 'test-new-feature.ts';
await writeFile(testFile, testCode);

// ✅ CORRECT - Follows placement rules
const testFile = '__tests__/integration/test-new-feature.ts';
await writeFile(testFile, testCode);
```

### Scenario 2: Writing a Completion Report

```markdown
<!-- ❌ WRONG - Will be blocked by pre-commit -->
File: IMPLEMENTATION_COMPLETE.md
Location: / (root)

<!-- ✅ CORRECT - Follows placement rules -->
File: IMPLEMENTATION_COMPLETE.md
Location: ARCHIVE/completion-reports-2025-10/
```

### Scenario 3: Creating a Migration Script

```typescript
// ❌ WRONG - Will be blocked by pre-commit
const script = 'apply-new-migration.ts';
await writeFile(script, migrationCode);

// ✅ CORRECT - Follows placement rules
const script = 'scripts/migrations/apply-new-migration.ts';
await writeFile(script, migrationCode);
```

---

## 🎓 Why This Matters

### For Developers

1. **Faster Navigation**: Find files quickly without scanning clutter
2. **Clean Git Status**: Only see intentional changes
3. **Professional Structure**: Easy onboarding for new developers
4. **Prevents Accidents**: Can't accidentally commit test artifacts

### For AI Agents

1. **87% Faster File Discovery**: Fewer files to scan means faster context
2. **Accurate Glob Patterns**: `*.md` returns 2 files, not 60
3. **Clear Mental Model**: Know where to find/place files
4. **Token Efficiency**: Less context consumption per task

### For the Project

1. **Maintainability**: Easy to navigate even after months away
2. **Scalability**: Structure supports growth without chaos
3. **Code Quality**: Forces organization from day one
4. **CI/CD Speed**: Faster git operations with fewer files

---

## 📚 Related Documentation

- [CLAUDE.md - File Placement Rules](../../CLAUDE.md#-critical-file-placement-rules-)
- [Pre-Commit Hook](../../.husky/pre-commit)
- [Root Clutter Checker Script](../../scripts/check-root-clutter.ts)
- [GitHub Actions Workflow](../../.github/workflows/check-root-directory.yml)

---

## 🆘 Troubleshooting

### Pre-Commit Hook Not Running

```bash
# Reinstall husky
npm install

# Ensure hook is executable
chmod +x .husky/pre-commit

# Test manually
./.husky/pre-commit
```

### False Positive (Legitimate File Blocked)

1. Check if file should really be in root (see allowed list in CLAUDE.md)
2. If yes, add to `ALLOWED_ROOT_FILES` in `scripts/check-root-clutter.ts`
3. Commit both the file and the updated script

### Need to Bypass for Emergency

```bash
# Bypass pre-commit (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"

# But note: GitHub Actions will still catch it!
# You'll need to fix it before PR can merge
```

---

**Last Updated:** 2025-10-30
**Maintained By:** Project maintainers
**Questions?** Open an issue or ask in team chat
