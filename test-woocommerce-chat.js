// Test script for WooCommerce chat integration
// This simulates what the WordPress plugin would send

async function testWooCommerceChat() {
  const serverUrl = 'http://localhost:3000';
  
  // Test data simulating a WordPress/WooCommerce store
  const testRequest = {
    message: "What products do you have in stock?",
    session_id: "test_session_" + Date.now(),
    domain: "example-store.com",
    woocommerceEnabled: true,
    storeDomain: "example-store.com",
    userData: {
      isLoggedIn: true,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      totalOrders: 5,
      totalSpent: "$500.00",
      customerGroup: "regular"
    },
    pageContext: {
      pageType: "shop",
      pageUrl: "https://example-store.com/shop",
      pageTitle: "Shop"
    },
    cartData: {
      hasItems: true,
      itemCount: 2,
      cartTotal: "$99.99",
      cartCurrency: "USD",
      cartItems: [
        {
          id: 1,
          name: "Test Product",
          quantity: 1,
          price: "$49.99"
        },
        {
          id: 2,
          name: "Another Product",
          quantity: 1,
          price: "$50.00"
        }
      ]
    }
  };

  console.log('🚀 Testing WooCommerce Chat Integration');
  console.log('📦 Request:', JSON.stringify(testRequest, null, 2));
  
  try {
    const response = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data);
      return;
    }

    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    // Test a follow-up question that should trigger WooCommerce function
    const followUpRequest = {
      ...testRequest,
      message: "Can you check if product SKU-123 is in stock?",
      conversation_id: data.conversation_id
    };
    
    console.log('\n📦 Follow-up Request:', followUpRequest.message);
    
    const followUpResponse = await fetch(`${serverUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(followUpRequest)
    });

    const followUpData = await followUpResponse.json();
    console.log('✅ Follow-up Response:', JSON.stringify(followUpData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testWooCommerceChat();