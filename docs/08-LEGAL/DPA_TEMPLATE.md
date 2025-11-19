# Data Processing Agreement (DPA) Template

**Type:** Legal Document Template
**Status:** Active
**Last Updated:** 2025-11-18
**Version:** v1.0.0
**Purpose:** Standard DPA template for B2B customers requiring GDPR compliance documentation

---

# DATA PROCESSING AGREEMENT

This Data Processing Agreement ("DPA") forms part of the Agreement for OmniOps Services (the "Principal Agreement") between:

**Data Controller:**
Company: _______________________
Address: _______________________
Contact: _______________________
("Customer" or "Controller")

**Data Processor:**
Company: OmniOps
Address: _______________________
Contact: dpo@[your-domain]
("Processor" or "OmniOps")

Each a "Party"; together the "Parties"

**Effective Date:** _______________________

## Table of Contents

- [1. Definitions](#1-definitions)
- [2. Scope and Purpose](#2-scope-and-purpose)
- [3. Processor Obligations](#3-processor-obligations)
- [4. Controller Obligations](#4-controller-obligations)
- [5. Security Measures](#5-security-measures)
- [6. Sub-processors](#6-sub-processors)
- [7. Data Subject Rights](#7-data-subject-rights)
- [8. Data Breaches](#8-data-breaches)
- [9. Data Transfers](#9-data-transfers)
- [10. Audit Rights](#10-audit-rights)
- [11. Data Return and Deletion](#11-data-return-and-deletion)
- [12. Liability and Indemnification](#12-liability-and-indemnification)
- [13. Term and Termination](#13-term-and-termination)
- [14. General Provisions](#14-general-provisions)
- [Annex 1: Processing Details](#annex-1-processing-details)
- [Annex 2: Technical and Organizational Measures](#annex-2-technical-and-organizational-measures)
- [Annex 3: Approved Sub-processors](#annex-3-approved-sub-processors)

---

## 1. Definitions

### 1.1 GDPR Definitions
Terms not defined herein shall have the meanings given in the EU General Data Protection Regulation 2016/679 ("GDPR").

### 1.2 Agreement Definitions
- **"Agreement"**: The Principal Agreement and this DPA
- **"Services"**: OmniOps AI-powered chat widget platform
- **"Personal Data"**: Any data processed under this Agreement relating to identified or identifiable natural persons
- **"Processing"**: Any operation performed on Personal Data
- **"Data Subject"**: Individual to whom Personal Data relates
- **"Sub-processor"**: Third party engaged by Processor to process Personal Data

## 2. Scope and Purpose

### 2.1 Application
This DPA applies to all Processing of Personal Data by Processor on behalf of Controller in connection with the Services.

### 2.2 Purpose of Processing
Processor shall Process Personal Data only to provide the Services as described in the Principal Agreement and Annex 1.

### 2.3 Relationship of Parties
The Parties acknowledge that:
- Controller is the Data Controller
- Processor is the Data Processor
- Controller determines purposes and means of Processing
- Processor acts only on Controller's documented instructions

## 3. Processor Obligations

### 3.1 Compliance
Processor shall:
- Process Personal Data only on documented instructions from Controller
- Ensure compliance with applicable data protection laws
- Not Process Personal Data for its own purposes
- Notify Controller if instructions appear to violate applicable law

### 3.2 Confidentiality
Processor shall:
- Ensure persons authorized to Process Personal Data are bound by confidentiality
- Maintain confidentiality of all Personal Data
- Not disclose Personal Data except as required by this Agreement or law

### 3.3 Personnel
Processor shall:
- Limit access to Personal Data to authorized personnel only
- Ensure personnel are informed of confidential nature of Personal Data
- Provide appropriate training on data protection
- Take appropriate action against personnel violating this DPA

### 3.4 Records
Processor shall maintain records of Processing activities as required by Article 30 GDPR.

## 4. Controller Obligations

### 4.1 Lawful Instructions
Controller shall:
- Ensure instructions comply with applicable laws
- Have legal basis for Processing
- Obtain necessary consents from Data Subjects
- Comply with its obligations under GDPR

### 4.2 Accuracy
Controller is responsible for accuracy of Personal Data provided to Processor.

### 4.3 Necessary Rights
Controller warrants it has all necessary rights to provide Personal Data to Processor for Processing.

## 5. Security Measures

### 5.1 Technical and Organizational Measures
Processor shall implement and maintain the security measures described in Annex 2, including:
- Encryption of Personal Data at rest and in transit
- Access controls and authentication
- Regular security assessments
- Incident response procedures
- Business continuity planning

### 5.2 Security Standards
Processor shall maintain security measures that are:
- Appropriate to the risk
- In accordance with Article 32 GDPR
- Industry standard or better
- Regularly reviewed and updated

### 5.3 Security Updates
Processor may update security measures provided:
- Overall security is not materially decreased
- Controller is notified of material changes
- Updates comply with applicable laws

Reference: See [Security Model Documentation](../SECURITY_MODEL.md) and [Customer Config Security](../02-GUIDES/GUIDE_CUSTOMER_CONFIG_SECURITY.md)

## 6. Sub-processors

### 6.1 Authorized Sub-processors
Controller authorizes Processor to engage Sub-processors listed in Annex 3.

### 6.2 New Sub-processors
Processor shall:
- Notify Controller of intended changes to Sub-processors
- Provide 30 days notice before engaging new Sub-processors
- Give Controller opportunity to object
- Ensure Sub-processors are bound by equivalent obligations

### 6.3 Controller Objection
If Controller reasonably objects to new Sub-processor:
- Parties shall discuss in good faith
- Processor may offer alternative Sub-processor
- Controller may terminate affected Services

### 6.4 Liability for Sub-processors
Processor remains fully liable for Sub-processors' performance.

## 7. Data Subject Rights

### 7.1 Assistance
Processor shall assist Controller in responding to Data Subject requests regarding:
- Access to Personal Data
- Rectification or erasure
- Data portability
- Restriction or objection to Processing
- Not being subject to automated decision-making

### 7.2 Technical Capabilities
Processor provides the following tools for Data Subject rights:
- API endpoints for data access and export (`/api/gdpr/`, `/api/privacy/export`)
- Deletion capabilities (`/api/privacy/delete`)
- Consent management tools
- Privacy dashboard for Data Subjects

### 7.3 Response Timeline
Processor shall:
- Forward Data Subject requests to Controller within 2 business days
- Provide assistance within timeframes required by law
- Not respond directly to Data Subjects unless authorized

## 8. Data Breaches

### 8.1 Notification
Upon becoming aware of a Personal Data Breach, Processor shall:
- Notify Controller without undue delay
- Provide notification within 48 hours where feasible
- Include all available information about the breach

### 8.2 Breach Information
Notification shall include:
- Nature of the breach
- Categories and approximate number of Data Subjects affected
- Categories and approximate number of records affected
- Likely consequences
- Measures taken or proposed

### 8.3 Cooperation
Processor shall:
- Cooperate with Controller's investigation
- Take reasonable steps to mitigate effects
- Document all breaches
- Not publicly disclose breach without Controller approval

## 9. Data Transfers

### 9.1 Transfer Mechanisms
For transfers outside EEA, Processor shall ensure:
- Appropriate safeguards under Article 46 GDPR
- Standard Contractual Clauses where applicable
- Adequacy decisions where available
- Controller approval for transfers

### 9.2 Transfer Records
Processor shall maintain records of:
- Countries where Personal Data is Processed
- Transfer mechanisms used
- Safeguards implemented

## 10. Audit Rights

### 10.1 Information Rights
Processor shall make available to Controller all information necessary to demonstrate compliance.

### 10.2 Audits
Controller may conduct audits:
- Once per year with 30 days notice
- Using independent third-party auditor
- During business hours
- At Controller's expense

### 10.3 Audit Scope
Audits shall:
- Be limited to Personal Data Processing
- Respect Processor's confidentiality obligations
- Not unreasonably disrupt operations
- Follow Processor's security policies

### 10.4 Certifications
Processor may provide certifications or audit reports in lieu of on-site audits.

## 11. Data Return and Deletion

### 11.1 Upon Termination
On termination of Services, Processor shall:
- At Controller's option, delete or return all Personal Data
- Provide data in commonly used format
- Delete existing copies unless law requires storage
- Certify deletion upon request

### 11.2 Retention Period
Processor may retain Personal Data for:
- 30 days after termination for data return
- Longer if required by law
- Backup retention per documented policies

### 11.3 Data Export Tools
Processor provides:
- Bulk export capabilities
- API-based data retrieval
- Standard format exports (JSON, CSV)

## 12. Liability and Indemnification

### 12.1 Liability Caps
Each Party's liability is subject to limitations in the Principal Agreement.

### 12.2 Indemnification
Each Party shall indemnify the other against:
- Regulatory fines due to that Party's violation
- Third-party claims arising from that Party's breach
- Costs and damages from that Party's non-compliance

### 12.3 Exclusions
No liability for:
- Consequential or indirect damages
- Loss of profits or revenue
- Unless caused by gross negligence or willful misconduct

## 13. Term and Termination

### 13.1 Duration
This DPA shall:
- Commence on the Effective Date
- Continue while Personal Data is Processed
- Survive termination for obligations relating to existing data

### 13.2 Termination Rights
Either Party may terminate if:
- Other Party materially breaches and fails to cure
- Processing becomes unlawful
- Required by supervisory authority

### 13.3 Effect of Termination
Upon termination:
- Processing shall cease
- Data return/deletion per Section 11
- Confidentiality obligations survive

## 14. General Provisions

### 14.1 Governing Law
This DPA is governed by laws of [Jurisdiction].

### 14.2 Severability
Invalid provisions shall not affect validity of remainder.

### 14.3 Entire Agreement
This DPA and Principal Agreement constitute entire agreement regarding Processing.

### 14.4 Amendment
Amendments must be in writing and signed by both Parties.

### 14.5 Order of Precedence
In case of conflict:
1. This DPA
2. Principal Agreement
3. Other agreements

---

## Annex 1: Processing Details

### A1.1 Subject Matter
Processing of Personal Data in connection with OmniOps AI-powered chat widget services.

### A1.2 Duration
For the term of the Principal Agreement plus any retention period.

### A1.3 Nature and Purpose
- **Nature**: Collection, storage, analysis, retrieval, deletion
- **Purpose**: Providing AI-powered customer service chat functionality

### A1.4 Categories of Personal Data
- Contact information (name, email)
- Chat conversation data
- User behavior and preferences
- Technical data (IP addresses, device info)
- Business information from website scraping
- E-commerce transaction data (if applicable)

### A1.5 Categories of Data Subjects
- Customer's employees and users
- Customer's website visitors
- Customer's customers (end-users)
- Prospects and leads

### A1.6 Processing Operations
- Chat conversation processing
- AI model training (anonymized)
- Website content scraping and indexing
- Analytics and reporting
- Security monitoring
- Customer support

---

## Annex 2: Technical and Organizational Measures

### A2.1 Access Controls
- Multi-factor authentication
- Role-based access control
- Principle of least privilege
- Regular access reviews

### A2.2 Encryption
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Key management procedures
- Encrypted backups

### A2.3 System Security
- Firewalls and network segmentation
- Intrusion detection/prevention
- Regular security patches
- Vulnerability scanning

### A2.4 Operational Security
- Change management procedures
- Logging and monitoring
- Incident response plan
- Business continuity plan

### A2.5 Physical Security
- Data center security controls
- Access restrictions
- Environmental controls
- Secure disposal procedures

### A2.6 Organizational Measures
- Security training for staff
- Confidentiality agreements
- Data protection policies
- Regular security audits

Reference: [Security Model Documentation](../SECURITY_MODEL.md)

---

## Annex 3: Approved Sub-processors

### A3.1 Infrastructure Providers

| Name | Purpose | Location | Safeguards |
|------|---------|----------|------------|
| Cloud Provider | Infrastructure hosting | [Location] | SCCs, SOC2 |
| Supabase | Database services | Multi-region | SCCs, GDPR compliant |
| CDN Provider | Content delivery | Global | SCCs, Privacy Shield |

### A3.2 Service Providers

| Name | Purpose | Location | Safeguards |
|------|---------|----------|------------|
| OpenAI | AI processing | USA | SCCs, Data Processing Terms |
| Payment Processor | Payment handling | [Location] | PCI DSS, SCCs |
| Email Service | Transactional email | [Location] | SCCs, GDPR compliant |

### A3.3 Update Notifications
Updates to this list will be provided via:
- Email to designated contact
- Service dashboard notification
- 30 days advance notice

---

## Signature Page

**Data Controller:**

Signature: _______________________
Name: _______________________
Title: _______________________
Date: _______________________

**Data Processor (OmniOps):**

Signature: _______________________
Name: _______________________
Title: _______________________
Date: _______________________

---

**Document Version History:**
- v1.0.0 (2025-01-01): Initial template release

**Related Documents:**
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Security Model](../SECURITY_MODEL.md)
- [GDPR Compliance Guide](../02-GUIDES/GUIDE_PRIVACY_COMPLIANCE.md)