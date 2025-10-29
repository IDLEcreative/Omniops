=== Omniops Chat Widget ===
Contributors: omniops
Tags: chat, customer service, ai, woocommerce, support, chatbot, embeddings
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered customer service chat widget with semantic search and WooCommerce integration.

== Description ==

Omniops Chat Widget adds intelligent, AI-powered customer service to your WordPress site.

**Key Features:**

* 🤖 **AI-Powered Responses** - Uses OpenAI GPT-4 for intelligent, context-aware answers
* 🔍 **Semantic Search** - Vector embeddings for accurate content retrieval
* 🛒 **WooCommerce Integration** - Order lookup, product search, cart tracking
* 🔒 **GDPR Compliant** - Privacy controls, opt-out, configurable data retention
* 📱 **Responsive Design** - Works perfectly on mobile and desktop
* 🌍 **Multi-Language** - Supports 40+ languages automatically
* ⚡ **Fast Performance** - Cached responses, optimized load times
* 🎨 **Customizable** - Configure appearance, position, and behavior

**Perfect For:**

* E-commerce stores (especially WooCommerce)
* Service businesses
* SaaS companies
* Support teams
* Any website needing intelligent customer service

**How It Works:**

1. Install and activate the plugin
2. Widget automatically appears on your site
3. Visitors can ask questions in natural language
4. AI responds with accurate, helpful answers
5. Integrates with WooCommerce for order/product queries

== Installation ==

**Automatic Installation (Recommended):**

1. Go to Plugins → Add New
2. Search for "Omniops Chat Widget"
3. Click "Install Now"
4. Activate the plugin

**Manual Installation:**

1. Download the plugin ZIP file
2. Go to Plugins → Add New → Upload Plugin
3. Choose the ZIP file and click "Install Now"
4. Activate the plugin

**From Source:**

1. Upload `omniops-chat-widget` folder to `/wp-content/plugins/`
2. Activate through 'Plugins' menu in WordPress

**After Installation:**

1. Go to Settings → Chat Widget to view status
2. Visit your website (not admin area) to see the widget
3. Click the chat icon in bottom-right corner to test

== Frequently Asked Questions ==

= How do I test if the widget is working? =

Visit any page on your public site (not the admin area) and look for the chat icon in the bottom-right corner. Click it to open and try asking "What products do you sell?" or "Tell me about your company".

= Does this work with WooCommerce? =

Yes! If WooCommerce is installed, the widget automatically enables:
* Order lookup ("Check order #12345")
* Product search ("Show me blue products")
* Stock checking ("Is product X in stock?")
* Cart integration

= Is this GDPR compliant? =

Yes. The widget includes:
* Privacy notice display
* Opt-out functionality
* Configurable data retention (default: 30 days)
* User consent management
* Data export and deletion APIs

= Can I customize the appearance? =

Yes! Edit the plugin file to customize:
* Position (bottom-right, bottom-left, etc.)
* Size (width and height)
* Colors (via CSS)
* Privacy settings
* Behavior options

= Will this slow down my site? =

No. The widget:
* Loads asynchronously (doesn't block page load)
* Weighs only ~15KB minified
* Uses efficient caching
* Has optimized load times (<2 seconds)

= What languages are supported? =

The widget automatically detects and responds in 40+ languages including:
* English, Spanish, French, German
* Italian, Portuguese, Dutch
* Chinese, Japanese, Korean
* Arabic, Hindi, Russian
* And many more!

= How much does it cost? =

Contact Omniops for pricing information. The plugin itself is free to install.

= Where is my data stored? =

Data is securely stored on Omniops servers with:
* Encryption at rest and in transit
* Regular backups
* GDPR-compliant data handling
* Configurable retention periods

= Can I use this on multiple sites? =

Yes, you can install the plugin on multiple WordPress sites. Each site will be tracked separately.

= What happens if the Omniops service is down? =

The widget fails gracefully:
* Shows a friendly error message
* Doesn't break your site
* Automatically retries when service is restored

== Screenshots ==

1. Chat widget on website frontend
2. Widget open with conversation
3. WooCommerce order lookup
4. Admin settings page
5. Mobile responsive design

== Changelog ==

= 1.1.0 - 2025-10-29 =
* Initial public release
* AI-powered chat responses with GPT-4
* Semantic search using vector embeddings
* WooCommerce integration (orders, products, cart)
* Privacy controls and GDPR compliance
* Responsive mobile and desktop design
* Multi-language support (40+ languages)
* User context tracking
* Admin settings page
* Comprehensive documentation

= 1.0.0 - Internal Testing =
* Beta testing phase
* Core functionality development

== Upgrade Notice ==

= 1.1.0 =
Initial public release. Install to add AI-powered customer service to your WordPress site.

== Additional Info ==

**Requirements:**

* WordPress 5.8 or higher
* PHP 7.4 or higher
* HTTPS recommended (required for some features)
* Modern browser (Chrome, Firefox, Safari, Edge)

**Optional but Recommended:**

* WooCommerce 5.0+ (for e-commerce features)
* SSL certificate (for secure connections)

**Support:**

* Documentation: https://www.omniops.co.uk/docs
* Email: support@omniops.co.uk
* GitHub: (add repository URL)

**Privacy Policy:**

This plugin connects to Omniops servers to provide AI-powered chat functionality. When users interact with the widget:

* Conversation data is sent to Omniops servers
* IP addresses may be logged for security
* User information (if logged in) is shared with the service
* Data is retained according to configured settings (default: 30 days)
* Users can opt out of tracking at any time

Read the full privacy policy: https://www.omniops.co.uk/privacy

**Credits:**

* Developed by Omniops
* Powered by OpenAI GPT-4
* Uses Next.js, React, and TypeScript
* Vector search powered by Supabase (PostgreSQL + pgvector)

**Contributing:**

We welcome contributions! Visit our GitHub repository to:
* Report bugs
* Suggest features
* Submit pull requests
* Read development documentation

== Technical Details ==

**Architecture:**

* Frontend: React 19 with TypeScript
* Backend: Next.js 15 API routes
* Database: PostgreSQL with pgvector extension
* AI: OpenAI GPT-4 with embeddings
* Caching: Redis + LRU in-memory cache
* Search: Hybrid (vector + keyword)

**Performance:**

* Widget load time: <2 seconds
* Response time: 2-5 seconds (first query)
* Cached responses: <1 second
* Bundle size: ~15KB minified

**Security:**

* HTTPS required for production
* API rate limiting
* Input sanitization
* XSS protection
* CORS configuration
* Encrypted data transmission
