<?php
/**
 * Plugin Name: Omniops Chat Widget
 * Plugin URI: https://www.omniops.co.uk
 * Description: AI-powered customer service chat widget with semantic search and WooCommerce integration
 * Version: 1.1.0
 * Author: Omniops
 * Author URI: https://www.omniops.co.uk
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: omniops-chat-widget
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OMNIOPS_WIDGET_VERSION', '1.1.0');

// ⚠️ IMPORTANT: Change this to your production domain!
// For testing locally, use: http://localhost:3000
// For production, use: https://www.omniops.co.uk
define('OMNIOPS_WIDGET_URL', 'https://www.omniops.co.uk');

/**
 * Add chat widget to footer
 */
function omniops_add_chat_widget() {
    // Don't show in admin area
    if (is_admin()) {
        return;
    }

    // Get current domain for WooCommerce integration
    $current_domain = $_SERVER['HTTP_HOST'];

    // Detect if WooCommerce is active
    $woocommerce_enabled = class_exists('WooCommerce') ? 'true' : 'false';

    // Get current user info (if logged in)
    $user_data = 'null';
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $user_data = json_encode([
            'isLoggedIn' => true,
            'userId' => (string)$current_user->ID,
            'email' => $current_user->user_email,
            'displayName' => $current_user->display_name,
        ]);
    }

    // Get page context
    $page_context = json_encode([
        'url' => get_permalink(),
        'title' => get_the_title(),
        'path' => $_SERVER['REQUEST_URI'],
        'postType' => get_post_type(),
    ]);

    // Get cart data if WooCommerce is active
    $cart_data = 'null';
    if (class_exists('WooCommerce') && function_exists('WC')) {
        $cart = WC()->cart;
        if ($cart && !$cart->is_empty()) {
            $cart_items = [];
            foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
                $product = $cart_item['data'];
                $cart_items[] = [
                    'productId' => $cart_item['product_id'],
                    'name' => $product->get_name(),
                    'quantity' => $cart_item['quantity'],
                    'price' => $product->get_price(),
                ];
            }
            $cart_data = json_encode([
                'items' => $cart_items,
                'total' => $cart->get_cart_contents_total(),
                'count' => $cart->get_cart_contents_count(),
            ]);
        }
    }

    ?>
    <!-- Omniops Chat Widget v<?php echo OMNIOPS_WIDGET_VERSION; ?> -->
    <script>
        window.ChatWidgetConfig = {
            serverUrl: '<?php echo esc_js(OMNIOPS_WIDGET_URL); ?>',
            privacy: {
                allowOptOut: true,
                showPrivacyNotice: true,
                requireConsent: false,
                retentionDays: 30
            },
            appearance: {
                position: 'bottom-right',
                width: 400,
                height: 600
            },
            woocommerceEnabled: <?php echo $woocommerce_enabled; ?>,
            storeDomain: '<?php echo esc_js($current_domain); ?>',
            userData: <?php echo $user_data; ?>,
            pageContext: <?php echo $page_context; ?>,
            cartData: <?php echo $cart_data; ?>,
            debug: false // Set to true for testing
        };
    </script>
    <script src="<?php echo esc_url(OMNIOPS_WIDGET_URL); ?>/embed.js" async></script>
    <!-- End Omniops Chat Widget -->
    <?php
}
add_action('wp_footer', 'omniops_add_chat_widget', 100);

/**
 * Add admin notice after activation
 */
function omniops_activation_notice() {
    if (get_transient('omniops_widget_activated')) {
        ?>
        <div class="notice notice-success is-dismissible">
            <p><strong>Omniops Chat Widget activated!</strong> The widget will now appear on your site's frontend.</p>
            <p>Visit any page on your site to see it in action. <a href="<?php echo admin_url('options-general.php?page=omniops-widget'); ?>">Go to Settings</a></p>
        </div>
        <?php
        delete_transient('omniops_widget_activated');
    }
}
add_action('admin_notices', 'omniops_activation_notice');

