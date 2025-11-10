/**
 * Image Extractor
 * Extracts images from HTML documents including lazy-loaded images
 */

/**
 * Extracts images from a document
 * Handles regular src, data-src, and data-lazy-src attributes
 * Filters out base64-encoded images
 *
 * @param {Document} document - DOM document object
 * @returns {Array<Object>} Array of image objects with src and alt
 */
export function extractImages(document) {
  const images = [];
  const imgElements = document.querySelectorAll('img');

  imgElements.forEach(img => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (src && !src.includes('data:image')) { // Skip base64 images
      images.push({
        src: src,
        alt: img.alt || img.getAttribute('title') || 'Image',
      });
    }
  });

  return images;
}
