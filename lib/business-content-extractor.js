"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBusinessInfo = extractBusinessInfo;
exports.selectiveStripBoilerplate = selectiveStripBoilerplate;
exports.smartHtmlToText = smartHtmlToText;
const cheerio = __importStar(require("cheerio"));
/**
 * Extract business-critical information before stripping
 */
function extractBusinessInfo(html) {
    const $ = cheerio.load(html);
    // Phone patterns
    const phonePatterns = [
        /(\+?[\d\s()-]{10,20})/g, // General phone
        /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g, // US format
        /(0[1-9]\d{9,10})/g, // UK format
    ];
    // Email pattern
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    // Extract contact information
    const phones = new Set();
    const emails = new Set();
    const addresses = new Set();
    // Look for phone numbers
    $('a[href^="tel:"]').each((_, el) => {
        const phone = $(el).attr('href')?.replace('tel:', '').trim();
        if (phone)
            phones.add(phone);
    });
    // Look for emails
    $('a[href^="mailto:"]').each((_, el) => {
        const email = $(el).attr('href')?.replace('mailto:', '').trim();
        if (email)
            emails.add(email);
    });
    // Search text for phones/emails if not found in links
    const bodyText = $('body').text();
    if (phones.size === 0) {
        phonePatterns.forEach(pattern => {
            const matches = bodyText.match(pattern);
            matches?.forEach(match => {
                const cleaned = match.trim();
                if (cleaned.length >= 10)
                    phones.add(cleaned);
            });
        });
    }
    if (emails.size === 0) {
        const emailMatches = bodyText.match(emailPattern);
        emailMatches?.forEach(email => emails.add(email));
    }
    // Look for addresses (common patterns)
    $('address, .address, .location, [itemtype*="PostalAddress"]').each((_, el) => {
        const addr = $(el).text().trim();
        if (addr.length > 10)
            addresses.add(addr);
    });
    // Extract business hours
    const businessHours = [];
    const hoursSelectors = [
        '.hours', '.business-hours', '.opening-hours', '.store-hours',
        '[class*="hours"]', '[id*="hours"]'
    ];
    hoursSelectors.forEach(selector => {
        $(selector).each((_, el) => {
            const hours = $(el).text().trim();
            if (hours && hours.length < 500) { // Avoid capturing entire pages
                businessHours.push(hours);
            }
        });
    });
    // Extract social links
    const socialLinks = [];
    const socialPlatforms = {
        facebook: /facebook\.com/i,
        twitter: /twitter\.com|x\.com/i,
        instagram: /instagram\.com/i,
        linkedin: /linkedin\.com/i,
        youtube: /youtube\.com/i,
        pinterest: /pinterest\.com/i,
    };
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            for (const [platform, pattern] of Object.entries(socialPlatforms)) {
                if (pattern.test(href)) {
                    socialLinks.push({ platform, url: href });
                    break;
                }
            }
        }
    });
    // Extract policies (return, shipping, privacy, etc.)
    const policies = [];
    const policyKeywords = ['return', 'shipping', 'privacy', 'terms', 'refund', 'warranty'];
    policyKeywords.forEach(keyword => {
        $(`a:contains("${keyword}")`, 'footer').each((_, el) => {
            const text = $(el).text().trim();
            if (text.length < 100) { // Just the link text, not content
                policies.push({ type: keyword, text });
            }
        });
    });
    // Extract company info
    const companyInfo = {};
    // Try to find company name
    const siteName = $('meta[property="og:site_name"]').attr('content') ||
        $('meta[name="application-name"]').attr('content');
    if (siteName)
        companyInfo.name = siteName;
    // Try to find tagline
    const tagline = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content');
    if (tagline && tagline.length < 200)
        companyInfo.tagline = tagline;
    return {
        contactInfo: {
            phones: Array.from(phones).slice(0, 5), // Limit to 5 phones
            emails: Array.from(emails).slice(0, 5), // Limit to 5 emails
            addresses: Array.from(addresses).slice(0, 3), // Limit to 3 addresses
        },
        businessHours,
        socialLinks: socialLinks.slice(0, 10), // Limit social links
        policies,
        companyInfo,
    };
}
/**
 * Selective stripping that preserves important business elements
 */
