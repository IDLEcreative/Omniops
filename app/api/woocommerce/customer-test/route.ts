import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { WooCommerceAPI } from '@/lib/woocommerce-api';
import { WooCommerceCustomer } from '@/lib/woocommerce-customer';
import { CustomerVerification, DataMasker } from '@/lib/customer-verification';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('test') || 'all';
    const email = searchParams.get('email');
    const domain = searchParams.get('domain');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Database Schema
    if (testType === 'all' || testType === 'schema') {
      const supabase = await createServiceRoleClient();
      
      if (!supabase) {
        results.tests.schema = {
          success: false,
          error: 'Database connection unavailable'
        };
      } else {
        try {
          // Check if tables exist
        const tables = ['conversations', 'messages', 'customer_verifications', 'customer_access_logs', 'customer_data_cache'];
        const tableCheck: any = {};
        const tableErrors: any = {};
        
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(0);
          
          tableCheck[table] = !error;
          if (error) {
            tableErrors[table] = error.message;
          }
        }
        
        results.tests.schema = {
          success: Object.values(tableCheck).every(v => v === true),
          tables: tableCheck,
          errors: Object.keys(tableErrors).length > 0 ? tableErrors : undefined,
          message: 'Database schema check complete'
        };
      } catch (error: any) {
        results.tests.schema = {
          success: false,
          error: error.message
        };
      }
      }
    }

    // Test 2: Customer Verification Flow
    if (testType === 'all' || testType === 'verification') {
      try {
        const testConversationId = uuidv4();
        const testEmail = email || 'test@example.com';
        
        // Create verification
        const verificationResult = await CustomerVerification.createVerification({
          conversationId: testConversationId,
          email: testEmail,
          method: 'email'
        });
        
        if (verificationResult.success && verificationResult.code) {
          // Verify the code
          const verifyResult = await CustomerVerification.verifyCode(
            testConversationId,
            testEmail,
            verificationResult.code
          );
          
          // Check status
          const status = await CustomerVerification.checkVerificationStatus(testConversationId);
          
          results.tests.verification = {
            success: verifyResult.verified && status.isVerified,
            flow: {
              created: verificationResult.success,
              verified: verifyResult.verified,
              statusCheck: status.isVerified
            },
            message: 'Verification flow test complete'
          };
          
          // Clean up test data
          const supabase = await createServiceRoleClient();
          if (supabase) {
            await supabase
            .from('customer_verifications')
            .delete()
            .eq('conversation_id', testConversationId);
          }
        } else {
          results.tests.verification = {
            success: false,
            error: 'Failed to create verification'
          };
        }
      } catch (error: any) {
        results.tests.verification = {
          success: false,
          error: error.message
        };
      }
    }

    // Test 3: WooCommerce Customer Search
    if (testType === 'all' || testType === 'customer') {
      try {
        const wcCustomer = domain 
          ? await WooCommerceCustomer.forDomain(domain)
          : WooCommerceCustomer.fromEnvironment();
        
        if (wcCustomer && email) {
          const customer = await wcCustomer.searchCustomerByEmail(email);
          
          if (customer) {
            results.tests.customerSearch = {
              success: true,
              found: true,
              customer: {
                id: customer.id,
                email: DataMasker.maskEmail(customer.email),
                name: `${customer.first_name} ${customer.last_name}`,
                ordersCount: customer.orders_count,
                totalSpent: customer.total_spent
              }
            };
            
            // Test order retrieval
            const orders = await wcCustomer.getCustomerOrders(customer.id, 3);
            results.tests.customerOrders = {
              success: true,
              count: orders.length,
              orders: orders.map(o => ({
                number: o.number,
                status: o.status,
                total: o.total,
                date: o.date_created
              }))
            };
          } else {
            results.tests.customerSearch = {
              success: true,
              found: false,
              message: 'Customer not found'
            };
          }
        } else {
          results.tests.customerSearch = {
            success: false,
            error: email ? 'WooCommerce not configured' : 'Email parameter required'
          };
        }
      } catch (error: any) {
        results.tests.customerSearch = {
          success: false,
          error: error.message
        };
      }
    }

    // Test 4: Data Masking
    if (testType === 'all' || testType === 'masking') {
      const testData = {
        email: 'johndoe@example.com',
        phone: '+1234567890',
        address: {
          city: 'New York',
          state: 'NY',
          country: 'US',
          postcode: '10001'
        },
        card: '4111111111111111'
      };
      
      results.tests.masking = {
        success: true,
        original: testData,
        masked: {
          email: DataMasker.maskEmail(testData.email),
          phone: DataMasker.maskPhone(testData.phone),
          address: DataMasker.maskAddress(testData.address),
          card: DataMasker.maskCard(testData.card)
        }
      };
    }

    // Test 5: Access Logging
    if (testType === 'all' || testType === 'logging') {
      try {
        const testConversationId = uuidv4();
        const testEmail = email || 'test@example.com';
        
        // Log access
        await CustomerVerification.logAccess(
          testConversationId,
          testEmail,
          123,
          ['profile', 'orders'],
          'Test access',
          'test'
        );
        
        // Check if logged
        const supabase = await createServiceRoleClient();
        if (!supabase) {
          results.tests.logging = {
            success: false,
            error: 'Database connection unavailable'
          };
        } else {
          const { data } = await supabase
            .from('customer_access_logs')
            .select('*')
            .eq('conversation_id', testConversationId)
            .single();
          
          results.tests.logging = {
            success: !!data,
            logged: !!data,
            message: 'Access logging test complete'
          };
          
          // Clean up
          if (data) {
            await supabase
            .from('customer_access_logs')
            .delete()
            .eq('id', data.id);
          }
        }
      } catch (error: any) {
        results.tests.logging = {
          success: false,
          error: error.message
        };
      }
    }

    // Test 6: Caching
    if (testType === 'all' || testType === 'caching') {
      try {
        const testConversationId = uuidv4();
        const testEmail = email || 'test@example.com';
        const testData = { test: 'data', timestamp: Date.now() };
        
        // Cache data
        await CustomerVerification.cacheCustomerData(
          testConversationId,
          testEmail,
          123,
          testData,
          'profile'
        );
        
        // Retrieve cached data
        const cached = await CustomerVerification.getCachedData(
          testConversationId,
          'profile'
        );
        
        results.tests.caching = {
          success: !!cached && cached.test === 'data',
          stored: !!cached,
          retrieved: cached?.test === 'data',
          message: 'Caching test complete'
        };
        
        // Clean up
        const supabase = await createServiceRoleClient();
        if (supabase) {
          await supabase
            .from('customer_data_cache')
            .delete()
            .eq('conversation_id', testConversationId);
        }
      } catch (error: any) {
        results.tests.caching = {
          success: false,
          error: error.message
        };
      }
    }

    // Calculate overall success
    const allTests = Object.values(results.tests);
    const successCount = allTests.filter((t: any) => t.success).length;
    
    results.summary = {
      totalTests: allTests.length,
      passed: successCount,
      failed: allTests.length - successCount,
      success: successCount === allTests.length
    };

    return NextResponse.json(results, { 
      status: results.summary.success ? 200 : 207 
    });

  } catch (error: any) {
    console.error('Customer test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
