/**
 * Pagination Utilities
 * Reusable pagination helpers for WooCommerce operations
 */

/**
 * Pagination metadata returned with paginated results
 */
export interface PaginationMetadata {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  nextPage?: number;
  previousPage?: number;
}

/**
 * Calculate pagination metadata from current state
 *
 * @param currentPage - Current page number (1-indexed)
 * @param perPage - Results per page
 * @param total - Total number of results available
 * @returns Complete pagination metadata
 */
export function calculatePagination(
  currentPage: number,
  perPage: number,
  total: number
): PaginationMetadata {
  // Ensure valid values
  const page = Math.max(1, currentPage);
  const resultsPerPage = Math.max(1, Math.min(100, perPage)); // Cap at 100
  const totalResults = Math.max(0, total);

  // Calculate pages
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const hasMore = page < totalPages;
  const nextPage = hasMore ? page + 1 : undefined;
  const previousPage = page > 1 ? page - 1 : undefined;

  return {
    page,
    perPage: resultsPerPage,
    total: totalResults,
    totalPages,
    hasMore,
    nextPage,
    previousPage
  };
}

/**
 * Format a user-friendly pagination message
 *
 * @param pagination - Pagination metadata
 * @returns Formatted message with page info and next steps
 */
export function formatPaginationMessage(pagination: PaginationMetadata): string {
  if (pagination.total === 0) {
    return '';
  }

  let message = `\n\n📄 Page ${pagination.page} of ${pagination.totalPages}`;
  message += ` (${pagination.total} total results)`;

  if (pagination.hasMore) {
    message += `\n💡 Want more? Ask me to show page ${pagination.nextPage}!`;
  }

  if (pagination.previousPage) {
    message += `\n◀️ To see previous results, ask for page ${pagination.previousPage}`;
  }

  return message;
}

/**
 * Extract pagination metadata from WooCommerce API response headers
 * Some WooCommerce endpoints return pagination info in response headers
 *
 * @param headers - Response headers from WooCommerce API
 * @param currentPage - Current page number
 * @param perPage - Results per page
 * @returns Pagination metadata extracted from headers
 */
export function extractPaginationFromHeaders(
  headers: Record<string, string> | undefined,
  currentPage: number,
  perPage: number
): PaginationMetadata | null {
  if (!headers) {
    return null;
  }

  // WooCommerce REST API uses these headers:
  // X-WP-Total: total number of items
  // X-WP-TotalPages: total number of pages
  const total = headers['x-wp-total'] ? parseInt(headers['x-wp-total'], 10) : null;
  const totalPages = headers['x-wp-totalpages'] ? parseInt(headers['x-wp-totalpages'], 10) : null;

  if (total === null) {
    return null;
  }

  // If totalPages is provided, use it; otherwise calculate
  const calculatedTotalPages = totalPages || Math.ceil(total / perPage);

  return {
    page: currentPage,
    perPage,
    total,
    totalPages: calculatedTotalPages,
    hasMore: currentPage < calculatedTotalPages,
    nextPage: currentPage < calculatedTotalPages ? currentPage + 1 : undefined,
    previousPage: currentPage > 1 ? currentPage - 1 : undefined
  };
}

/**
 * Convert offset-based pagination to page-based
 *
 * @param offset - Number of results to skip
 * @param perPage - Results per page
 * @returns Equivalent page number (1-indexed)
 */
export function offsetToPage(offset: number, perPage: number): number {
  return Math.floor(offset / perPage) + 1;
}

/**
 * Convert page-based pagination to offset
 *
 * @param page - Page number (1-indexed)
 * @param perPage - Results per page
 * @returns Number of results to skip
 */
export function pageToOffset(page: number, perPage: number): number {
  return (page - 1) * perPage;
}
