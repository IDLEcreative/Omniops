<?php
/**
 * Plugin Name: AI Customer Service Chat for WooCommerce
 * Plugin URI: https://your-domain.com
 * Description: Intelligent customer service chat widget with full WooCommerce integration and user authentication
 * Version: 1.0.0
 * Author: Omniops
 * License: GPL v2 or later
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * WC requires at least: 3.5
 * WC tested up to: 8.5
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Check if WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    return;
}

/**
 * Main plugin class
 */
class CustomerServiceChat {
    
    private $options;
    
    public function __construct() {
        $this->options = get_option('csc_settings', $this->get_default_options());
        
        // Hook into WordPress
        add_action('wp_footer', array($this, 'embed_chat_widget'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Add AJAX endpoint for secure data transfer
        add_action('wp_ajax_csc_get_user_context', array($this, 'ajax_get_user_context'));
        add_action('wp_ajax_nopriv_csc_get_user_context', array($this, 'ajax_get_user_context'));
        
        // WooCommerce specific hooks
        add_action('woocommerce_after_order_notes', array($this, 'add_chat_to_checkout'));
        add_action('woocommerce_account_dashboard', array($this, 'add_chat_to_account'));
    }
    
    /**
     * Generate a proper UUID v4 for session identification
     */
    private function generate_session_id() {
        // Use WordPress built-in UUID generator if available (WP 4.0+)
        if (function_exists('wp_generate_uuid4')) {
            return wp_generate_uuid4();
        }
        
        // Fallback UUID v4 generation
        $data = openssl_random_pseudo_bytes(16);
        
        // Set version (4) and variant bits
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // Version 4
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // Variant 10
        
        // Format as UUID
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
    
    /**
     * Default plugin options
     */
    private function get_default_options() {
        return array(
            'server_url' => 'http://localhost:3000',
            'position' => 'bottom-right',
            'auto_open_on_checkout' => false,
            'show_on_product_pages' => true,
            'pass_user_data' => true,
            'pass_cart_data' => true,
            'enable_order_lookup' => true,
            'custom_greeting' => '',
        );
    }
    
    /**
     * Embed the chat widget with user context
     */
    public function embed_chat_widget() {
        // Skip on admin pages
        if (is_admin()) {
            return;
        }
        
        // Get user and WooCommerce context
        $context = $this->get_user_context();
        
        // Generate a proper UUID for the session
        $session_id = $this->generate_session_id();
        
        // Determine if we should auto-open the chat
        $auto_open = false;
        if ($this->options['auto_open_on_checkout'] && is_checkout()) {
            $auto_open = true;
        }
        
        ?>
        <script>
            // Generate or retrieve session ID
            function getChatSessionId() {
                // Check if we already have a session ID in sessionStorage
                let sessionId = sessionStorage.getItem('chat_session_id');
                
                if (!sessionId) {
                    // Generate a new UUID
                    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                        sessionId = crypto.randomUUID();
                    } else {
                        // Fallback UUID v4 generation for older browsers
                        sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = Math.random() * 16 | 0,
                                v = c == 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    }
                    sessionStorage.setItem('chat_session_id', sessionId);
                }
                
                return sessionId;
            }
            
            // User context for the chat widget
            window.ChatWidgetConfig = {
                serverUrl: '<?php echo esc_js($this->options['server_url']); ?>',
                sessionId: getChatSessionId(), // Use UUID session ID
                appearance: {
                    position: '<?php echo esc_js($this->options['position']); ?>',
                    width: 400,
                    height: 600
                },
                behavior: {
                    autoOpen: <?php echo $auto_open ? 'true' : 'false'; ?>,
                    greeting: '<?php echo esc_js($this->get_personalized_greeting($context)); ?>'
                },
                // WooCommerce Integration
                woocommerceEnabled: <?php echo class_exists('WooCommerce') ? 'true' : 'false'; ?>,
                storeDomain: '<?php echo esc_js(parse_url(home_url(), PHP_URL_HOST)); ?>',
                // Pass user and WooCommerce context
                userData: {
                    isLoggedIn: <?php echo $context['is_logged_in'] ? 'true' : 'false'; ?>,
                    userId: '<?php echo esc_js($context['user_id']); ?>',
                    email: '<?php echo esc_js($context['email']); ?>',
                    firstName: '<?php echo esc_js($context['first_name']); ?>',
                    lastName: '<?php echo esc_js($context['last_name']); ?>',
                    displayName: '<?php echo esc_js($context['display_name']); ?>',
                    customerSince: '<?php echo esc_js($context['customer_since']); ?>',
                    totalOrders: <?php echo intval($context['total_orders']); ?>,
                    totalSpent: '<?php echo esc_js($context['total_spent']); ?>',
                    lastOrderId: '<?php echo esc_js($context['last_order_id']); ?>',
                    lastOrderDate: '<?php echo esc_js($context['last_order_date']); ?>',
                    customerGroup: '<?php echo esc_js($context['customer_group']); ?>',
                    preferredLanguage: '<?php echo esc_js($context['language']); ?>'
                },
                // Current page context
                pageContext: {
                    pageType: '<?php echo esc_js($this->get_page_type()); ?>',
                    pageUrl: '<?php echo esc_js($context['current_url']); ?>',
                    pageTitle: '<?php echo esc_js(get_the_title()); ?>',
                    productId: '<?php echo esc_js($context['current_product_id']); ?>',
                    productName: '<?php echo esc_js($context['current_product_name']); ?>',
                    productPrice: '<?php echo esc_js($context['current_product_price']); ?>',
                    categoryId: '<?php echo esc_js($context['current_category_id']); ?>',
                    categoryName: '<?php echo esc_js($context['current_category_name']); ?>'
                },
                // Shopping cart context
                cartData: {
                    hasItems: <?php echo $context['cart_has_items'] ? 'true' : 'false'; ?>,
                    itemCount: <?php echo intval($context['cart_item_count']); ?>,
                    cartTotal: '<?php echo esc_js($context['cart_total']); ?>',
                    cartCurrency: '<?php echo esc_js($context['currency']); ?>',
                    abandonedCart: <?php echo $context['has_abandoned_cart'] ? 'true' : 'false'; ?>,
                    cartItems: <?php echo json_encode($context['cart_items']); ?>,
                    appliedCoupons: <?php echo json_encode($context['applied_coupons']); ?>
                },
                // Order context (if viewing an order)
                orderContext: {
                    orderId: '<?php echo esc_js($context['viewing_order_id']); ?>',
                    orderStatus: '<?php echo esc_js($context['viewing_order_status']); ?>',
                    orderTotal: '<?php echo esc_js($context['viewing_order_total']); ?>',
                    trackingNumber: '<?php echo esc_js($context['tracking_number']); ?>'
                },
                // Security
                nonce: '<?php echo wp_create_nonce('csc_chat_widget'); ?>',
                ajaxUrl: '<?php echo admin_url('admin-ajax.php'); ?>'
            };
            
            // Function to update context dynamically
            window.updateChatContext = function() {
                // Make AJAX call to get fresh context
                fetch(window.ChatWidgetConfig.ajaxUrl + '?action=csc_get_user_context&nonce=' + window.ChatWidgetConfig.nonce)
                    .then(response => response.json())
                    .then(data => {
                        // Add session ID to the context
                        data.sessionId = window.ChatWidgetConfig.sessionId;
                        if (window.ChatWidget && window.ChatWidget.updateContext) {
                            window.ChatWidget.updateContext(data);
                        }
                    });
            };
            
            // Function to send message with proper session ID
            window.sendChatMessage = function(message) {
                if (window.ChatWidget && window.ChatWidget.sendMessage) {
                    window.ChatWidget.sendMessage(message, {
                        session_id: window.ChatWidgetConfig.sessionId,
                        conversation_id: window.ChatWidgetConfig.sessionId
                    });
                }
            };
            
            // Update context when cart changes (WooCommerce events)
            jQuery(document).on('added_to_cart removed_from_cart updated_cart_totals', function() {
                window.updateChatContext();
            });
        </script>
        <script src="<?php echo esc_url($this->options['server_url'] . '/embed.js'); ?>"></script>
        <?php
    }
    
    /**
     * Get comprehensive user context
     */
    private function get_user_context() {
        $context = array(
            'is_logged_in' => is_user_logged_in(),
            'user_id' => '',
            'email' => '',
            'first_name' => '',
            'last_name' => '',
            'display_name' => '',
            'customer_since' => '',
            'total_orders' => 0,
            'total_spent' => '',
            'last_order_id' => '',
            'last_order_date' => '',
            'customer_group' => 'guest',
            'language' => get_locale(),
            'current_url' => home_url($_SERVER['REQUEST_URI']),
            'current_product_id' => '',
            'current_product_name' => '',
            'current_product_price' => '',
            'current_category_id' => '',
            'current_category_name' => '',
            'cart_has_items' => false,
            'cart_item_count' => 0,
            'cart_total' => '',
            'currency' => get_woocommerce_currency(),
            'has_abandoned_cart' => false,
            'cart_items' => array(),
            'applied_coupons' => array(),
            'viewing_order_id' => '',
            'viewing_order_status' => '',
            'viewing_order_total' => '',
            'tracking_number' => ''
        );
        
        // Get logged-in user data
        if (is_user_logged_in()) {
            $user = wp_get_current_user();
            $customer = new WC_Customer($user->ID);
            
            $context['user_id'] = $user->ID;
            $context['email'] = $user->user_email;
            $context['first_name'] = $customer->get_first_name();
            $context['last_name'] = $customer->get_last_name();
            $context['display_name'] = $user->display_name;
            $context['customer_since'] = $user->user_registered;
            
            // Get customer statistics
            $context['total_orders'] = $customer->get_order_count();
            $context['total_spent'] = $customer->get_total_spent();
            
            // Get last order
            $last_order = wc_get_customer_last_order($user->ID);
            if ($last_order) {
                $context['last_order_id'] = $last_order->get_id();
                $context['last_order_date'] = $last_order->get_date_created()->format('Y-m-d');
            }
            
            // Determine customer group
            if ($context['total_spent'] > 1000) {
                $context['customer_group'] = 'vip';
            } elseif ($context['total_orders'] > 5) {
                $context['customer_group'] = 'regular';
            } else {
                $context['customer_group'] = 'new';
            }
        }
        
        // Get current product context
        if (is_product()) {
            global $product;
            if ($product) {
                $context['current_product_id'] = $product->get_id();
                $context['current_product_name'] = $product->get_name();
                $context['current_product_price'] = $product->get_price();
            }
        }
        
        // Get current category context
        if (is_product_category()) {
            $category = get_queried_object();
            if ($category) {
                $context['current_category_id'] = $category->term_id;
                $context['current_category_name'] = $category->name;
            }
        }
        
        // Get cart data
        if (WC()->cart) {
            $cart = WC()->cart;
            $context['cart_has_items'] = !$cart->is_empty();
            $context['cart_item_count'] = $cart->get_cart_contents_count();
            $context['cart_total'] = $cart->get_total();
            $context['applied_coupons'] = $cart->get_applied_coupons();
            
            // Get cart items (simplified)
            foreach ($cart->get_cart() as $cart_item) {
                $product = $cart_item['data'];
                $context['cart_items'][] = array(
                    'id' => $product->get_id(),
                    'name' => $product->get_name(),
                    'quantity' => $cart_item['quantity'],
                    'price' => $product->get_price()
                );
            }
        }
        
        // Get order context if viewing an order
        if (is_wc_endpoint_url('order-received') || is_wc_endpoint_url('view-order')) {
            global $wp;
            $order_id = isset($wp->query_vars['order-received']) ? 
                        $wp->query_vars['order-received'] : 
                        (isset($wp->query_vars['view-order']) ? $wp->query_vars['view-order'] : '');
            
            if ($order_id) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $context['viewing_order_id'] = $order_id;
                    $context['viewing_order_status'] = $order->get_status();
                    $context['viewing_order_total'] = $order->get_total();
                    $context['tracking_number'] = $order->get_meta('_tracking_number');
                }
            }
        }
        
        return $context;
    }
    
