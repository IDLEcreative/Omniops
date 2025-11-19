# Contributing to OmniOps

Thank you for your interest in contributing to OmniOps! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Commit Message Format](#commit-message-format)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [email protected].

## Getting Started

Before you begin:
- Read the [README.md](README.md) for project overview
- Read [CLAUDE.md](CLAUDE.md) for comprehensive development guidelines
- Review existing [issues](https://github.com/IDLEcreative/omniops/issues) and [pull requests](https://github.com/IDLEcreative/omniops/pulls)

## How to Contribute

### Reporting Bugs

Found a bug? Please create an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) with:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots or error logs if applicable

### Requesting Features

Have an idea? Create a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) including:
- Problem the feature solves
- Proposed solution
- Alternative approaches considered
- Example use cases

### Contributing Code

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test thoroughly** - all tests must pass
4. **Document your changes** - update relevant docs
5. **Submit a pull request** using our template

## Development Setup

### Prerequisites

- Node.js 18+
- Redis (for job queue)
- Docker Desktop (optional, for containerized development)
- OpenAI API key
- Supabase account

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/omniops.git
cd omniops

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your credentials

# Start Redis
docker-compose -f docker-compose.dev.yml up redis -d

# Start development server
npm run dev
```

### Verify Setup

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build project
npm run build

# Access local development
# - App: http://localhost:3000
# - Widget: http://localhost:3000/embed
# - Health: http://localhost:3000/api/health
```

## Coding Standards

### Critical Rules from CLAUDE.md

**MUST Follow:**
- ✅ **300 LOC Limit**: All code files must be under 300 lines of code (AI instruction files exempt)
- ✅ **Brand-Agnostic**: NEVER hardcode company names, products, domains, or industry-specific terms
- ✅ **File Placement**: Follow strict file placement rules (no files in root except configs)
- ✅ **Read Before Edit**: ALWAYS read entire file before making changes
- ✅ **Testing**: All code changes require comprehensive tests (90%+ coverage)

