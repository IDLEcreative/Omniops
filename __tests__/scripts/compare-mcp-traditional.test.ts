/**
 * Orchestrator for MCP comparison framework tests.
 * Preserves the legacy entrypoint while delegating to modular suites.
 */

import './scripts/compare-mcp-traditional/tests/test-case-schema.spec';
import './scripts/compare-mcp-traditional/tests/compare-results.spec';
import './scripts/compare-mcp-traditional/tests/product-extraction.spec';
import './scripts/compare-mcp-traditional/tests/semantic-similarity.spec';
import './scripts/compare-mcp-traditional/tests/performance.spec';
import './scripts/compare-mcp-traditional/tests/token-usage.spec';
import './scripts/compare-mcp-traditional/tests/recommendations.spec';
import './scripts/compare-mcp-traditional/tests/error-handling.spec';
