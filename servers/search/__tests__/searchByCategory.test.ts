/**
 * Orchestrator for searchByCategory MCP tool tests.
 * Preserves the original entrypoint while delegating to focused spec files.
 */

import './searchByCategory/success.spec';
import './searchByCategory/limit.spec';
import './searchByCategory/threshold.spec';
import './searchByCategory/category-validation.spec';
import './searchByCategory/context.spec';
import './searchByCategory/errors.spec';
import './searchByCategory/response-format.spec';
