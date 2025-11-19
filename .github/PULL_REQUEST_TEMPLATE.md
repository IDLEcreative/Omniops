## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Refactoring (code improvement without changing functionality)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Test additions/improvements
- [ ] CI/CD changes
- [ ] Other (please describe):

## Related Issues

<!-- Link to related issues. Use "Fixes #123" or "Closes #456" for automatic closing -->

Fixes #
Relates to #

## Changes Made

<!-- Provide a detailed list of changes made -->

-
-
-

## Testing Done

<!-- Describe the testing you performed to verify your changes -->

### Unit Tests
- [ ] Added new unit tests
- [ ] Updated existing unit tests
- [ ] All unit tests pass

### Integration Tests
- [ ] Added new integration tests
- [ ] Updated existing integration tests
- [ ] All integration tests pass

### E2E Tests
- [ ] Added new E2E tests
- [ ] Updated existing E2E tests
- [ ] All E2E tests pass
- [ ] Tested in multiple browsers (if UI changes)

### Manual Testing
<!-- Describe manual testing performed -->

-
-

## Pre-submission Checklist

### Code Quality

- [ ] Tests pass (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Linting clean (`npm run lint`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Coverage maintained or improved (run `npm run test:coverage`)
- [ ] No console errors or warnings

### CLAUDE.md Compliance

- [ ] All code files under 300 LOC
- [ ] No files created in root directory (except configs)
- [ ] Brand-agnostic code (no hardcoded company names, products, domains)
- [ ] Proper file placement (tests in `__tests__/`, scripts in `scripts/`, docs in `docs/`)
- [ ] Followed dependency injection patterns (no hidden dependencies)
- [ ] Performance considerations (no O(n²) algorithms)
- [ ] Used native JS/TS features where possible (minimal new dependencies)

### Documentation

- [ ] Code is self-documenting with clear variable/function names
- [ ] Complex logic has inline comments explaining "why"
- [ ] Public APIs have JSDoc comments
- [ ] README.md updated (if needed)
- [ ] CLAUDE.md updated (if architectural changes)
- [ ] Migration guide provided (if breaking changes)

### Security & Privacy

- [ ] No credentials or secrets in code
- [ ] Follows encryption standards for sensitive data
- [ ] GDPR/CCPA compliant (if handling user data)
- [ ] No SQL injection vulnerabilities
- [ ] Input validation implemented
- [ ] Rate limiting considered (if API changes)

### Backward Compatibility

- [ ] No breaking changes (or documented in description)
- [ ] Database migrations provided (if schema changes)
- [ ] Environment variables documented (if new vars added)
- [ ] Deprecation warnings added (if deprecating features)

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

### Before


### After


## Performance Impact

<!-- Describe any performance implications of your changes -->

- [ ] No performance impact
- [ ] Performance improved (describe how):
- [ ] Performance impact analyzed and acceptable (explain):

## Deployment Notes

<!-- Any special deployment considerations -->

- [ ] No special deployment steps required
- [ ] Environment variables need updating (list them):
- [ ] Database migration required (included in PR)
- [ ] Cache needs clearing
- [ ] Other deployment steps:

## Additional Context

<!-- Add any other context about the PR here -->

---

## Reviewer Checklist

<!-- For maintainers reviewing this PR -->

- [ ] Code follows project conventions and CLAUDE.md rules
- [ ] Tests are comprehensive and well-written
- [ ] Documentation is clear and complete
- [ ] No security vulnerabilities introduced
- [ ] Performance is acceptable
- [ ] Breaking changes are properly documented
- [ ] CI/CD checks pass
