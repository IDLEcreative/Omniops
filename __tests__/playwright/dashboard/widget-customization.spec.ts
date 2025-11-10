/**
 * Widget Customization UI E2E Tests - Orchestrator
 *
 * Tests the COMPLETE widget customization workflow including appearance,
 * AI behavior, and integration settings with live preview and persistence.
 *
 * User Journey:
 * 1. Navigate to customize dashboard
 * 2. Verify all tabs load (Essentials, Intelligence, Connect)
 * 3. Modify appearance settings (colors, position, icons)
 * 4. Update AI behavior settings (personality, messages)
 * 5. Configure integrations (WooCommerce, Shopify)
 * 6. Verify live preview updates in real-time
 * 7. Save configuration
 * 8. Reload and verify persistence
 * 9. Test reset functionality
 * 10. Verify widget reflects saved changes ← THE TRUE "END"
 *
 * This test suite is organized as follows:
 * - complete-workflow.spec.ts: Full end-to-end workflow
 * - preview-and-reset.spec.ts: Live preview and reset tests
 * - navigation.spec.ts: Tab navigation and advanced color customization
 * - error-handling.spec.ts: Error handling and accessibility
 *
 * Test Coverage:
 * - All 3 tabs (Essentials, Intelligence, Connect)
 * - Live preview real-time updates
 * - Save and persistence verification
 * - Reset to defaults functionality
 * - Color picker interactions
 * - Position selector
 * - Icon uploads
 * - AI personality settings
 * - Integration toggles
 * - Error recovery patterns
 * - Keyboard accessibility
 */

// Import all test modules (they define their own tests)
import './widget-customization/complete-workflow.spec';
import './widget-customization/preview-and-reset.spec';
import './widget-customization/navigation.spec';
import './widget-customization/error-handling.spec';
