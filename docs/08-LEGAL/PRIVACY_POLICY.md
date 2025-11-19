# Privacy Policy

**Type:** Legal Document
**Status:** Active
**Last Updated:** 2025-11-18
**Version:** v1.0.0
**Effective Date:** January 1, 2025

## Purpose

This Privacy Policy describes how OmniOps ("we", "us", or "our") collects, uses, and protects information when you use our AI-powered customer service chat widget platform ("the Service"). We are committed to protecting your privacy and complying with applicable data protection laws, including GDPR and CCPA.

## Table of Contents

- [1. Information We Collect](#1-information-we-collect)
- [2. How We Use Information](#2-how-we-use-information)
- [3. Legal Basis for Processing](#3-legal-basis-for-processing)
- [4. Data Storage and Security](#4-data-storage-and-security)
- [5. Data Sharing and Disclosure](#5-data-sharing-and-disclosure)
- [6. User Rights](#6-user-rights)
- [7. Cookies and Tracking Technologies](#7-cookies-and-tracking-technologies)
- [8. Data Retention](#8-data-retention)
- [9. International Data Transfers](#9-international-data-transfers)
- [10. Children's Privacy](#10-childrens-privacy)
- [11. Third-Party Services](#11-third-party-services)
- [12. Privacy by Design](#12-privacy-by-design)
- [13. Data Breach Procedures](#13-data-breach-procedures)
- [14. Changes to Privacy Policy](#14-changes-to-privacy-policy)
- [15. Contact Information](#15-contact-information)

---

## 1. Information We Collect

We collect information in several ways to provide and improve our Service:

### 1.1 Information You Provide Directly

**Account Information:**
- Name and contact details
- Email address
- Company/organization information
- Billing information (processed by payment providers)
- Account preferences and settings

**Customer Configuration:**
- Website URLs for scraping
- API credentials (encrypted using AES-256)
- Widget customization settings
- Integration configurations (WooCommerce, Shopify)

**Support Communications:**
- Support tickets and inquiries
- Feedback and suggestions
- Survey responses

### 1.2 Information Collected Automatically

**Usage Data:**
- Service usage patterns and statistics
- Feature utilization metrics
- API call logs
- Performance metrics

**Technical Data:**
- IP addresses (anonymized where required)
- Browser type and version
- Device information
- Operating system
- Referring URLs

**Chat Widget Data:**
- Conversation logs between end-users and AI
- User queries and interactions
- Session identifiers
- Timestamp information

### 1.3 Information from Website Scraping

**Publicly Available Content:**
- Website pages and content structure
- Product information and descriptions
- FAQ content
- Contact information published on websites
- Business information

**Note:** We only scrape publicly accessible information with customer authorization.

### 1.4 Third-Party Integrations

**E-commerce Platform Data:**
- Product catalogs
- Order information (when authorized)
- Customer inquiry data
- Inventory status

## 2. How We Use Information

We use collected information for the following purposes:

### 2.1 Service Provision
- Provide the chat widget functionality
- Process and respond to user queries
- Enable AI-powered customer support
- Maintain and improve Service performance

### 2.2 Personalization and Improvement
- Customize user experience
- Develop new features
- Improve AI model accuracy
- Analyze usage patterns for optimization

### 2.3 Communication
- Send service-related notifications
- Provide customer support
- Send marketing communications (with consent)
- Deliver security alerts and updates

### 2.4 Legal and Security
- Comply with legal obligations
- Detect and prevent fraud
- Enforce our Terms of Service
- Protect rights and safety

### 2.5 Analytics and Research
- Generate aggregated statistics
- Conduct service analytics
- Perform market research
- Monitor system health and performance

## 3. Legal Basis for Processing

We process personal data under the following legal bases:

### 3.1 Contract Performance
Processing necessary to provide the Service you've contracted for.

### 3.2 Legitimate Interests
Processing for our legitimate business interests, including:
- Service improvement and development
- Fraud prevention and security
- Direct marketing (with opt-out option)

### 3.3 Consent
Where you've given explicit consent, particularly for:
- Marketing communications
- Cookie placement
- Special category data processing

### 3.4 Legal Obligations
Processing necessary to comply with laws, including:
- Tax and accounting requirements
- Law enforcement requests
- Court orders

## 4. Data Storage and Security

### 4.1 Security Measures

We implement comprehensive security measures:

**Technical Safeguards:**
- AES-256 encryption for sensitive data at rest
- TLS 1.3 for data in transit
- Multi-factor authentication available
- Regular security audits and penetration testing
- Isolated tenant environments (Row Level Security)

**Organizational Safeguards:**
- Access controls and principle of least privilege
- Regular security training for staff
- Data processing agreements with sub-processors
- Incident response procedures

Reference: See [Security Model Documentation](../SECURITY_MODEL.md)

### 4.2 Data Location
- Primary data storage: Cloud infrastructure providers
- Backup locations: Geographically distributed
- Content Delivery Networks for static assets

### 4.3 Infrastructure Security
- Regular security patches and updates
- Firewall and intrusion detection systems
- DDoS protection
- Regular vulnerability assessments

## 5. Data Sharing and Disclosure

We do not sell personal data. We may share information in these circumstances:

### 5.1 Service Providers
With trusted third parties who assist in operating our Service:
- Cloud hosting providers
- Payment processors
- Analytics services
- Customer support tools

All service providers are bound by data processing agreements.

### 5.2 Business Transfers
In connection with any merger, sale of company assets, financing, or acquisition.

### 5.3 Legal Requirements
When required by law or to:
- Comply with legal processes
- Protect our rights and property
- Prevent fraud or security issues
- Protect safety of any person

### 5.4 Consent
With your explicit consent for specific purposes.

### 5.5 Aggregated Data
We may share anonymized, aggregated data that cannot identify individuals.

## 6. User Rights

### 6.1 GDPR Rights (EU/UK Residents)

You have the right to:

**Access:** Request a copy of your personal data
**Rectification:** Correct inaccurate data
**Erasure:** Request deletion ("right to be forgotten")
**Portability:** Receive data in a portable format
**Restriction:** Limit processing of your data
**Objection:** Object to certain processing
**Automated Decision-Making:** Not be subject to purely automated decisions

**How to Exercise Rights:**
- Via API: `/api/gdpr/request` endpoint
- Via API: `/api/privacy/export` for data export
- Via API: `/api/privacy/delete` for data deletion
- Email: privacy@[your-domain]

Reference: [GDPR Compliance Documentation](../02-GUIDES/GUIDE_PRIVACY_COMPLIANCE.md)

### 6.2 CCPA Rights (California Residents)

You have the right to:

**Know:** What personal information we collect, use, and share
**Delete:** Request deletion of personal information
**Opt-Out:** Opt-out of sale (we do not sell personal information)
**Non-Discrimination:** Equal service regardless of rights exercise

**How to Exercise Rights:**
- Via API: `/api/privacy/ccpa/request`
- Toll-free: 1-800-XXX-XXXX
- Email: privacy@[your-domain]

### 6.3 Response Timeline
- Acknowledgment: Within 48 hours
- Response: Within 30 days (may extend to 60 days with notice)
- No fee for first request in 12-month period

## 7. Cookies and Tracking Technologies

### 7.1 Types of Cookies We Use

**Essential Cookies:**
- Session management
- Security tokens
- User preferences
- Load balancing

**Analytics Cookies:**
- Usage patterns
- Feature adoption
- Performance metrics
- Error tracking

**Preference Cookies:**
- Language settings
- UI customization
- Timezone preferences

### 7.2 Chat Widget Cookies
The embedded chat widget uses:
- Session identifiers
- User identification (if provided)
- Conversation state
- Performance monitoring

### 7.3 Cookie Management
- Browser settings to block/delete cookies
- Cookie preference center on our website
- Opt-out of analytics cookies
- Do Not Track signal recognition

For details, see [Cookie Policy](./COOKIE_POLICY.md)

## 8. Data Retention

### 8.1 Retention Periods

We retain data for different periods based on purpose:

**Active Account Data:**
- Retained while account is active
- Plus legal requirement period

**Chat Conversations:**
- Default: 90 days (configurable by customer)
- Anonymized after retention period
- Immediate deletion upon request

**Scraped Content:**
- Updated on regular scraping schedule
- Retained while customer account active
- Deleted 30 days after account termination

**Analytics Data:**
- Aggregated: Indefinitely
- Individual: 2 years
- Anonymized after retention period

**Backup Data:**
- 30-day rolling backup window
- Point-in-time recovery available

### 8.2 Deletion Procedures
- Automated deletion after retention period
- Manual deletion via privacy APIs
- Secure overwriting procedures
- Certificate of deletion available

## 9. International Data Transfers

### 9.1 Transfer Mechanisms
For international data transfers, we use:
- Standard Contractual Clauses (SCCs)
- Adequacy decisions where applicable
- Appropriate safeguards per GDPR Article 46

### 9.2 Data Localization
- Option for data residency requirements
- Regional data storage available
- Enterprise customers can specify storage location

## 10. Children's Privacy

### 10.1 Age Restrictions
- Service not intended for children under 16
- No knowing collection of children's data
- Immediate deletion if discovered

### 10.2 Parental Rights
If we learn we've collected data from a child:
- Immediate notification to account holder
- Deletion of child's data
- Prevention of future collection

## 11. Third-Party Services

### 11.1 Integrated Services
Our Service integrates with:
- OpenAI (AI processing)
- WooCommerce (e-commerce)
- Shopify (e-commerce)
- Supabase (database)
- Redis (caching)

Each has its own privacy policy.

### 11.2 Customer Integrations
Customers may connect their own services:
- We process data as directed
- Customer responsible for third-party compliance
- We provide tools for privacy management

## 12. Privacy by Design

### 12.1 Built-in Privacy Features
- Encryption by default
- Data minimization principles
- Privacy-preserving analytics
- Configurable retention periods
- Granular access controls

### 12.2 Privacy APIs
Available endpoints for privacy management:
- `/api/gdpr/` - GDPR compliance tools
- `/api/privacy/export` - Data portability
- `/api/privacy/delete` - Right to erasure
- `/api/privacy/consent` - Consent management

### 12.3 Transparency Tools
- Privacy dashboard for users
- Data flow diagrams
- Processing activity records
- Audit logs

## 13. Data Breach Procedures

### 13.1 Incident Response
In case of a data breach:
- Immediate containment and investigation
- Assessment of impact and affected data
- Notification within 72 hours (where required)
- Detailed incident report

### 13.2 User Notification
Affected users will receive:
- Nature of the breach
- Types of data affected
- Measures taken
- Recommended actions
- Contact for questions

### 13.3 Prevention Measures
- Regular security assessments
- Employee training
- Incident response drills
- Continuous monitoring

## 14. Changes to Privacy Policy

### 14.1 Notification of Changes
- Email notification for material changes
- 30-day notice period
- Prominent website notice
- Version history maintained

### 14.2 Consent for Material Changes
- May require renewed consent
- Option to export data before changes
- Account closure option

## 15. Contact Information

### Data Protection Officer
Email: dpo@[your-domain]
Address: [Company Address]

### Privacy Inquiries
Email: privacy@[your-domain]
Phone: 1-800-XXX-XXXX
Portal: [privacy-portal-url]

### Supervisory Authority
You may lodge a complaint with your local data protection authority:
- EU: Your national DPA
- UK: Information Commissioner's Office (ICO)
- California: California Attorney General

### Response Commitment
- Acknowledgment: Within 48 hours
- Initial response: Within 7 business days
- Resolution target: Within 30 days

---

**Document Version History:**
- v1.0.0 (2025-01-01): Initial release

**Related Documents:**
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [Cookie Policy](./COOKIE_POLICY.md)
- [Data Processing Agreement](./DPA_TEMPLATE.md)
- [Security Documentation](../SECURITY_MODEL.md)
- [GDPR Compliance Guide](../02-GUIDES/GUIDE_PRIVACY_COMPLIANCE.md)