function selectiveStripBoilerplate($) {
    // First, extract text from important business elements to check later
    const importantContent = new Set();
    // Capture important text before removal
    $('.contact, .phone, .email, .address, .hours, .location').each((_, el) => {
        const text = $(el).text().trim();
        if (text)
            importantContent.add(text);
    });
    // Remove pure navigation elements (menus with many links)
    $('.mega-menu, .dropdown-menu, .nav-menu, .mobile-menu').remove();
    $('nav ul, nav ol').each((_, el) => {
        const $el = $(el);
        const linkCount = $el.find('a').length;
        const textLength = $el.text().length;
        // If it's mostly links (high link density), remove it
        if (linkCount > 5 && textLength / linkCount < 20) {
            $el.remove();
        }
    });
    // Remove social sharing widgets (not social links)
    $('.share-buttons, .social-share, .addthis, .sharethis').remove();
    // Remove promotional banners and popups
    $('.popup, .modal, .overlay, .banner:not(.info-banner)').remove();
    $('.promo, .advertisement, .ads, [class*="popup"]').remove();
    // Remove cookie notices
    $('.cookie, .gdpr, [class*="cookie"], [id*="cookie"]').each((_, el) => {
        const $el = $(el);
        const text = $el.text().toLowerCase();
        if (text.includes('cookie') || text.includes('gdpr')) {
            $el.remove();
        }
    });
    // Remove newsletter signup forms (but keep contact forms)
    $('.newsletter, .subscribe').each((_, el) => {
        const $el = $(el);
        if (!$el.hasClass('contact') && !$el.find('.contact').length) {
            $el.remove();
        }
    });
    // Smart header/footer removal - only if they don't contain important info
    $('header, footer, .header, .footer').each((_, el) => {
        const $el = $(el);
        const text = $el.text().toLowerCase();
        // Check if contains important business info
        const hasImportantInfo = text.includes('phone') ||
            text.includes('email') ||
            text.includes('address') ||
            text.includes('hours') ||
            text.includes('contact') ||
            $el.find('address, .contact, .phone, .email, .hours').length > 0;
        // Check if it's primarily navigation
        const linkCount = $el.find('a').length;
        const wordCount = $el.text().split(/\s+/).length;
        const isMainlyNav = linkCount > 10 && wordCount < linkCount * 3;
        // Remove if it's mainly navigation and doesn't have important info
        if (isMainlyNav && !hasImportantInfo) {
            $el.remove();
        }
    });
    // Remove sidebar if it's mainly navigation or ads
    $('.sidebar, aside').each((_, el) => {
        const $el = $(el);
        const text = $el.text().toLowerCase();
        // Keep if it has important content
        if (text.includes('contact') ||
            text.includes('hours') ||
            text.includes('location') ||
            $el.find('.contact, .hours, .location').length > 0) {
            return; // Keep this sidebar
        }
        // Remove if mainly links or ads
        const linkCount = $el.find('a').length;
        const wordCount = $el.text().split(/\s+/).length;
        if (linkCount > 5 && wordCount < linkCount * 5) {
            $el.remove();
        }
    });
    // Remove "related posts" and similar sections
    $('.related, .recommended, .similar, [class*="related"]').each((_, el) => {
        const $el = $(el);
        if (!$el.hasClass('products')) { // Keep related products
            $el.remove();
        }
    });
    // Remove breadcrumbs (they're navigation)
    $('.breadcrumb, .breadcrumbs, [aria-label="breadcrumb"]').remove();
    // Remove comment sections
    $('.comments, #comments, .disqus, #disqus_thread').remove();
}
/**
 * Convert HTML to text with smart preservation
 */
function smartHtmlToText(html) {
    const $ = cheerio.load(html);
    // Apply selective stripping
    selectiveStripBoilerplate($);
    // Also remove script/style tags
    $('script, style, noscript').remove();
    // Preserve some structure
    $('p, div, section, article').append('\n\n');
    $('br').replaceWith('\n');
    $('li').prepend('• ');
    // Get text content
    return $.text()
        .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
        .replace(/[ \t]+/g, ' ') // Reduce multiple spaces
        .trim();
}
