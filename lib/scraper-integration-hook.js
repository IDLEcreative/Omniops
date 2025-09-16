/**
 * Scraper Integration Hook for Domain-Agnostic System
 * Add this to scraper-worker.js to enable adaptive entity extraction
 */

const { BusinessClassifier } = require('./business-classifier');
const { AdaptiveEntityExtractor } = require('./adaptive-entity-extractor');

/**
 * Hook to be called after scraping pages
 * Replaces EcommerceExtractor with adaptive extraction
 */
async function performAdaptiveExtraction(pageData, domainId, supabase) {
  try {
    console.log(`[Adaptive Extraction] Processing page: ${pageData.url}`);
    
    // Step 1: Check if domain is classified
    const { data: classification } = await supabase
      .from('business_classifications')
      .select('business_type, confidence')
      .eq('domain_id', domainId)
      .single();
    
    let businessType = classification?.business_type;
    
    // Step 2: If not classified, classify now
    if (!businessType) {
      console.log(`[Adaptive Extraction] Classifying business for domain ${domainId}`);
      
      // Get sample pages for classification
      const { data: samplePages } = await supabase
        .from('scraped_pages')
        .select('content')
        .eq('domain_id', domainId)
        .limit(5);
      
      if (samplePages && samplePages.length > 0) {
        const sampleContent = samplePages.map(p => p.content || '');
        const businessClassification = await BusinessClassifier.classifyBusiness(
          domainId,
          sampleContent
        );
        
        // Store classification
        await supabase
          .from('business_classifications')
          .upsert({
            domain_id: domainId,
            business_type: businessClassification.primaryType,
            confidence: businessClassification.confidence,
            indicators: businessClassification.indicators,
            entity_terminology: businessClassification.terminology,
            extraction_config: {
              schema: businessClassification.suggestedSchema,
              strategy: businessClassification.extractionStrategy
            }
          });
        
        businessType = businessClassification.primaryType;
        console.log(`[Adaptive Extraction] Classified as: ${businessType}`);
      }
    }
    
    // Step 3: Queue for entity extraction based on business type
    if (businessType) {
      // Determine if this page likely contains entities
      const isEntityPage = checkIfEntityPage(pageData, businessType);
      
      if (isEntityPage) {
        console.log(`[Adaptive Extraction] Queuing entity extraction for ${businessType} page`);
        
        // Add to entity extraction queue
        await supabase
          .from('entity_extraction_queue')
          .upsert({
            page_id: pageData.id,
            priority: 1,
            status: 'pending',
            metadata: {
              business_type: businessType,
              url: pageData.url,
              title: pageData.title
            }
          });
      }
    }
    
    // Step 4: Extract structured data if high-priority
    if (isHighPriorityPage(pageData.url, businessType)) {
      console.log(`[Adaptive Extraction] High-priority page, extracting immediately`);
      
      // Note: In production, this would use GPT-4 via AdaptiveEntityExtractor
      // For now, we extract basic metadata
      const entityData = extractBasicEntityData(pageData, businessType);
      
      if (entityData) {
        await supabase
          .from('entity_catalog')
          .upsert({
            page_id: pageData.id,
            domain_id: domainId,
            entity_type: getEntityType(businessType),
            name: entityData.name || 'Unnamed',
            description: entityData.description,
            price: entityData.price,
            is_available: entityData.available !== false,
            primary_category: entityData.category,
            attributes: entityData.attributes || {},
            extraction_method: 'scraper_basic',
            confidence_score: 0.5
          });
      }
    }
    
    return {
      success: true,
      businessType,
      extracted: true
    };
    
  } catch (error) {
    console.error(`[Adaptive Extraction] Error:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if page likely contains entities based on URL and content
 */
function checkIfEntityPage(pageData, businessType) {
  const url = pageData.url.toLowerCase();
  const content = (pageData.content || '').toLowerCase();
  
  switch (businessType) {
    case 'ecommerce':
      return url.includes('/product') || url.includes('/item') || 
             content.includes('add to cart') || content.includes('price');
      
    case 'real_estate':
      return url.includes('/property') || url.includes('/listing') ||
             content.includes('bedroom') || content.includes('sqft');
      
    case 'healthcare':
      return url.includes('/service') || url.includes('/provider') ||
             content.includes('appointment') || content.includes('doctor');
      
    case 'education':
      return url.includes('/course') || url.includes('/program') ||
             content.includes('enroll') || content.includes('credits');
      
    case 'restaurant':
      return url.includes('/menu') || url.includes('/item') ||
             content.includes('price') || content.includes('order');
      
    case 'legal':
      return url.includes('/service') || url.includes('/practice') ||
             content.includes('consultation') || content.includes('attorney');
      
    default:
      // Generic check
      return url.includes('/service') || url.includes('/product') ||
             content.includes('price') || content.includes('available');
  }
}

/**
 * Check if page is high priority for immediate extraction
 */
function isHighPriorityPage(url, businessType) {
  const urlLower = url.toLowerCase();
  
  // Always high priority
  if (urlLower.includes('/featured') || urlLower.includes('/special')) {
    return true;
  }
  
  // Business-specific high priority
  switch (businessType) {
    case 'ecommerce':
      return urlLower.includes('/product/');
    case 'real_estate':
      return urlLower.includes('/property/') || urlLower.includes('/listing/');
    case 'healthcare':
      return urlLower.includes('/provider/') || urlLower.includes('/service/');
    default:
      return false;
  }
}

/**
 * Extract basic entity data without GPT-4
 */
function extractBasicEntityData(pageData, businessType) {
  const content = pageData.content || '';
  const title = pageData.title || '';
  
  // Try to extract price
  const priceMatch = content.match(/\$[\d,]+\.?\d*/);
  const price = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : null;
  
  // Build basic entity
  const entity = {
    name: title.replace(/ - .*$/, '').trim(),
    description: content.substring(0, 200),
    price: price,
    available: !content.toLowerCase().includes('out of stock') &&
               !content.toLowerCase().includes('sold'),
    category: null,
    attributes: {}
  };
  
  // Add business-specific attributes
  switch (businessType) {
    case 'real_estate':
      const bedMatch = content.match(/(\d+)\s*(?:bed|br)/i);
      const bathMatch = content.match(/(\d+\.?\d*)\s*(?:bath|ba)/i);
      const sqftMatch = content.match(/(\d+,?\d*)\s*(?:sqft|sq\.?\s*ft)/i);
      
      if (bedMatch) entity.attributes.bedrooms = parseInt(bedMatch[1]);
      if (bathMatch) entity.attributes.bathrooms = parseFloat(bathMatch[1]);
      if (sqftMatch) entity.attributes.square_feet = parseInt(sqftMatch[1].replace(',', ''));
      break;
      
    case 'automotive':
      const yearMatch = content.match(/\b(19|20)\d{2}\b/);
      const mileageMatch = content.match(/(\d+,?\d*)\s*miles/i);
      
      if (yearMatch) entity.attributes.year = parseInt(yearMatch[0]);
      if (mileageMatch) entity.attributes.mileage = parseInt(mileageMatch[1].replace(',', ''));
      break;
  }
  
  return entity;
}

/**
 * Get entity type name for business
 */
function getEntityType(businessType) {
  const typeMap = {
    'ecommerce': 'product',
    'real_estate': 'property',
    'healthcare': 'service',
    'education': 'course',
    'restaurant': 'menu_item',
    'legal': 'service',
    'automotive': 'vehicle',
    'financial': 'service',
    'hospitality': 'room'
  };
  
  return typeMap[businessType] || 'item';
}

// Export for use in scraper-worker.js
module.exports = {
  performAdaptiveExtraction,
  checkIfEntityPage,
  isHighPriorityPage,
  extractBasicEntityData,
  getEntityType
};

/**
 * HOW TO INTEGRATE INTO scraper-worker.js:
 * 
 * 1. Add at the top:
 *    const { performAdaptiveExtraction } = require('./scraper-integration-hook');
 * 
 * 2. Replace this section (around line 1253):
 *    const ecommerceExtracted = await EcommerceExtractor.extractEcommerce(html, pageUrl);
 * 
 * 3. With:
 *    const adaptiveExtracted = await performAdaptiveExtraction(pageData, domainId, supabase);
 * 
 * 4. The system will now:
 *    - Automatically classify business type on first scrape
 *    - Extract appropriate entities for that business
 *    - Use correct terminology throughout
 */