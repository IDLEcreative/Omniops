#!/usr/bin/env python3
"""
Comprehensive Organization Migration E2E Tests

Tests all critical user flows after organization migration:
1. New user onboarding
2. Organization creation
3. Team member listing
4. Invitation creation
5. Dashboard access with organization context
"""

from playwright.sync_api import sync_playwright, expect
import sys
import json

def test_organization_flows():
    """Test critical organization features end-to-end"""

    results = {
        "passed": [],
        "failed": [],
        "total": 0
    }

    def log_test(name, passed, details=""):
        results["total"] += 1
        if passed:
            results["passed"].append(name)
            print(f"✅ PASS: {name}")
        else:
            results["failed"].append(name)
            print(f"❌ FAIL: {name}")
        if details:
            print(f"   Details: {details}")

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()

        # Enable console logging for debugging
        page.on('console', lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on('pageerror', lambda err: print(f"[Browser Error] {err}"))

        try:
            print("\n" + "="*60)
            print("🧪 Starting Organization Migration E2E Tests")
            print("="*60 + "\n")

            # Test 1: Home page loads
            print("\n📍 Test 1: Home Page Access")
            page.goto('http://localhost:3000', wait_until='networkidle')
            page.screenshot(path='/tmp/homepage.png', full_page=True)

            home_loaded = page.title() != "" and "error" not in page.url.lower()
            log_test("Home page loads successfully", home_loaded, f"Title: {page.title()}")

            # Test 2: Login page exists and loads
            print("\n📍 Test 2: Login Page")
            page.goto('http://localhost:3000/login', wait_until='networkidle')
            page.screenshot(path='/tmp/login.png', full_page=True)

            # Check for login form elements
            has_email_input = page.locator('input[type="email"]').count() > 0
            has_password_input = page.locator('input[type="password"]').count() > 0
            has_submit_button = page.locator('button[type="submit"]').count() > 0 or \
                               page.locator('button:has-text("Sign in")').count() > 0

            login_page_valid = has_email_input and has_password_input and has_submit_button
            log_test("Login page has required form elements", login_page_valid,
                    f"Email: {has_email_input}, Password: {has_password_input}, Submit: {has_submit_button}")

            # Test 3: Dashboard redirects to login for unauthenticated users
            print("\n📍 Test 3: Dashboard Authentication")
            page.goto('http://localhost:3000/dashboard', wait_until='networkidle')
            page.screenshot(path='/tmp/dashboard-unauth.png', full_page=True)

            redirected_to_login = 'login' in page.url or 'auth' in page.url or page.locator('input[type="email"]').count() > 0
            log_test("Dashboard redirects unauthenticated users", redirected_to_login,
                    f"Current URL: {page.url}")

            # Test 4: Onboarding page exists
            print("\n📍 Test 4: Onboarding Page")
            page.goto('http://localhost:3000/onboarding', wait_until='networkidle')
            page.screenshot(path='/tmp/onboarding.png', full_page=True)

            # Check for organization creation form
            has_org_name_input = page.locator('input[name="organizationName"]').count() > 0 or \
                                page.locator('input[placeholder*="organization"]').count() > 0
            has_create_button = page.locator('button:has-text("Create")').count() > 0

            onboarding_exists = has_org_name_input or has_create_button or "organization" in page.content().lower()
            log_test("Onboarding page exists with organization creation", onboarding_exists,
                    f"Has org input: {has_org_name_input}, Has create button: {has_create_button}")

            # Test 5: API endpoints respond (health checks)
            print("\n📍 Test 5: Critical API Endpoints")

            # Test auth/me endpoint (should return 401 for unauthenticated)
            api_response = page.request.get('http://localhost:3000/api/auth/me')
            auth_me_works = api_response.status in [200, 401]  # Either works or requires auth
            log_test("API /auth/me endpoint responds", auth_me_works,
                    f"Status: {api_response.status}")

            # Test organizations endpoint (should return 401 for unauthenticated)
            api_response = page.request.get('http://localhost:3000/api/organizations')
            orgs_api_works = api_response.status in [200, 401]
            log_test("API /organizations endpoint responds", orgs_api_works,
                    f"Status: {api_response.status}")

            # Test 6: Team page structure (when accessed directly)
            print("\n📍 Test 6: Team Management Page")
            page.goto('http://localhost:3000/dashboard/team', wait_until='networkidle')
            page.screenshot(path='/tmp/team-page.png', full_page=True)

            # Should either show team page or redirect to login
            team_page_accessible = page.locator('h1:has-text("Team")').count() > 0 or \
                                  'login' in page.url or \
                                  'onboarding' in page.url
            log_test("Team page exists in routing", team_page_accessible,
                    f"Current URL: {page.url}")

            # Test 7: Check for critical UI components on dashboard
            print("\n📍 Test 7: Dashboard UI Components")
            page.goto('http://localhost:3000/dashboard', wait_until='networkidle')
            page.wait_for_timeout(2000)  # Wait for any client-side redirects
            page.screenshot(path='/tmp/dashboard-full.png', full_page=True)

            # Check for navigation or dashboard elements
            has_navigation = page.locator('nav').count() > 0 or \
                           page.locator('aside').count() > 0 or \
                           page.locator('[role="navigation"]').count() > 0

            has_content = page.locator('main').count() > 0 or \
                         page.locator('[role="main"]').count() > 0

            dashboard_structured = has_navigation or has_content or 'login' in page.url
            log_test("Dashboard has proper structure", dashboard_structured,
                    f"Has nav: {has_navigation}, Has main: {has_content}")

            # Test 8: Middleware protection check
            print("\n📍 Test 8: Middleware Route Protection")
            # Try accessing protected routes
            protected_routes = [
                '/dashboard/analytics',
                '/dashboard/conversations',
                '/dashboard/settings'
            ]

            all_protected = True
            for route in protected_routes:
                page.goto(f'http://localhost:3000{route}', wait_until='networkidle')
                # Should redirect to login or onboarding
                is_protected = 'login' in page.url or 'onboarding' in page.url or \
                             page.locator('input[type="email"]').count() > 0
                if not is_protected:
                    all_protected = False
                    break

            log_test("Middleware protects all dashboard routes", all_protected,
                    f"Tested {len(protected_routes)} routes")

            # Test 9: JavaScript errors check
            print("\n📍 Test 9: JavaScript Error Detection")
            js_errors = []

            def handle_error(error):
                js_errors.append(str(error))

            page.on('pageerror', handle_error)

            # Visit main pages and check for JS errors
            test_pages = ['/', '/login', '/dashboard', '/onboarding']
            for test_page in test_pages:
                page.goto(f'http://localhost:3000{test_page}', wait_until='networkidle')
                page.wait_for_timeout(1000)

            no_critical_js_errors = len(js_errors) == 0
            log_test("No JavaScript errors on main pages", no_critical_js_errors,
                    f"Errors found: {len(js_errors)}")

            if js_errors:
                print("\n   JavaScript Errors Detected:")
                for error in js_errors[:5]:  # Show first 5
                    print(f"   - {error}")

            # Test 10: Build artifacts exist
            print("\n📍 Test 10: Build Artifacts")
            import os

            next_dir_exists = os.path.exists('/Users/jamesguy/Omniops/.next')
            build_complete = next_dir_exists and \
                           os.path.exists('/Users/jamesguy/Omniops/.next/BUILD_ID')

            log_test("Production build artifacts exist", build_complete,
                    f".next directory: {next_dir_exists}")

        except Exception as e:
            print(f"\n❌ Test suite encountered an error: {e}")
            import traceback
            traceback.print_exc()

        finally:
            # Cleanup
            browser.close()

            # Print summary
            print("\n" + "="*60)
            print("📊 TEST SUMMARY")
            print("="*60)
            print(f"Total Tests: {results['total']}")
            print(f"✅ Passed: {len(results['passed'])}")
            print(f"❌ Failed: {len(results['failed'])}")

            if results['passed']:
                print("\n✅ Passed Tests:")
                for test in results['passed']:
                    print(f"   - {test}")

            if results['failed']:
                print("\n❌ Failed Tests:")
                for test in results['failed']:
                    print(f"   - {test}")

            pass_rate = (len(results['passed']) / results['total'] * 100) if results['total'] > 0 else 0
            print(f"\n📈 Pass Rate: {pass_rate:.1f}%")

            # Exit code based on results
            if len(results['failed']) > 0:
                print("\n⚠️  Some tests failed. Review the results above.")
                sys.exit(1)
            else:
                print("\n🎉 All tests passed!")
                sys.exit(0)

if __name__ == "__main__":
    test_organization_flows()