    /**
     * Get personalized greeting based on context
     */
    private function get_personalized_greeting($context) {
        if (!empty($this->options['custom_greeting'])) {
            return $this->options['custom_greeting'];
        }
        
        if ($context['is_logged_in']) {
            $name = $context['first_name'] ?: $context['display_name'];
            
            if ($context['customer_group'] === 'vip') {
                return "Welcome back, " . $name . "! As a VIP customer, how can we assist you today?";
            } elseif ($context['total_orders'] > 0) {
                return "Hi " . $name . "! Great to see you again. How can I help?";
            } else {
                return "Hello " . $name . "! Welcome to our store. How can I assist you?";
            }
        }
        
        // Context-specific greetings
        if (is_checkout() && $context['cart_has_items']) {
            return "Need help completing your order? I'm here to assist!";
        }
        
        if (is_product()) {
            return "Questions about this product? I'm here to help!";
        }
        
        return "Hello! How can I help you today?";
    }
    
    /**
     * Determine the current page type
     */
    private function get_page_type() {
        if (is_shop()) return 'shop';
        if (is_product()) return 'product';
        if (is_product_category()) return 'category';
        if (is_cart()) return 'cart';
        if (is_checkout()) return 'checkout';
        if (is_account_page()) return 'account';
        if (is_wc_endpoint_url('order-received')) return 'order-confirmation';
        if (is_front_page()) return 'home';
        return 'other';
    }
    
