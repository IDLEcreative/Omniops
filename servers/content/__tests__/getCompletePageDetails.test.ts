/**
 * Legacy entrypoint for getCompletePageDetails tests.
 * Imports modular spec files to keep LOC under 300 while preserving the
 * original test path used by documentation and tooling.
 */

import './getCompletePageDetails/success.spec';
import './getCompletePageDetails/errors.spec';
import './getCompletePageDetails/validation.spec';
import './getCompletePageDetails/multi-tenant.spec';
import './getCompletePageDetails/response-format.spec';
import './getCompletePageDetails/domain-normalization.spec';
