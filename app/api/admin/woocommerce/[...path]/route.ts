import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';
import { createClient } from '@/lib/supabase-server';

// Dynamic route handler for all WooCommerce API endpoints
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const pathParts = path.split('/');
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    
    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route to appropriate handler based on path
    let result;
    
    switch (path) {
      // Products
      case 'products':
        result = await wc.getProducts(searchParams);
        break;
      case path.match(/^products\/\d+$/)?.input:
        result = await wc.getProduct(parseInt(pathParts[1] || '0'));
        break;
      case path.match(/^products\/\d+\/variations$/)?.input:
        result = await wc.getProductVariations(parseInt(pathParts[1] || '0'), searchParams);
        break;
      case path.match(/^products\/\d+\/variations\/\d+$/)?.input:
        result = await wc.getProductVariation(parseInt(pathParts[1] || '0'), parseInt(pathParts[3] || '0'));
        break;
      case 'products/attributes':
        result = await wc.getProductAttributes(searchParams);
        break;
      case path.match(/^products\/attributes\/\d+$/)?.input:
        result = await wc.getProductAttribute(parseInt(pathParts[2] || '0'));
        break;
      case path.match(/^products\/attributes\/\d+\/terms$/)?.input:
        result = await wc.getProductAttributeTerms(parseInt(pathParts[2] || '0'), searchParams);
        break;
      case 'products/categories':
        result = await wc.getProductCategories(searchParams);
        break;
      case path.match(/^products\/categories\/\d+$/)?.input:
        result = await wc.getProductCategory(parseInt(pathParts[2] || '0'));
        break;
      case 'products/tags':
        result = await wc.getProductTags(searchParams);
        break;
      case path.match(/^products\/tags\/\d+$/)?.input:
        result = await wc.getProductTag(parseInt(pathParts[2] || '0'));
        break;
      case 'products/reviews':
        result = await wc.getProductReviews(searchParams);
        break;
      case 'products/shipping_classes':
        result = await wc.getProductShippingClasses(searchParams);
        break;

      // Orders
      case 'orders':
        result = await wc.getOrders(searchParams);
        break;
      case path.match(/^orders\/\d+$/)?.input:
        result = await wc.getOrder(parseInt(pathParts[1] || '0'));
        break;
      case path.match(/^orders\/\d+\/notes$/)?.input:
        result = await wc.getOrderNotes(parseInt(pathParts[1] || '0'), searchParams);
        break;
      case path.match(/^orders\/\d+\/refunds$/)?.input:
        result = await wc.getOrderRefunds(parseInt(pathParts[1] || '0'), searchParams);
        break;
      case 'refunds':
        result = await wc.getRefunds(searchParams);
        break;

      // Customers
      case 'customers':
        result = await wc.getCustomers(searchParams);
        break;
      case path.match(/^customers\/\d+$/)?.input:
        result = await wc.getCustomer(parseInt(pathParts[1] || '0'));
        break;
      case path.match(/^customers\/\d+\/downloads$/)?.input:
        result = await wc.getCustomerDownloads(parseInt(pathParts[1] || '0'));
        break;
      case 'customers/email':
        if (searchParams.email) {
          result = await wc.getCustomerByEmail(searchParams.email);
        }
        break;

      // Coupons
      case 'coupons':
        result = await wc.getCoupons(searchParams);
        break;
      case path.match(/^coupons\/\d+$/)?.input:
        result = await wc.getCoupon(parseInt(pathParts[1] || '0'));
        break;
      case 'coupons/code':
        if (searchParams.code) {
          result = await wc.getCouponByCode(searchParams.code);
        }
        break;

      // Reports
      case 'reports/sales':
        result = await wc.getSalesReport(searchParams);
        break;
      case 'reports/top_sellers':
        result = await wc.getTopSellersReport(searchParams);
        break;
      case 'reports/coupons':
        result = await wc.getCouponsReport(searchParams);
        break;
      case 'reports/customers':
        result = await wc.getCustomersReport(searchParams);
        break;
      case 'reports/orders':
        result = await wc.getOrdersReport(searchParams);
        break;
      case 'reports/products':
        result = await wc.getProductsReport(searchParams);
        break;
      case 'reports/reviews':
        result = await wc.getReviewsReport(searchParams);
        break;

      // Taxes
      case 'taxes':
        result = await wc.getTaxRates(searchParams);
        break;
      case path.match(/^taxes\/\d+$/)?.input:
        result = await wc.getTaxRate(parseInt(pathParts[1] || '0'));
        break;
      case 'taxes/classes':
        result = await wc.getTaxClasses();
        break;

      // Shipping
      case 'shipping/zones':
        result = await wc.getShippingZones();
        break;
      case path.match(/^shipping\/zones\/\d+$/)?.input:
        result = await wc.getShippingZone(parseInt(pathParts[2] || '0'));
        break;
      case path.match(/^shipping\/zones\/\d+\/locations$/)?.input:
        result = await wc.getShippingZoneLocations(parseInt(pathParts[2] || '0'));
        break;
      case path.match(/^shipping\/zones\/\d+\/methods$/)?.input:
        result = await wc.getShippingZoneMethods(parseInt(pathParts[2] || '0'));
        break;
      case 'shipping_methods':
        result = await wc.getShippingMethods();
        break;

      // Payment Gateways
      case 'payment_gateways':
        result = await wc.getPaymentGateways();
        break;
      case path.match(/^payment_gateways\/[\w-]+$/)?.input:
        result = await wc.getPaymentGateway(pathParts[1] || '');
        break;

      // Settings
      case 'settings':
        result = await wc.getSettingsGroups();
        break;
      case path.match(/^settings\/[\w-]+$/)?.input:
        result = await wc.getSettingsOptions(pathParts[1] || '');
        break;
      case path.match(/^settings\/[\w-]+\/[\w-]+$/)?.input:
        const groupId = pathParts[1] || '';
        const optionId = pathParts[2] || '';
        result = await wc.getSettingOption(groupId, optionId);
        break;

      // System Status
      case 'system_status':
        result = await wc.getSystemStatus();
        break;
      case 'system_status/tools':
        result = await wc.getSystemStatusTools();
        break;
      case path.match(/^system_status\/tools\/[\w-]+$/)?.input:
        result = await wc.getSystemStatusTool(pathParts[2] || '');
        break;

      // Webhooks
      case 'webhooks':
        result = await wc.getWebhooks(searchParams);
        break;
      case path.match(/^webhooks\/\d+$/)?.input:
        result = await wc.getWebhook(parseInt(pathParts[1] || '0'));
        break;

      // Data
      case 'data/countries':
        result = await wc.getCountries();
        break;
      case 'data/currencies':
        result = await wc.getCurrencies();
        break;
      case 'data/currencies/current':
        result = await wc.getCurrentCurrency();
        break;
      case 'data/continents':
        result = await wc.getContinents();
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const pathParts = path.split('/');
    const body = await request.json();
    
    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route to appropriate handler based on path
    let result;
    
    switch (path) {
      // Products
      case 'products':
        result = await wc.createProduct(body);
        break;
      case 'products/batch':
        result = await wc.batchProducts(body);
        break;
      case path.match(/^products\/\d+\/variations$/)?.input:
        result = await wc.createProductVariation(parseInt(pathParts[1] || '0'), body);
        break;
      case path.match(/^products\/\d+\/variations\/batch$/)?.input:
        result = await wc.batchProductVariations(parseInt(pathParts[1] || '0'), body);
        break;
      case 'products/attributes':
        result = await wc.createProductAttribute(body);
        break;
      case path.match(/^products\/attributes\/\d+\/terms$/)?.input:
        result = await wc.createProductAttributeTerm(parseInt(pathParts[2] || '0'), body);
        break;
      case 'products/categories':
        result = await wc.createProductCategory(body);
        break;
      case 'products/tags':
        result = await wc.createProductTag(body);
        break;
      case 'products/reviews':
        result = await wc.createProductReview(body);
        break;
      case 'products/shipping_classes':
        result = await wc.createProductShippingClass(body);
        break;

      // Orders
      case 'orders':
        result = await wc.createOrder(body);
        break;
      case 'orders/batch':
        result = await wc.batchOrders(body);
        break;
      case path.match(/^orders\/\d+\/notes$/)?.input:
        result = await wc.createOrderNote(parseInt(pathParts[1] || '0'), body);
        break;
      case path.match(/^orders\/\d+\/refunds$/)?.input:
        result = await wc.createOrderRefund(parseInt(pathParts[1] || '0'), body);
        break;

      // Customers
      case 'customers':
        result = await wc.createCustomer(body);
        break;
      case 'customers/batch':
        result = await wc.batchCustomers(body);
        break;

      // Coupons
      case 'coupons':
        result = await wc.createCoupon(body);
        break;
      case 'coupons/batch':
        result = await wc.batchCoupons(body);
        break;

      // Taxes
      case 'taxes':
        result = await wc.createTaxRate(body);
        break;
      case 'taxes/classes':
        result = await wc.createTaxClass(body);
        break;

      // Shipping
      case 'shipping/zones':
        result = await wc.createShippingZone(body);
        break;
      case path.match(/^shipping\/zones\/\d+\/methods$/)?.input:
        result = await wc.createShippingZoneMethod(parseInt(pathParts[2] || '0'), body);
        break;

      // Settings
      case path.match(/^settings\/[\w-]+\/batch$/)?.input:
        result = await wc.batchUpdateSettings(pathParts[1] || '', body.update);
        break;

      // Webhooks
      case 'webhooks':
        result = await wc.createWebhook(body);
        break;
      case 'webhooks/batch':
        result = await wc.batchWebhooks(body);
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const pathParts = path.split('/');
    const body = await request.json();
    
    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route to appropriate handler based on path
    let result;
    
    switch (path) {
      // Products
      case path.match(/^products\/\d+$/)?.input:
        result = await wc.updateProduct(parseInt(pathParts[1] || '0'), body);
        break;
      case path.match(/^products\/\d+\/variations\/\d+$/)?.input:
        const productId = pathParts[1] || '0';
        const variationId = pathParts[3] || '0';
        result = await wc.updateProductVariation(parseInt(productId), parseInt(variationId), body);
        break;
      case path.match(/^products\/attributes\/\d+$/)?.input:
        result = await wc.updateProductAttribute(parseInt(pathParts[2] || '0'), body);
        break;
      case path.match(/^products\/attributes\/\d+\/terms\/\d+$/)?.input:
        const attributeId = pathParts[2] || '0';
        const termId = pathParts[4] || '0';
        result = await wc.updateProductAttributeTerm(parseInt(attributeId), parseInt(termId), body);
        break;
      case path.match(/^products\/categories\/\d+$/)?.input:
        result = await wc.updateProductCategory(parseInt(pathParts[2] || '0'), body);
        break;
      case path.match(/^products\/tags\/\d+$/)?.input:
        result = await wc.updateProductTag(parseInt(pathParts[2] || '0'), body);
        break;
      case path.match(/^products\/reviews\/\d+$/)?.input:
        result = await wc.updateProductReview(parseInt(pathParts[2] || '0'), body);
        break;
      case path.match(/^products\/shipping_classes\/\d+$/)?.input:
        result = await wc.updateProductShippingClass(parseInt(pathParts[2] || '0'), body);
        break;

      // Orders
      case path.match(/^orders\/\d+$/)?.input:
        result = await wc.updateOrder(parseInt(pathParts[1] || '0'), body);
        break;

      // Customers
      case path.match(/^customers\/\d+$/)?.input:
        result = await wc.updateCustomer(parseInt(pathParts[1] || '0'), body);
        break;

      // Coupons
      case path.match(/^coupons\/\d+$/)?.input:
        result = await wc.updateCoupon(parseInt(pathParts[1] || '0'), body);
        break;

      // Taxes
      case path.match(/^taxes\/\d+$/)?.input:
        result = await wc.updateTaxRate(parseInt(pathParts[1] || '0'), body);
        break;

      // Shipping
      case path.match(/^shipping\/zones\/\d+$/)?.input:
        result = await wc.updateShippingZone(parseInt(pathParts[2] || '0'), body);
        break;
      case path.match(/^shipping\/zones\/\d+\/locations$/)?.input:
        result = await wc.updateShippingZoneLocations(parseInt(pathParts[2] || '0'), body);
        break;
      case path.match(/^shipping\/zones\/\d+\/methods\/\d+$/)?.input:
        const zoneId = pathParts[2] || '0';
        const methodId = pathParts[4] || '0';
        result = await wc.updateShippingZoneMethod(parseInt(zoneId), parseInt(methodId), body);
        break;

      // Payment Gateways
      case path.match(/^payment_gateways\/[\w-]+$/)?.input:
        result = await wc.updatePaymentGateway(pathParts[1] || '', body);
        break;

      // Settings
      case path.match(/^settings\/[\w-]+\/[\w-]+$/)?.input:
        const groupId = pathParts[1] || '';
        const optionId = pathParts[2] || '';
        result = await wc.updateSettingOption(groupId, optionId, body.value);
        break;

      // System Status Tools
      case path.match(/^system_status\/tools\/[\w-]+$/)?.input:
        result = await wc.runSystemStatusTool(pathParts[2] || '');
        break;

      // Webhooks
      case path.match(/^webhooks\/\d+$/)?.input:
        result = await wc.updateWebhook(parseInt(pathParts[1] || '0'), body);
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const pathParts = path.split('/');
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const force = searchParams.force === 'true';
    
    // Initialize WooCommerce API
    const wc = new WooCommerceAPI();

    // Route to appropriate handler based on path
    let result;
    
    switch (path) {
      // Products
      case path.match(/^products\/\d+$/)?.input:
        result = await wc.deleteProduct(parseInt(pathParts[1] || '0'), force);
        break;
      case path.match(/^products\/\d+\/variations\/\d+$/)?.input:
        const productId = pathParts[1] || '0';
        const variationId = pathParts[3] || '0';
        result = await wc.deleteProductVariation(parseInt(productId), parseInt(variationId), force);
        break;
      case path.match(/^products\/attributes\/\d+$/)?.input:
        result = await wc.deleteProductAttribute(parseInt(pathParts[2] || '0'), force);
        break;
      case path.match(/^products\/attributes\/\d+\/terms\/\d+$/)?.input:
        const attributeId = pathParts[2] || '0';
        const termId = pathParts[4] || '0';
        result = await wc.deleteProductAttributeTerm(parseInt(attributeId), parseInt(termId), force);
        break;
      case path.match(/^products\/categories\/\d+$/)?.input:
        result = await wc.deleteProductCategory(parseInt(pathParts[2] || '0'), force);
        break;
      case path.match(/^products\/tags\/\d+$/)?.input:
        result = await wc.deleteProductTag(parseInt(pathParts[2] || '0'), force);
        break;
      case path.match(/^products\/reviews\/\d+$/)?.input:
        result = await wc.deleteProductReview(parseInt(pathParts[2] || '0'), force);
        break;
      case path.match(/^products\/shipping_classes\/\d+$/)?.input:
        result = await wc.deleteProductShippingClass(parseInt(pathParts[2] || '0'), force);
        break;

      // Orders
      case path.match(/^orders\/\d+$/)?.input:
        result = await wc.deleteOrder(parseInt(pathParts[1] || '0'), force);
        break;
      case path.match(/^orders\/\d+\/notes\/\d+$/)?.input:
        const orderId = pathParts[1] || '0';
        const noteId = pathParts[3] || '0';
        result = await wc.deleteOrderNote(parseInt(orderId), parseInt(noteId), force);
        break;
      case path.match(/^orders\/\d+\/refunds\/\d+$/)?.input:
        const orderId2 = pathParts[1] || '0';
        const refundId = pathParts[3] || '0';
        result = await wc.deleteOrderRefund(parseInt(orderId2), parseInt(refundId), force);
        break;

      // Customers
      case path.match(/^customers\/\d+$/)?.input:
        result = await wc.deleteCustomer(parseInt(pathParts[1] || '0'), force);
        break;

      // Coupons
      case path.match(/^coupons\/\d+$/)?.input:
        result = await wc.deleteCoupon(parseInt(pathParts[1] || '0'), force);
        break;

      // Taxes
      case path.match(/^taxes\/\d+$/)?.input:
        result = await wc.deleteTaxRate(parseInt(pathParts[1] || '0'), force);
        break;
      case path.match(/^taxes\/classes\/[\w-]+$/)?.input:
        result = await wc.deleteTaxClass(pathParts[2] || '', force);
        break;

      // Shipping
      case path.match(/^shipping\/zones\/\d+$/)?.input:
        result = await wc.deleteShippingZone(parseInt(pathParts[2] || '0'), force);
        break;
      case path.match(/^shipping\/zones\/\d+\/methods\/\d+$/)?.input:
        const zoneId = pathParts[2] || '0';
        const methodId = pathParts[4] || '0';
        result = await wc.deleteShippingZoneMethod(parseInt(zoneId), parseInt(methodId), force);
        break;

      // Webhooks
      case path.match(/^webhooks\/\d+$/)?.input:
        result = await wc.deleteWebhook(parseInt(pathParts[1] || '0'), force);
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WooCommerce API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}