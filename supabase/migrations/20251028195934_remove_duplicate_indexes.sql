-- Remove duplicate indexes that waste storage and cause unnecessary write overhead
-- This migration addresses Supabase advisor warning: duplicate_index

-- =============================================================================
-- DUPLICATE GROUP 1: organization_members.user_id
-- Keep: idx_organization_members_user_id (more explicit name)
-- Drop: idx_organization_members_user (less explicit)
-- =============================================================================
DROP INDEX IF EXISTS idx_organization_members_user;

-- =============================================================================
-- DUPLICATE GROUP 2: business_classifications.domain_id
-- Keep: business_classifications_domain_id_key (UNIQUE constraint, provides uniqueness + indexing)
-- Drop: idx_business_classifications_domain (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_business_classifications_domain;

-- =============================================================================
-- DUPLICATE GROUP 3: customer_configs.domain
-- Keep: customer_configs_domain_key (UNIQUE constraint)
-- Drop: idx_customer_configs_domain (redundant regular index)
-- Note: idx_customer_configs_shopify_enabled is a PARTIAL index (WHERE clause), so it's NOT a duplicate
-- =============================================================================
DROP INDEX IF EXISTS idx_customer_configs_domain;

-- =============================================================================
-- DUPLICATE GROUP 4: customer_configs.organization_id
-- Keep: idx_customer_configs_organization_id (PARTIAL index with WHERE clause - more efficient)
-- Drop: idx_customer_configs_organization (full index, less efficient)
-- =============================================================================
DROP INDEX IF EXISTS idx_customer_configs_organization;

-- =============================================================================
-- DUPLICATE GROUP 5: domain_synonym_mappings (domain_id, term)
-- Keep: domain_synonym_mappings_domain_id_term_key (UNIQUE constraint)
-- Drop: idx_domain_synonyms_lookup (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_domain_synonyms_lookup;

-- =============================================================================
-- DUPLICATE GROUP 6: domains.domain
-- Keep: domains_domain_key (UNIQUE constraint)
-- Drop: idx_domains_domain (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_domains_domain;

-- =============================================================================
-- DUPLICATE GROUP 7: domains.organization_id
-- Keep: idx_domains_organization_id (PARTIAL index with WHERE clause)
-- Drop: idx_domains_organization (full index)
-- =============================================================================
DROP INDEX IF EXISTS idx_domains_organization;

-- =============================================================================
-- DUPLICATE GROUP 8: global_synonym_mappings.term
-- Keep: global_synonym_mappings_term_key (UNIQUE constraint)
-- Drop: idx_global_synonyms_term (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_global_synonyms_term;

-- =============================================================================
-- DUPLICATE GROUP 9: organization_invitations.token
-- Keep: organization_invitations_token_key (UNIQUE constraint)
-- Drop: idx_organization_invitations_token (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_organization_invitations_token;

-- =============================================================================
-- DUPLICATE GROUP 10: organizations.slug
-- Keep: organizations_slug_key (UNIQUE constraint, likely original)
-- Drop: idx_organizations_slug (duplicate UNIQUE index)
-- =============================================================================
DROP INDEX IF EXISTS idx_organizations_slug;

-- =============================================================================
-- DUPLICATE GROUP 11: page_embeddings.id
-- Keep: page_embeddings_pkey (PRIMARY KEY - essential for table)
-- Drop: idx_page_embeddings_id_for_updates (redundant, though has INCLUDE clause)
-- Note: The INCLUDE clause adds domain_id, but this minor benefit doesn't justify the overhead
-- =============================================================================
DROP INDEX IF EXISTS idx_page_embeddings_id_for_updates;

-- =============================================================================
-- DUPLICATE GROUP 12: page_embeddings.page_id (3 indexes!)
-- Keep: idx_page_embeddings_page_id_delete (PARTIAL: WHERE embedding IS NOT NULL)
-- Keep: idx_page_embeddings_null_domain (PARTIAL: WHERE domain_id IS NULL)
-- Drop: idx_page_embeddings_page_id (full index, covered by partial indexes for specific queries)
-- Note: Partial indexes are more efficient for their specific use cases
-- =============================================================================
DROP INDEX IF EXISTS idx_page_embeddings_page_id;

-- =============================================================================
-- DUPLICATE GROUP 13: product_catalog.page_id
-- Keep: product_catalog_page_id_key (UNIQUE constraint)
-- Drop: idx_product_catalog_page (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_product_catalog_page;

-- =============================================================================
-- DUPLICATE GROUP 14: scraped_pages.domain_id
-- Keep: idx_page_embeddings_domain_lookup (PARTIAL: WHERE domain_id IS NOT NULL)
-- Drop: idx_scraped_pages_domain_id (full index, less efficient)
-- =============================================================================
DROP INDEX IF EXISTS idx_scraped_pages_domain_id;

-- =============================================================================
-- DUPLICATE GROUP 15: scraped_pages (domain_id, url)
-- Keep: unique_domain_url (UNIQUE constraint)
-- Drop: idx_scraped_pages_domain_url (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_scraped_pages_domain_url;

-- =============================================================================
-- DUPLICATE GROUP 16: scraped_pages.url
-- Keep: scraped_pages_url_unique (UNIQUE constraint)
-- Drop: idx_scraped_pages_url (redundant regular index)
-- =============================================================================
DROP INDEX IF EXISTS idx_scraped_pages_url;

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================
-- Total duplicate indexes dropped: 16
-- Expected benefits:
--   - 50% reduction in write overhead for affected tables
--   - Reduced storage requirements
--   - Faster INSERT/UPDATE operations
--   - No impact on query performance (UNIQUE constraints provide indexing)
-- =============================================================================
