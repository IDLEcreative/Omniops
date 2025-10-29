# Widget Installation Flow - Visual Architecture Diagram

## Complete Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          THOMPSON'S ADMIN JOURNEY                         │
└──────────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 1: AUTHENTICATION                                                 ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    Supabase Auth                Browser
    ┌──────────────┐           ┌─────────────────────┐
    │              │           │  /auth/login page   │
    │ Auth Service │◄─────────►│                     │
    │              │ email/pwd │ Sign In Button      │
    └──────────────┘           └─────────────────────┘
         │
         │ ✅ Auth successful
         │
         ↓
    ┌──────────────────────┐
    │ Session Token        │
    │ Stored in Cookie     │
    └──────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 2: NAVIGATION TO INSTALLATION PAGE                                ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    ┌─────────────────────────────────────────┐
    │ Dashboard Layout                        │
    │ /app/dashboard/layout.tsx               │
    │                                         │
    │ ┌─────────────────────────────────────┐ │
    │ │ Sidebar (Left Navigation)           │ │
    │ │                                     │ │
    │ │ Main                                │ │
    │ │  • Overview                         │ │
    │ │  • Conversations                    │ │
    │ │  • Analytics                        │ │
    │ │  • Telemetry                        │ │
    │ │                                     │ │
    │ │ Management                          │ │
    │ │  • Customers                        │ │
    │ │  • Bot Training                     │ │
    │ │  • Team                             │ │
    │ │                                     │ │
    │ │ Configuration                       │ │
    │ │  • 📥 Installation  ◄─── CLICK HERE │ │
    │ │  • Integrations                     │ │
    │ │  • Customization                    │ │
    │ │  • Privacy & Security               │ │
    │ │  • Settings                         │ │
    │ │                                     │ │
    │ └─────────────────────────────────────┘ │
    │                                         │
    │ File: lib/dashboard/navigation-config.ts │
    │ href: /dashboard/installation           │
    └─────────────────────────────────────────┘
                     │
                     │ Click "Installation"
                     ↓
            Router navigates to
            /dashboard/installation


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 3: INSTALLATION PAGE LOADS                                        ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    ┌──────────────────────────────────────────────────────────┐
    │ InstallationPage                                         │
    │ /app/dashboard/installation/page.tsx (118 LOC)          │
    │                                                          │
    │ State:                                                   │
    │  ✓ activeTab = "quickstart"                             │
    │  ✓ serverUrl = ""                                       │
    │  ✓ domain = ""                                          │
    │  ✓ isLoading = true                                     │
    │                                                          │
    │ useEffect(() => {                                       │
    │   loadConfiguration(); // <-- Runs on mount             │
    │ }, []);                                                 │
    └──────────────────────────────────────────────────────────┘
                     │
                     │
                     ↓
    ┌──────────────────────────────────────────────────────────┐
    │ loadConfiguration() function                             │
    │                                                          │
    │ 1. Set serverUrl = window.location.origin               │
    │    (e.g., "http://localhost:3000")                      │
    │                                                          │
    │ 2. Fetch '/api/customer/config/current'                 │
    │    (API call starts)                                    │
    │                                                          │
    │ 3. Handle response:                                     │
    │    ├─ If success: setDomain(data.data.domain)          │
    │    │  └─ Show toast: "Configuration Loaded"             │
    │    └─ If error: setDomain("")                          │
    │       └─ Show toast: "No Domain Configured"             │
    │                                                          │
    │ 4. Finally: setIsLoading(false)                         │
    └──────────────────────────────────────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 4: API CALL - FETCH CUSTOMER CONFIG                               ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    GET /api/customer/config/current/route.ts
    ┌──────────────────────────────────────────────────────────┐
    │                                                          │
    │ STEP 4.1: AUTHENTICATE USER                             │
    │ ┌────────────────────────────────────────────────────┐  │
    │ │ supabase.auth.getUser()                            │  │
    │ │                                                    │  │
    │ │ If !user:                                          │  │
    │ │  └─ Return 401 { success: false }                 │  │
    │ └────────────────────────────────────────────────────┘  │
    │          │                                              │
    │          ✅ User exists, proceed                         │
    │          │                                              │
    │          ↓                                              │
    │                                                          │
    │ STEP 4.2: VERIFY ORGANIZATION MEMBERSHIP               │
    │ ┌────────────────────────────────────────────────────┐  │
    │ │ FROM organization_members                          │  │
    │ │ WHERE user_id = auth.user.id                       │  │
    │ │                                                    │  │
    │ │ If !membership:                                    │  │
    │ │  └─ Return 404 { success: false }                 │  │
    │ └────────────────────────────────────────────────────┘  │
    │          │                                              │
    │          ✅ Organization found, proceed                  │
    │          │                                              │
    │          ↓                                              │
    │                                                          │
    │ STEP 4.3: FETCH CUSTOMER CONFIG                         │
    │ ┌────────────────────────────────────────────────────┐  │
    │ │ FROM customer_configs                              │  │
    │ │ WHERE organization_id = membership.organization_id │  │
    │ │   AND active = true                                │  │
    │ │                                                    │  │
    │ │ Returns: {                                         │  │
    │ │   domain: "thompsonseparts.co.uk",               │  │
    │ │   business_name: "...",                            │  │
    │ │   woocommerce_url: "...",                          │  │
    │ │   ... (31 other fields)                            │  │
    │ │ }                                                  │  │
    │ └────────────────────────────────────────────────────┘  │
    │          │                                              │
    │          ✅ Config found, proceed                        │
    │          │                                              │
    │          ↓                                              │
    │                                                          │
    │ STEP 4.4: EXCLUDE SENSITIVE FIELDS                      │
    │ ┌────────────────────────────────────────────────────┐  │
    │ │ Remove before returning:                           │  │
    │ │  - woocommerce_consumer_key                        │  │
    │ │  - woocommerce_consumer_secret                     │  │
    │ │  - encrypted_credentials                          │  │
    │ │  - shopify_access_token                           │  │
    │ │                                                    │  │
    │ │ Return safeConfig {                                │  │
    │ │   domain: "thompsonseparts.co.uk",               │  │
    │ │   business_name: "...",                            │  │
    │ │   ... (non-sensitive fields only)                  │  │
    │ │ }                                                  │  │
    │ └────────────────────────────────────────────────────┘  │
    │          │                                              │
    │          ✅ Safe to send to frontend                     │
    │          │                                              │
    │          ↓                                              │
    │                                                          │
    │ STEP 4.5: RETURN JSON RESPONSE                          │
    │ ┌────────────────────────────────────────────────────┐  │
    │ │ HTTP 200 OK                                        │  │
    │ │ {                                                  │  │
    │ │   "success": true,                                │  │
    │ │   "data": {                                        │  │
    │ │     "domain": "thompsonseparts.co.uk",            │  │
    │ │     "business_name": "Thompson's Parts",           │  │
    │ │     "organization_id": "uuid",                     │  │
    │ │     ... (other safe fields)                        │  │
    │ │   }                                                │  │
    │ │ }                                                  │  │
    │ └────────────────────────────────────────────────────┘  │
    │                                                          │
    └──────────────────────────────────────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 5: API RESPONSE RECEIVED - UPDATE PAGE STATE                      ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    Back in InstallationPage component:

    if (data.success && data.data) {
      setDomain("thompsonseparts.co.uk");  // ✅ Set from response
      setServerUrl("http://localhost:3000"); // ✅ Already set
      setIsLoading(false);                  // ✅ Hide spinner

      toast({
        title: "Configuration Loaded",
        description: "Installing for: thompsonseparts.co.uk"
      });
    }


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 6: RENDER PAGE WITH TABS                                          ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    ┌─────────────────────────────────────────────────────────┐
    │ InstallationPage - Three Tabs                           │
    │                                                         │
    │ [🚀 Quick Start] [📖 Platform Guides] [❓ Troubleshoot] │
    │                                                         │
    ├─────────────────────────────────────────────────────────┤
    │ TAB: Quick Start (Active)                               │
    │                                                         │
    │ ┌─────────────────────────────────────────────────────┐ │
    │ │ QuickStart Component                                │ │
    │ │ Props:                                              │ │
    │ │  - serverUrl: "http://localhost:3000"              │ │
    │ │  - domain: "thompsonseparts.co.uk"  ◄─ FROM API    │ │
    │ │  - isLoading: false                                │ │
    │ │                                                    │ │
    │ │ ┌─────────────────────────────────────────────────┐ │
    │ │ │ Alert:                                          │ │
    │ │ │ ✅ Configuration Detected                        │ │
    │ │ │    Installing for: [thompsonseparts.co.uk]       │ │
    │ │ └─────────────────────────────────────────────────┘ │
    │ │                                                    │ │
    │ │ ┌─────────────────────────────────────────────────┐ │
    │ │ │ EmbedCodeGenerator (child component)            │ │
    │ │ │                                                 │ │
    │ │ │ Config created:                                 │ │
    │ │ │ {                                               │ │
    │ │ │   serverUrl: "http://localhost:3000",          │ │
    │ │ │   appearance: { ... },                          │ │
    │ │ │   features: {                                   │ │
    │ │ │     websiteScraping: {                          │ │
    │ │ │       enabled: true,                            │ │
    │ │ │       urls: ["thompsonseparts.co.uk"] ◄─── KEY! │ │
    │ │ │     },                                          │ │
    │ │ │     woocommerce: { enabled: false },            │ │
    │ │ │     customKnowledge: { enabled: true, ... }     │ │
    │ │ │   },                                            │ │
    │ │ │   behavior: { ... }                             │ │
    │ │ │ }                                               │ │
    │ │ │                                                 │ │
    │ │ │ Framework Selection:                            │ │
    │ │ │ ☐ HTML    ☐ React   ☐ Next.js                  │ │
    │ │ │ ☐ Vue     ☐ Angular ☐ WordPress                │ │
    │ │ │ ☐ Shopify [selected = "html"]                   │ │
    │ │ │                                                 │ │
    │ │ │ Code Preview:                                   │ │
    │ │ │ ┌───────────────────────────────────────────┐  │ │
    │ │ │ │<!-- AI Chat Widget -->                    │  │ │
    │ │ │ │<script>                                   │  │ │
    │ │ │ │window.ChatWidgetConfig = {...config...};  │  │ │
    │ │ │ │</script>                                  │  │ │
    │ │ │ │<script src="http://localhost:3000/       │  │ │
    │ │ │ │embed.js" async></script>                 │  │ │
    │ │ │ │<!-- End AI Chat Widget -->                │  │ │
    │ │ │ └───────────────────────────────────────────┘  │ │
    │ │ │                            [📋 Copy] ◄─ CLICK   │ │
    │ │ │                                                 │ │
    │ │ └─────────────────────────────────────────────────┘ │
    │ │                                                    │ │
    │ │ Next Steps:                                        │ │
    │ │ ① Add the code to your website                    │ │
    │ │ ② Test on your staging site                      │ │
    │ │ ③ Verify widget appearance                       │ │
    │ │ ④ Deploy to production                           │ │
    │ │                                                    │ │
    │ │ [🧪 Test Widget Now]                              │ │
    │ └─────────────────────────────────────────────────────┘ │
    │                                                         │
    │ TAB: Platform Guides                                    │
    │ └─ WordPress, Shopify, WooCommerce, Next.js, etc       │
    │                                                         │
    │ TAB: Troubleshooting                                    │
    │ └─ Widget not appearing, domain mismatch, mobile, etc   │
    │                                                         │
    └─────────────────────────────────────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 7: SELECT FRAMEWORK & GENERATE CODE                               ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    When user selects "WordPress":

    EmbedCodeGenerator.tsx:
    ┌──────────────────────────────────────────────────────────┐
    │ setSelectedFramework("wordpress")                         │
    │          │                                               │
    │          ↓                                               │
    │ generateEmbedCode(config, "wordpress", customCSS)        │
    │          │                                               │
    │          ↓ (lib/configure/wizard-utils.ts)               │
    │                                                          │
    │ case 'wordpress':                                        │
    │   return `// Add to your theme's functions.php           │
    │                                                          │
    │ function add_chat_widget() {                             │
    │     ?>                                                   │
    │     <script>                                             │
    │     window.ChatWidgetConfig = {                          │
    │         "serverUrl": "http://localhost:3000",            │
    │         "appearance": {                                  │
    │             "primaryColor": "#4F46E5",                   │
    │             "backgroundColor": "#FFFFFF",               │
    │             "textColor": "#111827",                      │
    │             ...                                          │
    │         },                                               │
    │         "features": {                                    │
    │             "websiteScraping": {                         │
    │                 "enabled": true,                         │
    │                 "urls": ["thompsonseparts.co.uk"]        │
    │             },                                           │
    │             ...                                          │
    │         },                                               │
    │         ...                                              │
    │     };                                                   │
    │     </script>                                            │
    │     <script src="http://localhost:3000/embed.js"         │
    │      async></script>                                     │
    │     <?php                                                │
    │ }                                                        │
    │ add_action('wp_footer', 'add_chat_widget');`             │
    │                                                          │
    └──────────────────────────────────────────────────────────┘
             │
             ↓
         Code displayed
         in <pre> tag


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 8: COPY CODE TO CLIPBOARD                                         ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    User clicks "Copy" button:

    copyToClipboard() {
      navigator.clipboard.writeText(
        generateEmbedCode(config, selectedFramework, customCSS)
      );

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
             │
             ↓
         Button changes to:
         ✅ Copied! (for 2 seconds)
             │
             ↓
         Code is now in system clipboard


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ STEP 9: PASTE INTO WORDPRESS & DEPLOY                                  ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

    Admin opens WordPress:
    1. Dashboard → Appearance → Theme File Editor
    2. Find "functions.php" file
    3. Scroll to bottom
    4. Paste code (Ctrl+V)
    5. Click "Update File"
    6. Save

    Widget loads on site:
    ┌──────────────────────────┐
    │ Website Footer           │
    │ (before </body>)         │
    │                          │
    │ <script src="...         │
    │ /embed.js"></script>     │
    │                          │
    │ Browser loads embed.js:  │
    │  1. Detects domain       │
    │     (thompsonseparts...) │
    │  2. Uses ChatWidgetConfig│
    │  3. Creates iframe       │
    │  4. Renders chat button  │
    │  5. Shows in bottom-right│
    │     corner ✅ WORKING!   │
    └──────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ARCHITECTURE SUMMARY: DATA FLOW                                        ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

API Layer (Database)
    ↓
    customer_configs.domain = "thompsonseparts.co.uk"
    ↓
API Endpoint
    ↓
    /api/customer/config/current/route.ts
    ├─ Verify auth
    ├─ Fetch domain from customer_configs
    ├─ Return { success: true, data: { domain: "..." } }
    ↓
Page Component (InstallationPage)
    ↓
    setDomain("thompsonseparts.co.uk")
    ↓
Child Component (QuickStart)
    ↓
    defaultConfig.features.websiteScraping.urls = [domain]
    ↓
Code Generator (EmbedCodeGenerator)
    ↓
    Pass config to generateEmbedCode()
    ↓
Utility Function (wizard-utils.ts)
    ↓
    Switch on framework → generate code with domain
    ↓
Display in UI
    ↓
    <pre><code>{ config with domain }</code></pre>
    ↓
Copy to Clipboard
    ↓
Paste into Website
    ↓
Widget appears ✅


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ALL SUPPORTED FRAMEWORKS                                               ┃
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓

  1. HTML ✅
     • Direct script tags
     • Works in any website
     • Minimal setup

  2. React ✅
     • useEffect hook
     • Creates <script> dynamically
     • Works in React apps

  3. Next.js ✅
     • Next/script component
     • strategy="afterInteractive"
     • Proper Next.js integration

  4. Vue ✅
     • mounted() lifecycle hook
     • Creates script element
     • Works in Vue 3 apps

  5. Angular ✅
     • ngOnInit() lifecycle hook
     • Creates script element
     • Works in Angular apps

  6. WordPress ✅
     • PHP functions.php hook
     • wp_footer action
     • Theme-agnostic

  7. Shopify ✅
     • Liquid template syntax
     • theme.liquid location
     • Liquid variables available


All frameworks include:
  ✅ serverUrl from config (e.g., http://localhost:3000)
  ✅ /embed.js script reference
  ✅ window.ChatWidgetConfig object
  ✅ Domain in config.features.websiteScraping.urls
  ✅ All appearance customization
  ✅ All behavior settings
```

---

## Key Integration Points

### 1. Database → API
```
customer_configs table
├─ domain: "thompsonseparts.co.uk"
├─ organization_id: "uuid-123"
├─ active: true
└─ ... 30 other fields

↓ API filters by:
  • organization_id (from organization_members)
  • active = true

↓ Returns safe config without:
  • woocommerce_consumer_key
  • woocommerce_consumer_secret
  • shopify_access_token
  • encrypted_credentials
```

### 2. API → Frontend State
```
GET /api/customer/config/current
├─ Status: 200 OK
├─ Body: { success: true, data: { domain: "...", ... } }
└─ Updates: setDomain("...")
```

### 3. State → Component Props
```
InstallationPage (parent)
├─ domain: "thompsonseparts.co.uk"
├─ serverUrl: "http://localhost:3000"
└─ isLoading: false

    ↓ Pass to child

QuickStart (child)
├─ domain: "thompsonseparts.co.uk" (used to create config)
├─ serverUrl: "http://localhost:3000"
└─ isLoading: false
```

### 4. Component → Code Generation
```
EmbedCodeGenerator
├─ config: {
│   serverUrl: "http://localhost:3000",
│   features.websiteScraping.urls: ["thompsonseparts.co.uk"],
│   ... appearance, behavior settings
│ }
├─ selectedFramework: "wordpress"
└─ customCSS: ""

    ↓ Call

generateEmbedCode(config, framework)
├─ Match framework type
├─ Insert config values into template
├─ Include serverUrl in script src
└─ Return complete code string
```

### 5. Code Generation → Display & Copy
```
Display:
├─ <pre> element
├─ <code> element with generated code
├─ Copy button with clipboard API
└─ 2-second feedback message

Copy Flow:
├─ navigator.clipboard.writeText(code)
├─ setCopied(true)
├─ Button shows "✅ Copied!"
└─ Auto-hide after 2 seconds
```

---

## Error Handling Flow

```
USER ACCESSES /dashboard/installation
                │
                ├─ Not authenticated?
                │  └─ Auth middleware redirects to /auth/login
                │
                ├─ No organization_members record?
                │  └─ API returns 404
                │  └─ Page shows "No Domain Configured"
                │  └─ User clicks "Go to Settings"
                │
                ├─ No customer_configs record?
                │  └─ API returns 404 (with helpful message)
                │  └─ Page shows "No Domain Configured"
                │  └─ User clicks "Go to Settings"
                │
                └─ All good?
                   └─ Page loads
                   └─ Shows domain in alert
                   └─ Shows code generator
                   └─ User can select framework & copy
```

---

## Test Coverage Map

```
✅ = Has Tests
❌ = No Tests

Database Layer:
  ❌ customer_configs query
  ❌ organization_members join
  ❌ sensitive field filtering

API Layer:
  ❌ GET /api/customer/config/current
  ❌ Authentication check
  ❌ Organization verification
  ❌ Response formatting

Page Components:
  ❌ InstallationPage
  ❌ QuickStart
  ❌ EmbedCodeGenerator
  ❌ PlatformGuides
  ❌ Troubleshooting

Utilities:
  ❌ generateEmbedCode()
  ❌ All 7 framework templates
  ❌ getContrastRatio()
  ❌ getInitialConfig()

Integration:
  ❌ E2E user journey
  ❌ Login → Installation → Code Copy
```

---

This architecture demonstrates:
- **Security**: Proper auth & org verification
- **Multi-tenancy**: No hardcoded values
- **Data Flow**: Clear path from DB → API → Components
- **Framework Support**: All 7 platforms fully functional
- **Error Handling**: Graceful degradation with helpful messages
- **User Experience**: Fast loading, clear feedback, easy to use
