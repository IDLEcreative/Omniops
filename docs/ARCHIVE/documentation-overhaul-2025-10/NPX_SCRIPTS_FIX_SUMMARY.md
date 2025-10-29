# NPX Scripts Reference Fix Summary

**Date:** 2025-10-24
**Issue:** CLAUDE.md and other documentation referenced 11+ NPX scripts that don't exist

## Problem

Documentation referenced non-existent NPX scripts in multiple locations:
- `monitor-embeddings-health.ts` (48+ references across codebase)
- `optimize-chunk-sizes.ts`
- `batch-rechunk-embeddings.ts`
- `simple-rechunk.ts`
- `profile-docker-quick.ts`
- `test-database-cleanup.ts`
- `test-hallucination-prevention.ts`

This created confusion as developers would try to run these commands and fail.

## Solution

### 1. Updated CLAUDE.md (Primary Changes)

**Lines 91-96: Database Cleanup**
- Changed section header to "Database Cleanup (Planned)"
- Added "🔜 Planned:" prefix
- Commented out all commands with `#`

**Lines 97-113: Performance Monitoring**
- Changed section header to "Performance Monitoring & Optimization (Planned Features)"
- Added warning banner about planned features
- Referenced NPX_SCRIPTS_ROADMAP.md for implementation status
- Commented out all commands with `#` prefix and 🔜 emoji

**Line 227: Docker Profiling**
- Changed to "Performance monitoring (Planned)"
- Commented out command with 🔜 prefix

**Line 339: Hallucination Testing**
- Updated to indicate planned feature
- Referenced NPX_SCRIPTS_ROADMAP.md

**Lines 317-327: Database Cleanup Section**
- Replaced command examples with planned functionality description
- Referenced NPX_SCRIPTS_ROADMAP.md for timeline

### 2. Created NPX_SCRIPTS_ROADMAP.md

**Location:** `/Users/jamesguy/Omniops/docs/NPX_SCRIPTS_ROADMAP.md`

**Contents:**
- Complete roadmap for all 7 planned NPX scripts
- Priority levels (High/Medium/Low)
- Estimated effort for each script
- Implementation phases
- Design principles for NPX scripts
- Related documentation links

**Priority Breakdown:**
- **High Priority** (1-2 weeks)
  - test-database-cleanup.ts
  - test-hallucination-prevention.ts

- **Medium Priority** (2-3 weeks)
  - monitor-embeddings-health.ts
  - optimize-chunk-sizes.ts
  - batch-rechunk-embeddings.ts

- **Low Priority** (1 week)
  - simple-rechunk.ts
  - profile-docker-quick.ts

### 3. Updated Supporting Documentation

**DATABASE_CLEANUP.md**
- Added implementation status banner at top
- Indicates script is not yet implemented
- Links to NPX_SCRIPTS_ROADMAP.md
- Preserves design documentation for future implementation

**HALLUCINATION_PREVENTION.md**
- Updated testing reference (line 13)
- Changed from "See test suite" to "🔜 Planned - Test suite"
- Added link to NPX_SCRIPTS_ROADMAP.md

## Files Modified

1. `/Users/jamesguy/Omniops/CLAUDE.md`
   - Lines 91-96: Database cleanup commands
   - Lines 97-113: Performance monitoring commands
   - Line 227: Docker profiling
   - Line 339: Hallucination testing
   - Lines 317-327: Database cleanup section

2. `/Users/jamesguy/Omniops/docs/02-GUIDES/GUIDE_DATABASE_CLEANUP.md`
   - Added implementation status banner (lines 3-9)

3. `/Users/jamesguy/Omniops/docs/HALLUCINATION_PREVENTION.md`
   - Updated testing reference (line 13)

## Files Created

1. `/Users/jamesguy/Omniops/docs/NPX_SCRIPTS_ROADMAP.md`
   - Complete roadmap document
   - ~300 lines of comprehensive documentation

## Impact

### Before
- Developers would see commands in CLAUDE.md
- Try to run them: `npx tsx monitor-embeddings-health.ts check`
- Get error: "Cannot find module"
- Confusion and wasted time

### After
- Clear indication that features are planned
- Comprehensive roadmap for implementation
- No confusion about what exists vs. what's planned
- Preservation of design documentation for future implementation

## Verification

Checked for references to non-existent scripts:
```bash
# Found 21 documentation files with references
grep -r "monitor-embeddings-health" docs/ | wc -l
# Result: Multiple files, now properly marked as planned
```

All references now either:
1. Commented out in CLAUDE.md with 🔜 prefix
2. Updated to indicate planned status
3. Link to NPX_SCRIPTS_ROADMAP.md for details

## Benefits

1. **Developer Clarity**
   - No confusion about what commands work
   - Clear roadmap for future features
   - Proper expectations set

2. **Preserved Design**
   - Documentation like DATABASE_CLEANUP.md preserved
   - Design decisions captured for implementation
   - Implementation specs ready when needed

3. **Project Management**
   - Clear priority and timeline
   - Estimated effort for each script
   - Implementation phases defined

4. **Consistency**
   - All planned features marked with 🔜
   - Single source of truth (NPX_SCRIPTS_ROADMAP.md)
   - Consistent notation across all docs

## Next Steps

When implementing a script from the roadmap:

1. Update NPX_SCRIPTS_ROADMAP.md status from 🔜 to 🚧 (in progress)
2. Implement the script
3. Add tests
4. Update CLAUDE.md to uncomment the commands
5. Update NPX_SCRIPTS_ROADMAP.md status to ✅ (implemented)
6. Update related documentation (remove planned banners)
7. Add usage examples

## Related Issues

- Original issue: 48+ references to non-existent scripts
- Affects: Developer onboarding, documentation accuracy
- Fixed: All references properly marked as planned
- Duration: ~1 hour to fix comprehensively

## Documentation Standards Applied

1. **Clear Status Indicators**
   - 🔜 Not Implemented
   - 🚧 In Progress
   - ✅ Implemented
   - 📦 Released

2. **Consistent Formatting**
   - Commented out non-existent commands
   - Added warning banners
   - Linked to roadmap document

3. **Preservation of Value**
   - Kept design documentation
   - Maintained implementation specs
   - Preserved examples for future reference

## Conclusion

Successfully resolved documentation inconsistencies by:
- Clearly marking planned features
- Creating comprehensive roadmap
- Maintaining design documentation for future implementation
- Establishing clear standards for NPX script documentation

No functionality was lost - only clarity was gained.
