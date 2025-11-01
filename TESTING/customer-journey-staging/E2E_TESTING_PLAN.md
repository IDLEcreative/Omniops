# 📋 Complete Customer Onboarding Journey: End-to-End Testing Plan

**Type:** Testing Guide
**Status:** Active
**Last Updated:** 2025-10-30
**Purpose:** Complete step-by-step guide for testing customer experience from signup to live AI chat agent
**Test Domain:** epartstaging.wpengine.com (Thompson's E-Parts Staging)

---

## Overview

This is the **complete customer experience** from first visit to having a live AI chat agent on their website. Follow each phase in order, document findings in [FINDINGS_AND_ISSUES.md](./FINDINGS_AND_ISSUES.md).

**Estimated Total Time:** 2-3 hours
**Test Scenario:** Pretend you're a new customer setting up an AI chat agent for the first time

---

## 🎯 Phase 1: Account Creation & Authentication
**Duration:** 5 minutes
**Goal:** Create account and access dashboard

### Steps:

#### 1.1 Visit Homepage
```
URL: https://www.omniops.co.uk/
```
**Expected:**
- Landing page loads
- See "Sign Up" or "Get Started" button
- Marketing copy about AI chat agents

**✅ Success Criteria:**
- [ ] Page loads in < 3 seconds
- [ ] CTA buttons are visible
- [ ] No console errors

---

#### 1.2 Sign Up / Log In
```
Action: Click "Sign Up" or "Dashboard" or "Log In"
```
**Expected:**
- Redirected to authentication page
- See Supabase Auth UI or custom login form
- Options: Email/password, OAuth (Google, GitHub, etc.)

**Fill in:**
```
Email: your-email@example.com
Password: [secure password]
```

**✅ Success Criteria:**
- [ ] Form validation works (email format, password strength)
- [ ] No errors on submit
- [ ] Confirmation email received (check inbox/spam)

**Common Issues:**
- Email verification required? Check inbox
- Password requirements not clear? Note for UX improvement
- OAuth redirect broken? Try email/password instead

---

#### 1.3 First Login - Organization Setup
```
Expected: Prompt to create organization OR auto-create one
```

**If prompted, fill in:**
```
Organization Name: Thompson's E-Parts Test
Industry: E-commerce / Industrial Parts (optional)
```

**✅ Success Criteria:**
- [ ] Organization created successfully
- [ ] Redirected to dashboard
- [ ] Welcome message or onboarding wizard appears

---

## 🎯 Phase 2: Dashboard Orientation
**Duration:** 3 minutes
**Goal:** Understand dashboard layout and features

### Steps:

#### 2.1 Explore Dashboard Navigation

**Look for these sections:**
- [ ] **Overview/Home** - Stats, recent activity
- [ ] **Domains** - Manage customer sites
- [ ] **Conversations** - Chat history
- [ ] **Analytics** - Usage metrics
- [ ] **Settings** - Account preferences
- [ ] **Billing** - Subscription management
- [ ] **Documentation** - Help/guides

**✅ Success Criteria:**
- [ ] Can identify all major sections
- [ ] Navigation is intuitive
- [ ] No broken links

---

#### 2.2 Check Dashboard Stats

**Expected to see:**
- Number of domains configured: 0 (fresh account)
- Total conversations: 0
- Messages this month: 0
- Active widgets: 0

**✅ Success Criteria:**
- [ ] Stats load without errors
- [ ] Empty state messaging is clear
- [ ] "Get Started" prompts are visible

---

## 🎯 Phase 3: Add Your First Domain
**Duration:** 10 minutes
**Goal:** Configure staging site as a new customer domain

### Steps:

#### 3.1 Navigate to Domain Management
```
Action: Click "Domains" or "Add Domain" or "Customer Configurations"
```

**Expected:**
- See empty state (no domains yet)
- Prominent "Add Domain" or "+ New Domain" button
- Maybe see example/demo

**✅ Success Criteria:**
- [ ] Can easily find domain management
- [ ] Empty state is encouraging (not confusing)
- [ ] CTA is clear

---

#### 3.2 Fill Out Domain Configuration Form

**Click "Add Domain" button**

**Expected Form Fields:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASIC INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Domain *
[epartstaging.wpengine.com]
ℹ️ Enter your website domain (without https://)

Business Name *
[Thompson's E-Parts Staging]
ℹ️ This appears in the chat widget

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRANDING (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Color
[#000000] 🎨
ℹ️ Widget theme color

Welcome Message
[Welcome to Thompson's staging environment!]
[How can I help you today?]

Suggested Questions (comma-separated)
[What products do you sell?, Do you ship internationally?]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WOOCOMMERCE INTEGRATION (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☑️ Enable WooCommerce Integration

WooCommerce Store URL *
[https://epartstaging.wpengine.com]

Consumer Key *
[ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c]
ℹ️ Get this from WooCommerce → Settings → Advanced → REST API

Consumer Secret *
[cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654]
⚠️ This will be encrypted and stored securely

[Test WooCommerce Connection] ← Click to verify

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVANCED SETTINGS (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☑️ Active (Enable this domain)
☐ Allow GDPR Data Exports
☐ Enable Analytics Tracking
```

**✅ Success Criteria:**
- [ ] Form has clear labels and tooltips
- [ ] Validation works in real-time
- [ ] Required fields are marked
- [ ] Help text is useful

---

#### 3.3 Test WooCommerce Connection (Optional but Recommended)

**Click "Test WooCommerce Connection" button**

**Expected Success Response:**
```
✅ Connection successful!
   Found 1,247 products in your store
   Store name: Thompson's E-Parts
   WooCommerce version: 8.3.1
```

**Expected Failure Response:**
```
❌ Connection failed
   Error: 401 Unauthorized

   Possible issues:
   • Invalid Consumer Key/Secret
   • REST API not enabled
   • Wrong store URL

   [Troubleshoot] [Try Again]
```

**✅ Success Criteria:**
- [ ] Test completes within 5 seconds
- [ ] Success message shows product count
- [ ] Error message is actionable
- [ ] Can retry without refreshing page

**If fails, check:**
- Are you using production or staging WooCommerce keys?
- Is REST API enabled in WooCommerce settings?
- Is the store URL correct (with https://)?

---

#### 3.4 Save Domain Configuration

**Click "Save Domain" button**

**Expected:**
1. Loading spinner appears
2. Success message: "✅ Domain configured successfully!"
3. Redirected to domain details page OR domains list
4. New domain appears in list with status "Active"

**✅ Success Criteria:**
- [ ] Save completes within 3 seconds
- [ ] Success feedback is clear
- [ ] Can immediately see the new domain
- [ ] Domain shows correct configuration

**Common Issues:**
- "Domain already exists" → Domain was created earlier, use edit instead
- "Organization not found" → Auth token issue, try logging out/in
- "Invalid domain format" → Check domain doesn't have http:// or trailing /
- Network error → Check if dev server/production is running

---

## 🎯 Phase 4: Scrape Your Website
**Duration:** 30-60 minutes (depending on site size)
**Goal:** Index staging site content for AI to search

### Steps:

#### 4.1 Navigate to Website Scraping

**From domain details page, look for:**
- "Scrape Website" button
- "Import Content" section
- "Index Your Site" option

**OR navigate to:** Dashboard → Domains → [Your Domain] → Content Management

**✅ Success Criteria:**
- [ ] Can easily find scraping feature
- [ ] Clear explanation of what scraping does
- [ ] Warning about time/cost (if applicable)

---

#### 4.2 Configure Scraping Job

**Expected Scraping Form:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEBSITE SCRAPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Starting URL *
[https://epartstaging.wpengine.com]
ℹ️ The crawler will start here and follow links

Max Pages to Scrape
[100] pages
ℹ️ Leave blank or -1 for unlimited (may take longer)

Scraping Options:

☑️ Turbo Mode (Faster scraping, recommended)
☑️ Generate Embeddings (Enable AI search)
☑️ Extract Products (Find product pages)
☐ Incremental Update (Only scrape changed pages)

Estimated Time: ~30 minutes for 100 pages
Estimated Cost: ~$2.50 in OpenAI credits

[Start Scraping]
```

**Configuration for this test:**
```
URL: https://epartstaging.wpengine.com
Max Pages: 100
Turbo Mode: ✅ Yes
Generate Embeddings: ✅ Yes
Extract Products: ✅ Yes
Incremental: ❌ No (first scrape)
```

**✅ Success Criteria:**
- [ ] Form has sensible defaults
- [ ] Cost/time estimates are shown
- [ ] Options are clearly explained
- [ ] Can modify settings before starting

---

#### 4.3 Start Scraping Job

**Click "Start Scraping"**

**Expected:**
1. Confirmation dialog: "This will scrape up to 100 pages. Continue?"
2. Click "Confirm"
3. Redirected to scraping progress page
4. Job starts in background
5. Job ID shown (for tracking)

**✅ Success Criteria:**
- [ ] Job starts within 5 seconds
- [ ] Job ID is assigned
- [ ] Redirected to progress page
- [ ] Can navigate away and come back

**Critical Issues to Watch For:**
- "Worker script not found" → Backend issue, needs debugging
- "Redis connection failed" → Infrastructure issue
- "Authentication required" → Session expired
- 500 error → Backend crash

---

#### 4.4 Monitor Scraping Progress

**Expected Progress UI:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCRAPING IN PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: Running
Started: 2 minutes ago
Job ID: job_abc123

Progress: ████████░░░░░░░░░░░░ 42/100 pages

Current: Scraping product pages...
Last scraped: /product/rollerbar-assy-2000sr/

Stats:
  Pages discovered: 156
  Pages scraped: 42
  Products found: 28
  Errors: 0

[View Logs] [Cancel Job]

⟳ Auto-refreshing every 5 seconds...
```

**✅ Success Criteria:**
- [ ] Progress updates automatically
- [ ] Current status is clear
- [ ] Can see what page is being scraped
- [ ] Error count stays low (< 5%)
- [ ] Can cancel if needed

**Watch for problems:**
- Job stuck at same page > 2 minutes → Crawler error
- Error count > 10 → Site blocking or crawler issues
- Job cancelled unexpectedly → Timeout or memory issue
- No progress updates → WebSocket/polling broken

---

#### 4.5 Wait for Completion

**Expected Completion UI:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCRAPING COMPLETED ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Finished: Just now
Duration: 32 minutes
Job ID: job_abc123

Results:
  ✅ Pages scraped: 100/100
  ✅ Products extracted: 67
  ✅ Embeddings generated: 100
  ⚠️ Pages with errors: 3 (view details)

Next Steps:
  → Test your chat widget
  → View indexed content
  → Set up widget on your site

[View Indexed Pages] [Test Chat Widget] [Download Report]
```

**✅ Success Criteria:**
- [ ] Job completes successfully
- [ ] Final stats match expectations (~100 pages, ~60-80 products)
- [ ] Embeddings generated (should match page count)
- [ ] Error rate < 5%
- [ ] Clear next steps provided

**If high error rate (> 10%):**
- Check error details (robots.txt blocking? Rate limiting?)
- Note which pages failed (product pages? Category pages?)
- Consider re-running scrape

---

#### 4.6 Verify Scraped Data

**Click "View Indexed Pages"**

**Expected:**
- Table of all scraped pages
- Columns: URL, Title, Last Scraped, Status, Products Found, Actions
- Search/filter functionality
- Pagination (10-50 per page)
- Can click URL to preview content

**Quick Spot Checks:**
- [ ] Product pages are scraped (check 5 random products)
- [ ] Category pages are scraped
- [ ] Homepage is included
- [ ] Contact/about pages are included

**✅ Success Criteria:**
- [ ] Can see all 100 scraped pages
- [ ] Titles are meaningful (not "Page 1", "Untitled")
- [ ] URLs are correct
- [ ] Can filter/search effectively
- [ ] Product extraction worked (products column shows count)

---

## 🎯 Phase 5: Get Widget Embed Code
**Duration:** 5 minutes
**Goal:** Copy widget code to install on WordPress site

### Steps:

#### 5.1 Navigate to Widget Installation

**From domain details, look for:**
- "Install Widget" section
- "Get Embed Code" button
- "Integration" tab
- "Embed Code" section

**✅ Success Criteria:**
- [ ] Can easily find embed code section
- [ ] Instructions are clear
- [ ] Copy button works

---

#### 5.2 Copy Embed Code

**Expected Code Snippet:**

```html
<!-- OmniOps AI Chat Widget -->
<script src="https://www.omniops.co.uk/embed.js"
        data-domain="epartstaging.wpengine.com"
        data-position="bottom-right"
        async>
</script>
<!-- End OmniOps AI Chat Widget -->
```

**Verify:**
- [ ] Domain parameter is correct: `epartstaging.wpengine.com`
- [ ] Script URL is production: `https://www.omniops.co.uk/embed.js`
- [ ] Has `async` attribute (for performance)
- [ ] Position is customizable (optional)

**Additional options might show:**
```
Position:
  ○ Bottom Right (default)
  ○ Bottom Left
  ○ Top Right
  ○ Top Left

Theme:
  ○ Auto (follows site theme)
  ○ Light
  ○ Dark

[Copy Code] [Preview Widget] [Download as File]
```

**✅ Success Criteria:**
- [ ] One-click copy works
- [ ] Code is properly formatted
- [ ] Customization options are clear
- [ ] Preview option available

---

#### 5.3 Preview Widget (Optional)

**Click "Preview Widget"**

**Expected:**
- Opens modal or new tab with widget demo
- Shows widget in action on sample page
- Can test chat without installing on real site
- Preview uses YOUR actual configuration (branding, welcome message)

**Test in preview:**
- [ ] Widget appears in correct position
- [ ] Branding colors are correct
- [ ] Welcome message shows correctly
- [ ] Can type and send test message
- [ ] Chat works (might be slow if using live API)

**✅ Success Criteria:**
- [ ] Preview loads quickly
- [ ] Widget looks professional
- [ ] No visual glitches
- [ ] Mobile-responsive (test by resizing)

---

## 🎯 Phase 6: Install Widget on WordPress
**Duration:** 10 minutes
**Goal:** Add widget to staging WordPress site

### Steps:

#### 6.1 Access WordPress Admin
```
URL: https://epartstaging.wpengine.com/wp-admin/
Login: [your WP credentials]
```

**✅ Success Criteria:**
- [ ] Can log in successfully
- [ ] Admin dashboard loads

---

#### 6.2 Choose Installation Method

**Method A: Header/Footer Plugin (Recommended - Safest)**
```
Plugins → Add New → Search "Insert Headers and Footers"
Popular options:
  • WPCode (formerly Insert Headers and Footers)
  • Head, Footer and Post Injections
  • Simple Custom CSS and JS
```

**Install & Activate** → Go to plugin settings

**Method B: Theme Customizer (Good for non-developers)**
```
Appearance → Customize → Additional CSS or Footer Scripts
(availability depends on theme)
```

**Method C: Theme Editor (Advanced - Use with caution)**
```
Appearance → Theme File Editor → footer.php
⚠️ Warning: Editing theme files directly can break site
⚠️ Create child theme or use Method A instead
```

**Choose one method and proceed**

**✅ Success Criteria:**
- [ ] Installation method is clear
- [ ] Have necessary permissions
- [ ] Understand rollback process if something breaks

---

#### 6.3 Paste Embed Code

**For Method A (Plugin):**
1. Go to plugin settings (e.g., WPCode → Header & Footer)
2. Find "Footer Scripts" section
3. Paste widget code
4. Save changes

**For Method B (Customizer):**
1. In customizer, find "Footer Scripts" or "Additional Scripts"
2. Paste widget code
3. Click "Publish"

**For Method C (Theme Editor):**
1. In footer.php, find `</body>` closing tag
2. Paste widget code BEFORE `</body>`
3. Click "Update File"

**Code to paste:**
```html
<!-- OmniOps AI Chat Widget -->
<script src="https://www.omniops.co.uk/embed.js"
        data-domain="epartstaging.wpengine.com"
        data-position="bottom-right"
        async>
</script>
<!-- End OmniOps AI Chat Widget -->
```

**✅ Success Criteria:**
- [ ] Code pasted successfully
- [ ] No syntax errors shown
- [ ] Changes saved without errors

---

#### 6.4 Clear WordPress Cache

**If you have a caching plugin:**
```
Common plugins:
  • WP Rocket → Clear Cache
  • W3 Total Cache → Performance → Empty all caches
  • WP Super Cache → Delete Cache
  • LiteSpeed Cache → Purge All
  • WP Fastest Cache → Delete Cache
```

**If no caching plugin:**
- Probably no cache to clear
- But do hard refresh in browser (next step)

**✅ Success Criteria:**
- [ ] Cache cleared successfully
- [ ] No errors from cache plugin

---

#### 6.5 View Staging Site & Test Widget

**Open site in incognito/private window:**
```
URL: https://epartstaging.wpengine.com
```

**Do a hard refresh:**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Expected:**
- Widget bubble appears in bottom-right corner (or chosen position)
- Bubble shows your brand color
- Smooth fade-in animation
- Bubble is clickable

**✅ Success Criteria:**
- [ ] Widget bubble is visible
- [ ] Positioned correctly
- [ ] Brand color applied
- [ ] Animates smoothly
- [ ] No layout shift (page doesn't jump)

---

**If widget doesn't appear:**

**Check browser console (F12 → Console tab):**

Look for these errors:
```javascript
❌ "Refused to load script 'embed.js'"
   → CSP (Content Security Policy) blocking
   → Need to update next.config.js

❌ "CORS policy: No 'Access-Control-Allow-Origin'"
   → CORS issue
   → Need to update API headers

❌ "Failed to fetch /api/widget/config"
   → Backend API issue
   → Check if API endpoint works

❌ "embed.js:1 404 Not Found"
   → Script not found
   → Check if embed.js exists at URL

❌ No errors but widget not showing
   → Check z-index (other elements covering it?)
   → Check if script executed (add console.log in embed.js)
```

**Check Network tab (F12 → Network):**
- [ ] embed.js loaded successfully (200 status)
- [ ] /api/widget/config called and returned 200
- [ ] No failed requests

**Quick debug checklist:**
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Cleared WordPress cache
- [ ] Tested in incognito mode
- [ ] Checked browser console for errors
- [ ] Verified embed code domain matches

---

## 🎯 Phase 7: Test Chat Functionality
**Duration:** 15 minutes
**Goal:** Verify AI chat works with scraped data

### Steps:

#### 7.1 Open Chat Widget

**Click widget bubble**

**Expected:**
- Chat window expands smoothly
- Transition animation (slide up or fade)
- Welcome message appears immediately:
  ```
  👋 Welcome to Thompson's staging environment!
  How can I help you today?
  ```
- Suggested questions show (if configured):
  ```
  • What products do you sell?
  • Do you ship internationally?
  • What are your opening hours?
  ```
- Input field is focused and ready
- Typing indicator works
- Professional appearance

**✅ Success Criteria:**
- [ ] Widget opens smoothly (no lag)
- [ ] Welcome message is YOUR message (not default)
- [ ] Branding colors applied throughout
- [ ] Text is readable
- [ ] Input field works
- [ ] Can close widget

---

#### 7.2 Test Basic Query

**Type and send:**
```
"Hello, can you help me?"
```

**Expected Response Time:** 2-4 seconds

**Expected Response (example):**
```
Hello! Yes, I'd be happy to help you. I can assist with:

• Product information and recommendations
• Checking availability and pricing
• Order tracking and delivery questions
• Technical specifications
• And any other questions about our parts

What would you like to know?
```

**✅ Success Criteria:**
- [ ] Response received within 5 seconds
- [ ] Response is professional and helpful
- [ ] No generic "I'm an AI" disclaimers
- [ ] Reflects your business (mentions "parts" not generic products)
- [ ] Offers clear next steps
- [ ] No hallucinations (making up information)

**Watch for issues:**
- No response after 10 seconds → Timeout, check logs
- Generic ChatGPT response → System prompt not working
- Error message → OpenAI quota, API key, or backend issue

---

#### 7.3 Test RAG/Semantic Search (CRITICAL TEST)

**Type and send:**
```
"Do you sell rollerbar assemblies?"
```

**Expected Response (should be SPECIFIC):**
```
Yes, we do sell rollerbar assemblies! I found this product:

**ROLLERBAR ASSY 2000SR**
Price: £230.00 (Excl VAT) / £276.00 (Inc VAT)
SKU: 1800033
Category: Manual Pull Tarp System

This is a rollerbar assembly for the 2000SR manual pull tarp
system, used in tipper trailer sheeting applications.

[View Product →]

Would you like more information about this product or see
other tipper sheeting system parts?

━━━━━━━━━━━━━━━━━━
Sources:
• Product: ROLLERBAR ASSY 2000SR
• Category: Manual Pull Tarp System
```

**✅ Success Criteria:**
- [ ] **Specific product mentioned** (not generic)
- [ ] **Correct price** (matches WooCommerce)
- [ ] **Correct SKU** (1800033)
- [ ] **Working product link**
- [ ] **Sources cited** at bottom
- [ ] Response is contextual to Thompson's business

**🚨 RED FLAGS (RAG not working):**
- ❌ "I don't have specific information about our products..."
- ❌ No sources listed at bottom
- ❌ Generic response: "We may have that product, please check our catalog"
- ❌ Wrong product mentioned
- ❌ No price information

**If RAG not working:**
- Scraping might have failed (check Phase 4.6)
- Embeddings not generated (check database)
- Search endpoint broken (check logs)

---

#### 7.4 Test WooCommerce Integration

**Type and send:**
```
"Show me products under £50"
```

**Expected Response:**
```
I found several products under £50:

1. **Sheet Roller replacement 3/4" Bearing**
   Price: £16.85 (Excl VAT)
   SKU: 145
   [View Product →]

2. **Covermaster Spring Arm 23mm Hex Bearing**
   Price: £13.13 (Excl VAT)
   SKU: 3346
   [View Product →]

3. **Shock Cord Bungee 8mm**
   Price: £8.50 (Excl VAT)
   SKU: 2119
   [View Product →]

[...more products...]

All prices shown exclude VAT. Would you like more details
about any of these?
```

**✅ Success Criteria:**
- [ ] Multiple products returned (at least 3-5)
- [ ] All prices are under £50
- [ ] Each product has name, price, SKU
- [ ] Each product has working link
- [ ] Prices match actual WooCommerce prices
- [ ] VAT handling is correct

**If fails:**
- 401 error → WooCommerce credentials wrong
- Empty results → No products in that price range, or API not working
- Wrong prices → Currency conversion issue or outdated data

---

#### 7.5 Test Product Availability Check

**Type and send:**
```
"Is the ROLLERBAR ASSY 2000SR in stock?"
```

**Expected Response:**
```
Yes, the **ROLLERBAR ASSY 2000SR** is currently in stock!

Details:
• Price: £230.00 (Excl VAT) / £276.00 (Inc VAT)
• SKU: 1800033
• Stock Status: ✅ In Stock
• Category: Manual Pull Tarp System

You can order it here:
[View Product & Order →]

Would you like to know about delivery options or have any
other questions about this product?
```

**✅ Success Criteria:**
- [ ] Specific product identified correctly
- [ ] Stock status retrieved from WooCommerce API
- [ ] Current pricing shown
- [ ] Product link works
- [ ] Response is conversational and helpful

---

#### 7.6 Test Conversation Memory

**Follow-up query (without repeating context):**
```
"What category is that in?"
```

**Expected Response:**
```
The ROLLERBAR ASSY 2000SR is in the following categories:

• **Manual Pull Tarp System**
• **Tipper & Trailer Sheeting Systems & Spares**

It's part of our tipper sheeting accessories range, specifically
for manual pull tarp systems on trailers.

Would you like to see other products in these categories?
```

**✅ Success Criteria:**
- [ ] AI remembers "that" = ROLLERBAR from previous message
- [ ] Doesn't ask "which product?"
- [ ] Response is contextually aware
- [ ] Maintains conversation thread

**This proves:**
- Conversation history is being passed correctly
- Context window is working
- AI understands references

---

#### 7.7 Test Error Handling & Hallucination Prevention

**Type and send:**
```
"Do you sell flux capacitors?"
```

**Expected Response (Product Not Found):**
```
I couldn't find any products matching "flux capacitors" in
our inventory.

We specialize in:
• Tipper body parts and equipment
• Hydraulic systems and components
• Trailer sheeting systems
• Crane parts and accessories
• Truck body fittings and hardware

Could you describe what you're looking for in different terms,
or let me know what vehicle or application you need parts for?
I'd be happy to help you find the right solution.
```

**✅ Success Criteria (CRITICAL):**
- [ ] **Does NOT claim to have flux capacitors**
- [ ] Admits product not found
- [ ] Suggests alternative approaches
- [ ] Stays in character (parts business)
- [ ] Offers to help differently

**🚨 CRITICAL FAILURE:**
- ❌ "Yes, we have flux capacitors for £99..." → **HALLUCINATION**
- ❌ Makes up product details
- ❌ Provides fake SKU or link

**If hallucination occurs:**
- This is a critical bug
- System prompt not working
- Anti-hallucination safeguards failed
- Document immediately in FINDINGS_AND_ISSUES.md

---

## 🎯 Phase 8: A/B Comparison Testing
**Duration:** 10 minutes
**Goal:** Compare staging vs production performance

### Steps:

#### 8.1 Test Same Query on Both Domains

**Test Query:** "Show me hydraulic pumps"

**Test on Production (working baseline):**
```
https://www.omniops.co.uk/embed?domain=thompsonseparts.co.uk
```

**Test on Staging (your new setup):**
```
https://www.omniops.co.uk/embed?domain=epartstaging.wpengine.com
```

**Or test directly on the WordPress sites:**
- Production: https://www.thompsonseparts.co.uk
- Staging: https://epartstaging.wpengine.com

---

**Comparison Matrix:**

| Metric | Production (thompsonseparts.co.uk) | Staging (epartstaging.wpengine.com) | Match? |
|--------|-------------------------------------|--------------------------------------|--------|
| **Response Time** | ___ sec | ___ sec | ✅ / ❌ |
| **Products Found** | ___ items | ___ items | ✅ / ❌ |
| **Product Accuracy** | ⭐️⭐️⭐️⭐️⭐️ | ⭐️⭐️⭐️⭐️⭐️ | ✅ / ❌ |
| **Sources Cited** | ___ sources | ___ sources | ✅ / ❌ |
| **Links Work** | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| **Prices Match** | £___ | £___ | ✅ / ❌ |
| **Stock Status** | In Stock / Out | In Stock / Out | ✅ / ❌ |
| **Response Quality** | ⭐️ 1-5 | ⭐️ 1-5 | ✅ / ❌ |

**✅ Success Criteria:**
- [ ] Both domains return results
- [ ] Results are similar quality (not identical, but comparable)
- [ ] Response times are similar (± 2 seconds)
- [ ] Both cite sources
- [ ] Both use brand voice correctly

**Expected differences (OK):**
- Staging might be slightly slower (smaller dataset to search)
- Exact products might differ slightly (different relevance scores)
- Links point to different domains (staging vs production)

**Concerning differences:**
- One works, one doesn't → Setup issue on staging
- Major quality difference → Data quality issue
- Huge performance gap → Infrastructure issue

---

#### 8.2 Test Edge Cases on Both

**Test these queries on BOTH domains:**

1. **Very specific product:**
   ```
   "Do you have part number 1800033?"
   ```
   - Both should find ROLLERBAR ASSY 2000SR

2. **Ambiguous query:**
   ```
   "I need help with my truck"
   ```
   - Both should ask clarifying questions

3. **Category browsing:**
   ```
   "Show me all hydraulic parts"
   ```
   - Both should return category overview + products

4. **Price comparison:**
   ```
   "What's your cheapest crane pad?"
   ```
   - Both should return lowest-priced crane pad

5. **Out of scope:**
   ```
   "Can you recommend a pizza place nearby?"
   ```
   - Both should politely decline and refocus on business

**✅ Success Criteria:**
- [ ] Both handle edge cases gracefully
- [ ] No major quality differences
- [ ] Both stay in character
- [ ] Neither hallucinates

---

## 🎯 Phase 9: Dashboard Analytics Review
**Duration:** 5 minutes
**Goal:** Verify analytics tracking and reporting

### Steps:

#### 9.1 Return to Dashboard

**Navigate to:** Dashboard → Analytics or Overview

**Expected to see:**
- Conversation count increased from 0 to ~8-10
- Message count updated (~40-50 messages)
- Active domains: 1 (or 2 if you didn't remove old test data)
- Response time average
- User satisfaction metrics (if implemented)
- Recent conversations list

**✅ Success Criteria:**
- [ ] Stats updated with new data
- [ ] Numbers make sense (message count ≈ conversations × 5)
- [ ] Recent conversations show
- [ ] Can drill down for details

---

#### 9.2 View Conversation History

**Navigate to:** Dashboard → Conversations

**Expected:**
- List of recent chats (from your testing)
- Each row shows:
  - Domain
  - Start time
  - Message count
  - Status (active/resolved/abandoned)
  - First message preview
- Filters: by domain, date range, status
- Search functionality
- Sort options (newest first, most messages, etc.)

**Click on a conversation:**

**Expected Conversation Detail View:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION #abc123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Domain: epartstaging.wpengine.com
Started: 5 minutes ago
Duration: 4m 32s
Messages: 7 exchanges (14 total messages)
Status: ✅ Resolved

Full Transcript:
───────────────────────────────────────────

👤 User: Hello, can you help me?
🤖 Agent: Hello! Yes, I'd be happy to help you...

👤 User: Do you sell rollerbar assemblies?
🤖 Agent: Yes, we do sell rollerbar assemblies...

[... full conversation ...]

───────────────────────────────────────────
Metadata:
• Search iterations: 2
• Products shown: 3
• WooCommerce queries: 2
• Sources cited: 5
• Total tokens: 1,247
• Cost: $0.03

Privacy:
[Export Conversation] [Delete Data]
```

**✅ Success Criteria:**
- [ ] Can see full conversation transcript
- [ ] Timestamps are correct
- [ ] Metadata is tracked (searches, products, tokens)
- [ ] User and agent messages clearly distinguished
- [ ] Export/delete options available (GDPR compliance)

---

#### 9.3 Check Domain-Specific Analytics

**Navigate to:** Dashboard → Domains → [epartstaging.wpengine.com]

**Expected domain-specific stats:**
- Total conversations: ~8-10
- Total messages: ~40-50
- Avg response time: ~3-4 seconds
- Most asked questions (if enough data)
- Product search analytics
- Satisfaction score (if implemented)
- Uptime/availability

**✅ Success Criteria:**
- [ ] Stats are domain-specific (not mixed with other domains)
- [ ] Numbers match conversation history
- [ ] Trends are visualized (graphs/charts)
- [ ] Can export data

---

## 🎯 Phase 10: Advanced Features Testing (Optional)
**Duration:** 15 minutes
**Goal:** Test additional features if implemented

### Optional Tests:

#### 10.1 GDPR Data Export
**If implemented:**
1. Navigate to Settings or Privacy
2. Request user data export (as if you're a customer)
3. Verify email received with download link
4. Download and check format (JSON, CSV, or PDF?)
5. Verify contains: conversations, messages, metadata
6. Verify excludes: internal IDs, system logs

**✅ Success Criteria:**
- [ ] Export completes within 5 minutes
- [ ] Email notification works
- [ ] Data is complete and readable
- [ ] Privacy-compliant (no unnecessary data)

---

#### 10.2 Widget Customization
**If implemented:**
1. Go to domain settings
2. Change widget theme color to #FF0000 (red)
3. Update welcome message
4. Save changes
5. Visit staging site (hard refresh)
6. Verify changes applied immediately

**✅ Success Criteria:**
- [ ] Changes save without errors
- [ ] Changes reflect immediately (or within 1 minute)
- [ ] No need to re-copy embed code
- [ ] Cache invalidation works

---

#### 10.3 Incremental Scraping
**If implemented:**
1. Add a new page to WordPress (test blog post)
2. Publish it
3. Go to dashboard → Domain → Scrape
4. Enable "Incremental Update"
5. Start scrape
6. Verify only 1-2 pages scraped (new + changed)
7. Test if chat can find content from new page

**✅ Success Criteria:**
- [ ] Incremental mode works (doesn't re-scrape all 100 pages)
- [ ] New content is indexed
- [ ] Embeddings generated for new content
- [ ] AI can answer questions about new page

---

#### 10.4 Mobile Testing
**If not done yet:**
1. Open staging site on actual mobile device (or DevTools mobile emulator)
2. Test widget opens/closes smoothly
3. Test chat interface is usable on small screen
4. Test typing and sending messages
5. Test product links work
6. Test scrolling in chat history

**✅ Success Criteria:**
- [ ] Widget bubble is appropriately sized
- [ ] Chat window doesn't cover entire screen
- [ ] Text is readable (not too small)
- [ ] Keyboard doesn't break layout
- [ ] Can scroll through long responses
- [ ] Links are tappable (not too small)

---

## 📊 Final Checklist: Did Everything Work?

### Core Functionality
- [ ] ✅ Account created successfully
- [ ] ✅ Organization setup complete
- [ ] ✅ Domain configured and saved
- [ ] ✅ WooCommerce integration working (products found, prices correct)
- [ ] ✅ Website scraping completed (100 pages)
- [ ] ✅ Embeddings generated (100 embeddings)
- [ ] ✅ Widget code copied and installed
- [ ] ✅ Widget appears on WordPress site
- [ ] ✅ Chat responds to queries (< 5 second response time)
- [ ] ✅ RAG search finds relevant content (specific, not generic)
- [ ] ✅ Product lookup works (WooCommerce API functional)
- [ ] ✅ Conversation memory works (follow-up questions understood)
- [ ] ✅ Error handling graceful (no hallucinations)
- [ ] ✅ Conversation history saved in dashboard
- [ ] ✅ Analytics tracking works

### Performance
- [ ] Widget load time < 1 second
- [ ] Chat response time < 5 seconds
- [ ] Scraping completed in < 60 minutes
- [ ] No timeout errors
- [ ] No memory issues

### Quality
- [ ] Responses are accurate (no made-up information)
- [ ] Sources cited correctly
- [ ] Product links work (lead to correct pages)
- [ ] Prices match WooCommerce
- [ ] Professional brand voice maintained
- [ ] No console errors on frontend
- [ ] Mobile-friendly (if tested)

### Data Isolation (A/B Test)
- [ ] Staging data separate from production
- [ ] Both domains work independently
- [ ] Similar quality (comparable results)
- [ ] Conversations tagged to correct domain

---

## 🐛 Issue Severity Guide

When you find issues, rate them by severity:

**🔴 Critical (P0) - Blocks core functionality**
- Widget doesn't load at all
- Chat returns no response
- WooCommerce completely broken
- Scraping fails with error
- Data leakage between domains
- Hallucinations (making up products/prices)

**🟠 High (P1) - Major degradation**
- Slow response time (> 10 seconds)
- RAG not working (generic responses)
- Sources not cited
- Product links broken
- Analytics not tracking
- High error rate (> 10%)

**🟡 Medium (P2) - Noticeable issues**
- Minor UI glitches
- Inconsistent branding
- Confusing error messages
- Missing helpful features
- Poor mobile experience
- Documentation unclear

**🟢 Low (P3) - Nice-to-have improvements**
- Better onboarding flow
- Additional customization options
- Performance optimizations
- UI polish
- Better analytics visualization

---

## 📝 Next Steps After Testing

### If Everything Works ✅
1. Document success in FINDINGS_AND_ISSUES.md
2. Note total time spent
3. Rate overall experience (1-10)
4. Suggest UX improvements
5. Consider testing with real users

### If Issues Found 🐛
1. Document each issue with severity
2. Include reproduction steps
3. Add screenshots/console logs
4. Prioritize fixes (critical first)
5. Retest after fixes applied

### Continuous Improvement 📈
1. Monitor real user conversations
2. Track common questions
3. Identify gaps in content
4. Optimize response quality
5. Improve scraping coverage

---

## 🔗 Related Documents

- [FINDINGS_AND_ISSUES.md](./FINDINGS_AND_ISSUES.md) - Your working notes and bug tracker
- [../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Database reference
- [../../docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md](../../docs/09-REFERENCE/REFERENCE_API_ENDPOINTS.md) - API documentation
- [../../CLAUDE.md](../../CLAUDE.md) - Development guidelines

---

**Good luck with your testing! 🚀**

Remember: The goal is to **experience what a real customer experiences**. Don't just check boxes - actually evaluate the UX, think about what's confusing, note what delights you, and imagine explaining this to someone non-technical.

**When you find issues, document them immediately in FINDINGS_AND_ISSUES.md before moving on!**
