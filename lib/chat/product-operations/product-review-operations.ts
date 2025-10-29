/**
 * WooCommerce Product Review Operations
 * Handles product reviews and ratings retrieval
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  ReviewInfo
} from '../woocommerce-tool-types';

/**
 * Get product reviews and ratings
 * Shows customer feedback with star ratings
 */
export async function getProductReviews(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.productId) {
    return {
      success: false,
      data: null,
      message: "Product ID is required for reviews"
    };
  }

  try {
    const productId = parseInt(params.productId, 10);
    if (isNaN(productId)) {
      return {
        success: false,
        data: null,
        message: "Invalid product ID format"
      };
    }

    // Build query parameters
    const queryParams: any = {
      product: [productId],
      per_page: params.limit || 5, // Default 5 reviews
      status: 'approved' // Only show approved reviews
    };

    // Get reviews
    const reviews = await wc.getProductReviews(queryParams);

    if (reviews && reviews.length > 0) {
      // Filter by minimum rating if specified
      let filteredReviews = reviews;
      if (params.minRating) {
        filteredReviews = reviews.filter((r: any) => r.rating >= params.minRating!);
      }

      const reviewList: ReviewInfo[] = filteredReviews.map((review: any) => ({
        id: review.id,
        productId: review.product_id,
        rating: review.rating,
        reviewer: review.reviewer,
        reviewerEmail: review.reviewer_email,
        review: review.review,
        dateCreated: review.date_created,
        verified: review.verified
      }));

      // Calculate average rating
      const totalRating = reviewList.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = (totalRating / reviewList.length).toFixed(1);

      // Format message with reviews
      let message = `⭐ Average Rating: ${avgRating}/5 (${reviewList.length} reviews)\n\n`;

      reviewList.forEach((review, index) => {
        const stars = '⭐'.repeat(review.rating);
        const verified = review.verified ? '✓ Verified Purchase' : '';
        const date = new Date(review.dateCreated).toLocaleDateString();

        message += `${index + 1}. ${stars} (${review.rating}/5) ${verified}\n`;
        message += `   By: ${review.reviewer} on ${date}\n`;

        // Truncate long reviews
        const reviewText = review.review.length > 200
          ? review.review.substring(0, 200) + '...'
          : review.review;
        message += `   "${reviewText}"\n\n`;
      });

      return {
        success: true,
        data: { reviews: reviewList, averageRating: parseFloat(avgRating) },
        message
      };
    } else {
      return {
        success: true,
        data: { reviews: [], averageRating: 0 },
        message: params.minRating
          ? `No reviews found with rating >= ${params.minRating} stars`
          : "No reviews found for this product yet"
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Reviews error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve product reviews"
    };
  }
}