/**
 * Set activation flag
 */
function omniops_plugin_activate() {
    set_transient('omniops_widget_activated', true, 30);
}
register_activation_hook(__FILE__, 'omniops_plugin_activate');

/**
 * Add settings link on plugins page
 */
function omniops_plugin_action_links($links) {
    $settings_link = '<a href="' . admin_url('options-general.php?page=omniops-widget') . '">Settings</a>';
    $test_link = '<a href="' . home_url() . '" target="_blank">Test Widget</a>';
    array_unshift($links, $settings_link, $test_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'omniops_plugin_action_links');

/**
 * Add admin settings page
 */
function omniops_add_settings_page() {
    add_options_page(
        'Omniops Chat Widget Settings',
        'Chat Widget',
        'manage_options',
        'omniops-widget',
        'omniops_render_settings_page'
    );
}
add_action('admin_menu', 'omniops_add_settings_page');

/**
 * Render settings page
 */
function omniops_render_settings_page() {
    // Check if WooCommerce is active
    $woocommerce_active = class_exists('WooCommerce');
    $woocommerce_status = $woocommerce_active ?
        '<span style="color: green;">✓ Detected &amp; Integrated</span>' :
        '<span style="color: gray;">Not installed</span>';

    // Test widget URL
    $test_url = OMNIOPS_WIDGET_URL . '/embed.js';
    $url_status = '<span style="color: orange;">⚠ Not tested</span>';

    // Try to check if URL is accessible
    $response = wp_remote_get($test_url, ['timeout' => 5]);
    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $url_status = '<span style="color: green;">✓ Accessible</span>';
    } elseif (strpos(OMNIOPS_WIDGET_URL, 'localhost') !== false) {
        $url_status = '<span style="color: blue;">ℹ Local development</span>';
    } else {
        $url_status = '<span style="color: red;">✗ Not accessible</span>';
    }

    ?>
    <div class="wrap">
        <h1>🤖 Omniops Chat Widget</h1>
        <p class="description">AI-powered customer service for your WordPress site</p>

        <div class="card" style="max-width: 800px;">
            <h2>📊 Widget Status</h2>
            <table class="widefat" style="margin-top: 10px;">
                <tbody>
                    <tr>
                        <td><strong>Status</strong></td>
                        <td><span style="color: green;">✓ Active</span></td>
                    </tr>
                    <tr>
                        <td><strong>Version</strong></td>
                        <td><?php echo OMNIOPS_WIDGET_VERSION; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Server URL</strong></td>
                        <td>
                            <code><?php echo esc_html(OMNIOPS_WIDGET_URL); ?></code>
                            <br><?php echo $url_status; ?>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>WooCommerce</strong></td>
                        <td><?php echo $woocommerce_status; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Current Domain</strong></td>
                        <td><code><?php echo esc_html($_SERVER['HTTP_HOST']); ?></code></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>🧪 How to Test</h2>
            <ol>
                <li><strong>Visit your website:</strong> <a href="<?php echo home_url(); ?>" target="_blank"><?php echo home_url(); ?></a></li>
                <li><strong>Look for the chat widget</strong> in the bottom-right corner</li>
                <li><strong>Click to open</strong> and try asking a question like "What products do you sell?"</li>
                <li><strong>Check for errors:</strong> Press F12 to open browser console</li>
                <li><strong>Test features:</strong>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>Send a message and wait for AI response</li>
                        <li>Test WooCommerce integration (if installed): "Check order #123"</li>
                        <li>Test privacy controls: Look for opt-out option</li>
                    </ul>
                </li>
            </ol>

            <p style="background: #f0f6fc; padding: 15px; border-left: 4px solid #0066cc; margin-top: 15px;">
                <strong>💡 Tip:</strong> If the widget doesn't appear, check that you're NOT in the WordPress admin area.
                The widget only shows on the public-facing pages.
            </p>
        </div>

        <?php if (strpos(OMNIOPS_WIDGET_URL, 'localhost') !== false): ?>
        <div class="card" style="max-width: 800px; margin-top: 20px; background: #fff3cd; border-left: 4px solid #ffc107;">
            <h2>⚠️ Development Mode Detected</h2>
            <p><strong>Current URL:</strong> <code><?php echo esc_html(OMNIOPS_WIDGET_URL); ?></code></p>
            <p>You're using a localhost URL. This is fine for testing, but you'll need to change it to your production domain before deploying to live sites.</p>
            <p><strong>To change:</strong> Edit the <code>OMNIOPS_WIDGET_URL</code> constant in <code>omniops-chat-widget.php</code></p>
        </div>
        <?php endif; ?>

        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>🔧 Configuration</h2>
            <p>The widget is configured through the plugin file. To customize:</p>
            <ol>
                <li>Go to: <strong>Plugins → Plugin File Editor</strong></li>
                <li>Select: <strong>Omniops Chat Widget</strong></li>
                <li>Edit the <code>OMNIOPS_WIDGET_URL</code> constant at the top of the file</li>
                <li>Save changes</li>
            </ol>

            <h3 style="margin-top: 20px;">Available Options</h3>
            <ul style="list-style: disc; margin-left: 20px;">
                <li><code>serverUrl</code> - Your Omniops backend URL</li>
                <li><code>privacy.allowOptOut</code> - Allow users to opt out of tracking</li>
                <li><code>privacy.showPrivacyNotice</code> - Show privacy information</li>
                <li><code>privacy.retentionDays</code> - Data retention period (default: 30 days)</li>
                <li><code>appearance.position</code> - Widget position (bottom-right, bottom-left, etc.)</li>
                <li><code>appearance.width</code> - Widget width in pixels</li>
                <li><code>appearance.height</code> - Widget height in pixels</li>
                <li><code>debug</code> - Enable debug logging (set to true for testing)</li>
            </ul>
        </div>

        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2>📚 Documentation</h2>
            <ul>
                <li><a href="https://www.omniops.co.uk/docs" target="_blank">Full Documentation</a></li>
                <li><a href="https://www.omniops.co.uk/docs/wordpress" target="_blank">WordPress Integration Guide</a></li>
                <li><a href="https://www.omniops.co.uk/support" target="_blank">Support</a></li>
            </ul>
        </div>

        <div class="card" style="max-width: 800px; margin-top: 20px; background: #d1ecf1; border-left: 4px solid #0c5460;">
            <h2>🐛 Troubleshooting</h2>

            <h3>Widget not appearing?</h3>
            <ol>
                <li>Make sure you're viewing the <strong>public site</strong>, not the admin area</li>
                <li>Press F12 and check browser console for errors</li>
                <li>View page source (Ctrl+U) and search for "embed.js"</li>
                <li>Verify the Server URL is correct and accessible</li>
            </ol>

            <h3>Widget appears but doesn't respond?</h3>
            <ol>
                <li>Check that the backend server is running</li>
                <li>Verify the API endpoint: <code><?php echo OMNIOPS_WIDGET_URL; ?>/api/chat</code></li>
                <li>Check browser console for CORS errors</li>
                <li>Ensure OpenAI API key is configured on backend</li>
            </ol>

            <h3>WooCommerce features not working?</h3>
            <ol>
                <li>Verify WooCommerce is installed and active</li>
                <li>Check that WooCommerce API credentials are configured in backend</li>
                <li>Test with a real order number</li>
            </ol>
        </div>
    </div>

    <style>
        .wrap .card {
            background: #fff;
            border: 1px solid #ccd0d4;
            padding: 20px;
            border-radius: 4px;
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
        }
        .wrap .card h2 {
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .wrap .card h3 {
            margin-top: 15px;
            margin-bottom: 10px;
        }
        .wrap .card table {
            margin-top: 15px;
        }
        .wrap .card table td {
            padding: 10px;
        }
        .wrap .card table tr:nth-child(even) {
            background: #f9f9f9;
        }
    </style>
    <?php
}