**NEVER:**
- ❌ Hardcode brand-specific data (Thompson's, pumps, etc.) in production code
- ❌ Create files directly in root directory (only config files allowed)
- ❌ Mock 3+ levels deep - refactor for dependency injection instead
- ❌ Add dependencies without checking native JS/TS alternatives
- ❌ Complete code without creating comprehensive tests

### TypeScript & Code Quality

```typescript
// ✅ GOOD: Brand-agnostic, dependency injection
class OrderProvider {
  constructor(private client: EcommerceAPI) {}
  async getOrders() {
    return this.client.fetchOrders();
  }
}

// ❌ BAD: Hardcoded, hidden dependencies
class OrderProvider {
  async getOrders() {
    const client = getWooCommerceClient('thompson.com'); // Hardcoded!
    return client.fetchOrders();
  }
}
```

**Standards:**
- Use TypeScript strict mode
- Follow existing component patterns in `components/ui/`
- Use Zod for API validation
- Services use class-based patterns in `lib/`
- All WooCommerce/Shopify credentials must be encrypted (AES-256)

### Performance Guidelines

- Avoid O(n²) complexity - aim for O(n) or O(n log n)
- Use async/parallel processing with `Promise.all()`
- Minimize dependencies - check native JS/TS alternatives first
- Use Maps/Sets for lookups, not nested loops
- Implement pagination for all list endpoints

### File Organization

```
✅ CORRECT file placement:
- Tests: __tests__/[category]/
- Scripts: scripts/[category]/
- Docs: docs/[category]/
- Components: components/[feature]/
- API routes: app/api/[feature]/

❌ WRONG: Creating files in root directory
```

## Pull Request Process

### Before Submitting

1. **Update your fork** with latest `main` branch
2. **Run all checks** (see checklist below)
3. **Write/update tests** for your changes
4. **Update documentation** if needed
5. **Follow commit message format**

### PR Checklist

Your PR must pass these checks:

- [ ] Tests pass (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Linting clean (`npm run lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Coverage maintained or improved (>90% target)
- [ ] Documentation updated (README, inline comments, etc.)
- [ ] CLAUDE.md rules followed:
  - [ ] All code files under 300 LOC
  - [ ] No files created in root (except configs)
  - [ ] Brand-agnostic code (no hardcoding)
  - [ ] Proper file placement
- [ ] No breaking changes (or clearly documented)
- [ ] E2E tests pass for affected features

### PR Description

Use the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) to describe:
- **What** changed
- **Why** the change was needed
- **How** it was implemented
- **Testing** performed
- **Screenshots** (if UI changes)

### Review Process

1. **Automated checks** must pass (GitHub Actions)
2. **Code review** by maintainers
3. **Testing verification** in preview environment
4. **Approval** from at least one maintainer
5. **Merge** to `main` branch

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Feature
feat(chat): add multi-language support for widget

# Bug fix
fix(api): resolve rate limiting issue for high-traffic domains

# Breaking change
feat(auth)!: migrate to new authentication system

BREAKING CHANGE: Old API tokens no longer supported. Users must
regenerate tokens from dashboard.
```

### Commit Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line under 72 characters
- Reference issues in footer (`Fixes #123`, `Closes #456`)

## Testing Requirements

### Coverage Standards

- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 100% coverage (authentication, payments, data integrity)

### Test Types

**1. Unit Tests** (`__tests__/unit/`)
```typescript
describe('OrderService', () => {
  it('should fetch orders with pagination', async () => {
    const mockClient = { getOrders: jest.fn() };
    const service = new OrderService(mockClient);

    await service.fetchOrders({ page: 1, limit: 20 });

    expect(mockClient.getOrders).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
```

**2. Integration Tests** (`__tests__/integration/`)
- Test API endpoints end-to-end
- Test database operations
- Test external service integrations

**3. E2E Tests** (`__tests__/playwright/`)
- Test complete user workflows
- Test widget embedding
- Test WooCommerce/Shopify integrations

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (requires dev server running)
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Quality

- ✅ Tests should be deterministic and repeatable
- ✅ Use descriptive test names
- ✅ Group related tests with `describe` blocks
- ✅ Test edge cases and error scenarios
- ✅ Mock external dependencies appropriately
- ❌ Don't mock 3+ levels deep (refactor instead)
- ❌ Don't test implementation details

## Documentation Requirements

### Code Documentation

```typescript
/**
 * Fetches customer orders with pagination support.
 *
 * @param customerId - The customer's unique identifier
 * @param options - Pagination options (page, limit)
 * @returns Promise resolving to paginated orders
 * @throws {NotFoundError} If customer doesn't exist
 *
 * @example
 * ```typescript
 * const orders = await fetchOrders('cust_123', { page: 1, limit: 20 });
 * ```
 */
async function fetchOrders(
  customerId: string,
  options: PaginationOptions
): Promise<PaginatedOrders> {
  // Implementation
}
```

### README Updates

Update relevant documentation when:
- Adding new features or APIs
- Changing environment variables
- Modifying setup instructions
- Changing user-facing behavior

### CLAUDE.md Updates

Update CLAUDE.md when:
- Adding new architectural patterns
- Establishing new coding conventions
- Adding critical rules or guidelines
- Documenting lessons learned

## Additional Resources

- [Project README](README.md) - Quick start and overview
- [CLAUDE.md](CLAUDE.md) - Comprehensive development guidelines
- [Architecture Docs](docs/01-ARCHITECTURE/) - System design documentation
- [API Reference](docs/09-REFERENCE/) - Complete API documentation
- [Docker Setup](docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md) - Container deployment

## Questions?

- Open a [GitHub Discussion](https://github.com/IDLEcreative/omniops/discussions)
- Join our [Community Chat](https://discord.gg/omniops)
- Email: [email protected]

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to OmniOps!** Your contributions help make customer service more accessible and efficient for businesses worldwide.
