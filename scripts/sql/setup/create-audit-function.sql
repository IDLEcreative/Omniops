-- Function to get processing statistics by date
CREATE OR REPLACE FUNCTION get_processing_stats_by_date(p_domain_id uuid)
RETURNS TABLE (
  date date,
  scraped bigint,
  chunked bigint,
  embedded bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE,
      '1 day'::interval
    )::date AS date
  ),
  scraped_counts AS (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM scraped_pages
    WHERE domain_id = p_domain_id
    GROUP BY DATE(created_at)
  ),
  chunked_counts AS (
    SELECT 
      DATE(wc.created_at) as date,
      COUNT(DISTINCT wc.scraped_page_id) as count
    FROM website_content wc
    JOIN scraped_pages sp ON sp.id = wc.scraped_page_id
    WHERE sp.domain_id = p_domain_id
    GROUP BY DATE(wc.created_at)
  ),
  embedded_counts AS (
    SELECT 
      DATE(pe.created_at) as date,
      COUNT(DISTINCT pe.page_id) as count
    FROM page_embeddings pe
    JOIN scraped_pages sp ON sp.id = pe.page_id
    WHERE sp.domain_id = p_domain_id
    GROUP BY DATE(pe.created_at)
  )
  SELECT 
    dr.date,
    COALESCE(sc.count, 0) as scraped,
    COALESCE(cc.count, 0) as chunked,
    COALESCE(ec.count, 0) as embedded
  FROM date_range dr
  LEFT JOIN scraped_counts sc ON sc.date = dr.date
  LEFT JOIN chunked_counts cc ON cc.date = dr.date
  LEFT JOIN embedded_counts ec ON ec.date = dr.date
  ORDER BY dr.date DESC;
END;
$$ LANGUAGE plpgsql;