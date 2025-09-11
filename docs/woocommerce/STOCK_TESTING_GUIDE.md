# Real-Time Stock Checking Testing Guide

## Overview
This guide provides detailed test scenarios for verifying the real-time stock checking feature that integrates with WooCommerce API.

## Prerequisites
1. Development server running on `http://localhost:3000`
2. WooCommerce store configured with API credentials in customer_configs
3. Products with various stock statuses in WooCommerce

## Implementation Summary

### What Was Changed
1. **Stock Query Detection** (Line 314)
   - Enhanced regex pattern to detect stock-related queries
   - Triggers on: stock, in stock, availability, available, out of stock, inventory, how many

2. **Product Identification Methods** (Lines 335-349)
   - **SKU Matching**: Detects alphanumeric codes (3+ characters)
   - **Quoted Names**: Extracts text in quotes (single or double)
   - **General Terms**: Cleans query and searches for product terms

3. **Search Priority** (Lines 353-464)
   - First: Exact SKU match (most accurate)
   - Second: Quoted product name search
   - Third: General search with cleaned query
   - Fallback: Show out-of-stock items if no specific products found

4. **Stock Information Display** (Lines 744-784)
   - Shows exact quantity if `manage_stock` is enabled
   - Displays stock status (In Stock, Out of Stock, On Backorder)
   - Includes price information for context
   - Notes variable products with multiple variations

## Test Scenarios

### 1. SKU-Based Queries
**Test Input**: "What's the stock level for SKU-WIDGET-001?"

**Expected Behavior**:
- System extracts "SKU-WIDGET-001"
- Searches WooCommerce by exact SKU
- Returns specific stock quantity or status

**Verification**:
- Check server logs for: `Found product by SKU SKU-WIDGET-001:`
- Response should include exact stock number if available

### 2. Product Name Queries
**Test Input**: "Is the 'Blue Cotton T-Shirt' available?"

**Expected Behavior**:
- System extracts "Blue Cotton T-Shirt" from quotes
- Searches products by name
- Returns current stock status

**Verification**:
- Check logs for: `Found product by name search "Blue Cotton T-Shirt":`
- Response should specify in stock/out of stock status

### 3. Multiple Product Queries
**Test Input**: "Check stock for ABC123 and 'Winter Jacket'"

**Expected Behavior**:
- Searches for SKU "ABC123"
- Searches for product name "Winter Jacket"
- Returns stock info for both products

**Verification**:
- Logs should show both SKU and name searches
- Response should list both products with their stock status

### 4. General Stock Queries
**Test Input**: "Show me what's out of stock"

**Expected Behavior**:
- No specific product identified
- Falls back to showing out-of-stock items
- Lists products with zero inventory

**Verification**:
- Logs: `No specific products found, fetching low stock items`
- Response lists out-of-stock products

### 5. Quantity-Specific Queries
**Test Input**: "How many wireless keyboards do you have?"

**Expected Behavior**:
- Searches for "wireless keyboards"
- Returns exact quantity if stock tracking enabled
- Otherwise returns general availability

**Verification**:
- Response includes specific number: "We have 15 wireless keyboards in stock"
- Or status: "Wireless keyboards are currently in stock"

### 6. Mixed Content Query
**Test Input**: "I need to know if the red shoes are available and what's the stock of item TRN-456"

**Expected Behavior**:
- Searches for "red shoes" as general search
- Searches for "TRN-456" as SKU
- Combines both results in response

## Debugging

### Server Console Output
Monitor the development server console for:
```
Real-time stock check: domain example.com
WooCommerce: Fetching real-time stock data for domain example.com
Found product by SKU ABC123: Product Name
Found product by name search "quoted name": Product Name
Found product by general search "search terms": Product Name
No specific products found, fetching low stock items
```

### Common Issues

1. **No Products Found**
   - Verify WooCommerce credentials are configured for the domain
   - Check that products exist and are published
   - Ensure SKUs match exactly (case-sensitive)

2. **Stock Not Updating**
   - Confirm WooCommerce API has read permissions for products
   - Check that product stock management is enabled in WooCommerce
   - Verify the domain parameter is being passed correctly

3. **Rate Limiting**
   - Wait 2 seconds between test queries
   - Check rate limit headers in response

## API Response Structure

Successful stock check adds to context:
```
Real-Time Stock Information:
Product Name (SKU: ABC123):
  Stock Quantity: 25 units
  Stock Status: In Stock (Good availability)
  Price: $29.99
```

## Manual Testing Checklist

- [ ] Test with valid SKU - returns exact match
- [ ] Test with partial SKU - may not find product
- [ ] Test with quoted product name - finds by name
- [ ] Test with unquoted product name - general search
- [ ] Test "out of stock" query - lists unavailable items
- [ ] Test with non-existent product - handles gracefully
- [ ] Test without WooCommerce configured - falls back to scraped data
- [ ] Test with variable products - mentions variations
- [ ] Test stock quantity display - shows exact numbers when available
- [ ] Test backorder status - correctly identifies backorder items

## Integration Points

1. **WooCommerce API** (`lib/woocommerce-dynamic.ts`)
   - getDynamicWooCommerceClient(domain)
   - wc.getProducts({ search, sku, per_page, status })

2. **Context Building** (Lines 738-794)
   - Processes stock results
   - Formats for AI consumption
   - Prioritizes real-time over scraped data

3. **AI System Prompt** (Lines 813-817)
   - Instructs AI to use Real-Time Stock Information
   - Prioritizes live data over scraped content
   - Guides specific quantity mentions

## Performance Considerations

- Stock checks run in parallel with other context gathering
- Capped at 5 products per search to avoid timeout
- Falls back gracefully if WooCommerce unavailable
- Results cached in conversation context