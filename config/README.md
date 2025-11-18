# Configuration Files

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** None
**Estimated Read Time:** 5 minutes

## Purpose

Configuration files for Jest testing framework and Model Context Protocol (MCP) integrations, organized by tool/service category.

## Quick Links

- [Testing Documentation](/home/user/Omniops/docs/04-DEVELOPMENT/testing/)
- [Environment Setup](/home/user/Omniops/docs/environment-setup.md)
- [Development Workflow](/home/user/Omniops/CLAUDE.md#development-workflow)

## Table of Contents

- [Directory Structure](#directory-structure)
- [Configuration Files](#configuration-files)
  - [Jest Testing Configuration](#jest-testing-configuration)
  - [MCP (Model Context Protocol)](#mcp-model-context-protocol)
- [Usage Guidelines](#usage-guidelines)
- [Integration with Project](#integration-with-project)
- [Troubleshooting](#troubleshooting)
- [Related Documentation](#related-documentation)

## Keywords

**Search Terms:** configuration, Jest, testing, MCP, Model Context Protocol, Supabase, test setup, environment variables

**Aliases:**
- "Config files" (directory)
- "Test configuration" (Jest)
- "MCP config" (Model Context Protocol)

---

## Directory Structure

```
config/
├── jest/                           # Jest testing framework configurations
│   ├── jest.config.node.js         # Node.js specific Jest configuration
│   ├── jest.integration.config.js  # Integration test configuration
│   └── jest.env.js                 # Jest environment setup
└── mcp/                            # Model Context Protocol configurations
    └── mcp-supabase-config.json    # Supabase MCP integration settings
```

## Configuration Files

### Jest Testing Configuration

#### `jest/jest.config.node.js`
Node.js-specific Jest configuration for server-side testing.

**Key Features:**
- Configured for Node.js environment
- TypeScript support with ts-jest
- Module path mapping for clean imports
- Coverage reporting setup

#### `jest/jest.integration.config.js`
Specialized configuration for integration tests that require database connections and external services.

**Key Features:**
- Extended timeout for database operations
- Environment-specific test patterns
- Setup/teardown for integration test environment

#### `jest/jest.env.js`
Environment variable setup and configuration for Jest test runs.

**Purpose:**
- Load test-specific environment variables
- Configure test database connections
- Set up mock service configurations

### MCP (Model Context Protocol)

#### `mcp/mcp-supabase-config.json`
Configuration for Supabase integration via Model Context Protocol.

**Purpose:**
- Defines Supabase connection parameters for MCP tools
- Configures database access patterns
- Sets up authentication and security settings

## Usage Guidelines

### Adding New Configurations

When adding new configuration files:

1. **Create category subdirectories** - Group related configurations
2. **Use descriptive filenames** - Include the tool/service name
3. **Document purpose** - Add comments explaining configuration choices
4. **Environment-specific configs** - Separate dev, test, and production configs

### Best Practices

- **Version Control**: All configuration files should be committed to git
- **Environment Variables**: Use environment variables for secrets and environment-specific values
- **Documentation**: Document any non-obvious configuration choices
- **Validation**: Include configuration validation where possible

### Common Configuration Patterns

```javascript
// Example configuration structure
module.exports = {
  // Environment-specific settings
  testEnvironment: process.env.NODE_ENV === 'test' ? 'node' : 'jsdom',
  
  // Path mappings for clean imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/config/jest/setup.js'],
};
```

## Integration with Project

These configurations integrate with the main project through:

- **Package.json scripts** - Referenced in npm scripts
- **Environment loading** - Loaded via environment-specific patterns  
- **Build processes** - Used during compilation and testing
- **CI/CD pipelines** - Applied in automated testing and deployment

## Troubleshooting

### Common Issues

1. **Path Resolution**: Ensure relative paths are correct from project root
2. **Environment Variables**: Verify required env vars are set
3. **Tool Versions**: Check that configuration matches tool versions
4. **Permissions**: Ensure config files have appropriate read permissions

### Debugging Configuration

```bash
# Validate Jest configuration
npx jest --showConfig

# Test environment variable loading
node -e "console.log(process.env)"

# Verify TypeScript configuration
npx tsc --showConfig
```

## Related Documentation

- [Testing Documentation](../docs/testing/)
- [Environment Setup](../docs/environment-setup.md)
- [Development Workflow](../CLAUDE.md#development-workflow)