    /**
     * AJAX endpoint to get fresh user context
     */
    public function ajax_get_user_context() {
        // Verify nonce
        if (!wp_verify_nonce($_GET['nonce'], 'csc_chat_widget')) {
            wp_die('Security check failed');
        }
        
        $context = $this->get_user_context();
        wp_send_json($context);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'Customer Service Chat',
            'Chat Widget',
            'manage_woocommerce',
            'csc-settings',
            array($this, 'settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('csc_settings_group', 'csc_settings');
    }
    
    /**
     * Settings page HTML
     */
    public function settings_page() {
        if (isset($_POST['submit'])) {
            $this->options = array(
                'server_url' => sanitize_url($_POST['server_url']),
                'position' => sanitize_text_field($_POST['position']),
                'auto_open_on_checkout' => isset($_POST['auto_open_on_checkout']),
                'show_on_product_pages' => isset($_POST['show_on_product_pages']),
                'pass_user_data' => isset($_POST['pass_user_data']),
                'pass_cart_data' => isset($_POST['pass_cart_data']),
                'enable_order_lookup' => isset($_POST['enable_order_lookup']),
                'custom_greeting' => sanitize_text_field($_POST['custom_greeting']),
            );
            update_option('csc_settings', $this->options);
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        ?>
        <div class="wrap">
            <h1>Customer Service Chat Settings</h1>
            <form method="post" action="">
                <table class="form-table">
                    <tr>
                        <th scope="row">Chat Server URL</th>
                        <td>
                            <input type="url" name="server_url" value="<?php echo esc_attr($this->options['server_url']); ?>" class="regular-text" />
                            <p class="description">The URL where your chat server is hosted</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Widget Position</th>
                        <td>
                            <select name="position">
                                <option value="bottom-right" <?php selected($this->options['position'], 'bottom-right'); ?>>Bottom Right</option>
                                <option value="bottom-left" <?php selected($this->options['position'], 'bottom-left'); ?>>Bottom Left</option>
                                <option value="top-right" <?php selected($this->options['position'], 'top-right'); ?>>Top Right</option>
                                <option value="top-left" <?php selected($this->options['position'], 'top-left'); ?>>Top Left</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Behavior</th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_open_on_checkout" <?php checked($this->options['auto_open_on_checkout']); ?> />
                                Auto-open on checkout page
                            </label><br>
                            <label>
                                <input type="checkbox" name="show_on_product_pages" <?php checked($this->options['show_on_product_pages']); ?> />
                                Show on product pages
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Data Sharing</th>
                        <td>
                            <label>
                                <input type="checkbox" name="pass_user_data" <?php checked($this->options['pass_user_data']); ?> />
                                Pass user information to chat
                            </label><br>
                            <label>
                                <input type="checkbox" name="pass_cart_data" <?php checked($this->options['pass_cart_data']); ?> />
                                Pass cart data to chat
                            </label><br>
                            <label>
                                <input type="checkbox" name="enable_order_lookup" <?php checked($this->options['enable_order_lookup']); ?> />
                                Enable order lookup in chat
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Custom Greeting</th>
                        <td>
                            <input type="text" name="custom_greeting" value="<?php echo esc_attr($this->options['custom_greeting']); ?>" class="large-text" />
                            <p class="description">Leave blank for automatic personalized greetings</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <h2>Current User Context (Debug)</h2>
            <pre><?php print_r($this->get_user_context()); ?></pre>
        </div>
        <?php
    }
    
    /**
     * Add chat to checkout page
     */
    public function add_chat_to_checkout() {
        echo '<div id="checkout-chat-helper" style="margin: 20px 0;">
                <p>Need help? Click the chat icon in the corner!</p>
              </div>';
    }
    
    /**
     * Add chat to account dashboard
     */
    public function add_chat_to_account() {
        echo '<div class="woocommerce-message">
                Need assistance? Use our chat support for quick help with your orders!
              </div>';
    }
}

// Initialize the plugin
new CustomerServiceChat();