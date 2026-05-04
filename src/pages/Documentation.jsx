import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lock,
  FileText,
  Database,
  Server,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Download,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

const docs = [
  {
    section: 'SSO & Authentication',
    icon: Lock,
    items: [
      {
        title: 'SSO Configuration Guide',
        description: 'Step-by-step setup for SAML 2.0 and OIDC',
        content: `
# SSO Configuration Guide

## Supported Protocols
- **SAML 2.0** - Enterprise standard
- **OpenID Connect (OIDC)** - Modern OAuth 2.0 standard

## SAML Setup
1. Get metadata from your IdP (Okta, Azure AD, etc.)
2. Configure ACS URL: \`https://api.catchall.io/saml/acs\`
3. Entity ID: \`https://catchall.io\`
4. Use NameID format: \`emailAddress\`

## OIDC Setup
1. Obtain client ID and secret from IdP
2. Callback URL: \`https://app.catchall.io/auth/callback\`
3. Required scopes: \`openid profile email\`
4. Token endpoint used for access token exchange

## Test SSO
1. Navigate to https://app.catchall.io/auth/sso
2. Enter domain
3. Redirected to your IdP for authentication
        `,
      },
      {
        title: 'SCIM 2.0 User Provisioning',
        description: 'Automated user lifecycle management',
        content: `
# SCIM 2.0 User Provisioning

## Overview
SCIM automates user provisioning from your identity provider.

## Base URL
\`https://api.catchall.io/scim\`

## Authentication
All requests require Bearer token:
\`Authorization: Bearer <your_scim_token>\`

## Supported Operations

### Create User
\`\`\`
POST /scim/Users
Content-Type: application/json

{
  "userName": "user@company.com",
  "displayName": "John Doe",
  "name": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "active": true,
  "roles": ["user", "admin"]
}
\`\`\`

### Update User
\`\`\`
PATCH /scim/Users/{id}
Content-Type: application/json

{
  "Operations": [
    {
      "op": "replace",
      "path": "active",
      "value": false
    }
  ]
}
\`\`\`

### Deactivate User
\`\`\`
DELETE /scim/Users/{id}
\`\`\`

## Configuration in Identity Providers

### Okta
1. Applications → Add App
2. Select SCIM 2.0 Test App
3. Configure base URL and auth token
4. Map attributes

### Azure AD
1. Enterprise Applications → New Application
2. Select Provisioning
3. Configure API endpoint
4. Set up attribute mappings

### Google Workspace
Coming soon...
        `,
      },
    ],
  },
  {
    section: 'Audit & Logging',
    icon: FileText,
    items: [
      {
        title: 'Audit Log Infrastructure',
        description: 'Immutable, tamper-evident audit trail',
        content: `
# Audit Log Infrastructure

## Overview
All user actions are logged immutably with cryptographic chain-of-custody.

## Tamper Detection
- SHA-256 hash chain: each log entry hashes the previous
- Detected modifications trigger alerts
- Append-only at database layer (no updates/deletes)

## Logged Events
- User login/logout
- Data access/modification
- Permission changes
- Admin actions
- Security events

## Query Audit Logs
\`GET https://api.catchall.io/audit-logs?actor=user@company.com&type=data_modify\`

## Compliance Queries
- SOC 2: Last 7 days of authentication events
- HIPAA: All PHI access with timestamp
- CMMC: All system configuration changes
        `,
      },
      {
        title: 'Disaster Recovery Plan',
        description: 'Recovery procedures and RTO/RPO',
        content: `
# Disaster Recovery Plan

## RTO & RPO
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour

## Backup Strategy
- Daily full backups (encrypted)
- Hourly incremental backups
- Backup retention: 30 days
- Offsite storage in separate region

## Recovery Procedures

### Database Recovery
1. Identify failed database
2. Restore from latest backup
3. Apply transaction logs
4. Verify data integrity
5. Failover to replica

### Application Recovery
1. Spin up new instances
2. Restore configuration
3. Point to replicated database
4. Run smoke tests
5. Update DNS

### Testing Schedule
- Quarterly DR drills
- Annual full failover test
- Monthly backup restoration test
        `,
      },
    ],
  },
  {
    section: 'Infrastructure & Security',
    icon: Server,
    items: [
      {
        title: 'Uptime SLA',
        description: '99.9% minimum availability guarantee',
        content: `
# Uptime SLA

## Commitment
Catchall commits to 99.9% uptime measured monthly.

## Calculation
Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes × 100

## Exclusions
- Planned maintenance (72-hour notice)
- Customer-caused issues
- DDoS attacks
- Third-party service failures

## Credits
If uptime falls below 99.9%:
- 99.0–99.8%: 10% monthly credit
- 98.0–98.9%: 25% monthly credit
- Below 98.0%: 50% monthly credit

## Support
File downtime claim within 30 days of incident.
        `,
      },
      {
        title: 'Data Encryption',
        description: 'Encryption at rest and in transit',
        content: `
# Data Encryption

## At Rest
- AES-256 encryption for all data
- Keys managed by AWS KMS
- Automatic key rotation (annual)
- Separate keys per customer

## In Transit
- TLS 1.3 minimum
- 2048-bit RSA certificates
- Perfect forward secrecy enabled
- HSTS headers enforced

## Key Management
- Master keys stored in HSM
- No plaintext keys in code
- Separate keys per environment
- Audit log for key access

## Optional: Customer-Managed Keys (BYOK)
1. Customer creates KMS key in their AWS account
2. Grant Catchall cross-account access
3. We use customer key for encryption
4. Customer controls key rotation/deletion
        `,
      },
    ],
  },
  {
    section: 'Whitelabel & SaaS',
    icon: Sparkles,
    items: [
      {
        title: 'Whitelabel Configuration',
        description: 'Customize branding and company settings for multi-tenant SaaS',
        content: `
# Whitelabel Configuration

## Overview
The whitelabel system allows complete customization of the platform for different organizations or industry verticals.

## Customizable Elements
- **Company Name**: Display custom organization name throughout the app
- **Logo**: Upload company logo that appears in sidebar and header
- **Primary Color**: Set brand color for UI accents and highlights
- **Tagline**: Add custom subtitle under company name
- **Support Email**: Set organization-specific support contact

## Features by Industry
The system dynamically adjusts based on industry selection:

### Aerospace
- Aerospace Scanner with aviation-specific intelligence
- Defense contractor network mapping
- Export compliance focus

### Manufacturing
- Supply chain tracking
- Equipment management
- Production compliance

### Finance
- Risk management enhanced
- Audit-focused configurations
- Regulatory reporting

### Healthcare
- HIPAA compliance emphasis
- Patient data handling
- Medical records management

### Defense
- CMMC compliance features
- Controlled unclassified information (CUI) handling
- Personnel security requirements

## Implementation
1. Go to Company Settings page
2. Configure company details (name, logo, color)
3. Select primary industry vertical
4. Save settings
5. Settings persist across all user sessions
        `,
      },
      {
        title: 'Industry-Specific Scanning',
        description: 'Automatically adjust scanner focus based on industry',
        content: `
# Industry-Specific Scanning

## Dynamic Scanner Configuration
The compliance evidence scanner and industry scanner adjust their focus based on your configured industry.

## Supported Industries
- Aerospace
- Manufacturing
- Defense
- Finance
- Healthcare
- Retail
- Technology
- Energy
- Telecommunications
- Transportation

## Scanner Behavior
- **Aerospace**: Detects aviation regulations, export controls, security clearances
- **Finance**: Focuses on financial disclosures, regulatory filings, audit requirements
- **Healthcare**: Emphasizes HIPAA, patient confidentiality, medical records
- **Defense**: Highlights CMMC requirements, classified information, personnel clearances
- **Manufacturing**: Tracks supply chains, equipment certifications, quality standards

## Evidence Scanning
When uploading compliance evidence:
1. Scanner detects industry context automatically
2. Highlights relevant risks for your industry
3. Suggests required documentation by framework
4. Flags missing compliance areas

## Custom Labels
Industry selection updates system labels:
- Sidebar navigation reflects industry focus
- Dashboard KPIs highlight industry metrics
- Help center links to industry-specific guidance
        `,
      },
    ],
  },
  {
    section: 'System Architecture & Design',
    icon: Database,
    items: [
      {
        title: 'Platform Architecture Overview',
        description: 'Multi-tenant SaaS architecture with modular design',
        content: `
# Platform Architecture Overview

## Core Components

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion

### Backend (Deno + Base44)
- **Runtime**: Deno Deploy for serverless functions
- **Database**: PostgreSQL with ORM
- **Authentication**: Token-based with session management
- **API Pattern**: RESTful endpoints

### Infrastructure
- **Hosting**: Multi-region cloud deployment
- **Database**: Primary + replicated read-only copies
- **CDN**: Global edge caching for static assets
- **Storage**: Encrypted file storage with versioning

## Multi-Tenant Design
- Single codebase, multiple isolated instances
- Row-level security (RLS) for data isolation
- Per-tenant configuration and customization
- Shared infrastructure, isolated databases

## Scalability
- Stateless backend services
- Horizontal auto-scaling
- Database connection pooling
- Caching layers (Redis)
        `,
      },
      {
        title: 'Entity-Driven Data Model',
        description: 'JSON Schema-based flexible data management',
        content: `
# Entity-Driven Data Model

## Entity System
All data is stored as JSON Schema-defined entities with:
- **Built-in Fields**: id, created_date, updated_date, created_by
- **Custom Fields**: Defined per entity in entities/{Name}.json
- **Validation**: Schema enforcement at database layer
- **Versioning**: Automatic change tracking

## Core Entities
- **Contact**: Companies and individuals with relationship tracking
- **Deal**: Sales opportunities with pipeline stages
- **ComplianceItem**: Compliance requirements and evidence
- **LegalDocument**: Contracts and legal records
- **HRISEmployee**: Employee profiles with payroll integration
- **FinanceTransaction**: Financial records across all departments
- **Vendor**: Suppliers and contractors with spend tracking

## Data Relationships
- Foreign keys via entity IDs
- Computed fields for aggregations
- Audit trail for all changes
- Soft deletes with is_deleted flag

## Extensibility
Add custom entities by creating:
\`src/entities/{EntityName}.json\` with JSON Schema

## Querying
\`\`\`javascript
// List entities
await base44.entities.Contact.list();

// Filter with conditions
await base44.entities.Deal.filter({status: 'won'});

// CRUD operations
await base44.entities.Contact.create(data);
await base44.entities.Contact.update(id, data);
await base44.entities.Contact.delete(id);
\`\`\`
        `,
      },
      {
        title: 'Backend Functions & Automations',
        description: 'Serverless functions with automation triggers',
        content: `
# Backend Functions & Automations

## Function Types

### Scheduled Functions
- Cron-based triggers (minutely to monthly)
- Examples: Daily digests, batch processing, cleanup
- Configuration: create_automation with schedule_type

### Entity Automations
- Triggered on create/update/delete events
- Access to old and new data
- Conditional firing with filter conditions
- Examples: Audit logging, compliance scanning, workflow execution

### Webhook Automations
- Connector-based (OAuth integrations)
- Examples: Google Calendar events, Slack messages, LinkedIn
- Real-time event handling
- Conditional routing to functions

## Active Backend Functions (selected)
- enrichCompanyData / enrichAllCompanies / enrichCompanyIntelligence
- sendResendEmail / sendCampaignEmail / sendContactEmail / sendTrackedEmail
- executeWorkflow / evaluateWorkflowTriggers
- checkDocuTraceAlerts / trackDocumentAccess
- analyzeFeedback / analyzeSEOOpportunities / analyzeBacklinkOpportunities
- autoPopulateCalendar / generateCalendarNotifications
- fetchGA4Data / fetchGSCData / fetchSemrushData / fetchAhrefsData
- generateProposalPdf / exportPitchDeckPDF / exportPitchDeckPPTX
- scimProvision / createAuditLog / seedDemoData

## Example Function
\`\`\`javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  const contacts = await base44.entities.Contact.list();
  return Response.json({ contacts });
});
\`\`\`

## Deployment
- Functions auto-deploy when saved
- Deno linting validation
- Service role access to all entities
- Timeout: 30 seconds per invocation
        `,
      },
    ],
  },
  {
    section: 'Compliance Frameworks',
    icon: Shield,
    items: [
      {
        title: 'SOC 2 Type II Readiness',
        description: 'Security, availability, processing integrity',
        content: `
# SOC 2 Type II Readiness

## Audit Timeline
- Q1 2026: Initial assessment
- Q2-Q3 2026: 6-month observation period
- Q4 2026: Audit completion

## Trust Service Criteria

### Security (CC)
- Access controls
- Cryptography
- Incident response
- Risk management

### Availability (A)
- Uptime SLA (99.9%)
- Disaster recovery
- Redundancy

### Processing Integrity (PI)
- Data accuracy
- Completeness
- Authorization

### Confidentiality (C)
- Data classification
- Encryption
- Access restrictions

## Required Evidence
- Policy documentation
- Audit logs
- Incident reports
- Risk assessments
- Training records
        `,
      },
      {
        title: 'CMMC Compliance',
        description: 'Cybersecurity Maturity Model Certification',
        content: `
# CMMC Compliance

## Levels Supported
- **Level 1**: Basic security practices
- **Level 2**: Intermediate practices (default)
- **Level 3**: Advanced practices

## Level 2 Requirements (17 practices)
- Access control
- Asset management
- Awareness & training
- Configuration management
- Incident response
- Maintenance
- Media protection
- Personnel security
- Physical & environmental
- Risk assessment
- Security planning
- System & communications protection

## Audit Schedule
- Triennial for Level 1
- Biennial for Level 2
- Annual for Level 3

## C3PAO Assessment
Conducted by certified C3PAO assessor.
        `,
      },
    ],
  },
];

const completeSections = {
  crmCore: {
    title: 'CRM Core Module',
    color: 'violet',
    pages: [
      {
        name: 'Contacts',
        icon: '👥',
        description: 'Centralized contact database',
        whatItDoes: 'Manages all customer and prospect information in a single, searchable database with automatic data enrichment and deduplication.',
        howItWorks: 'Contacts can be added manually, imported via CSV, auto-created from web forms, or synced from integrations. System enriches data from LinkedIn and company websites. Contacts link to Companies and Deals for relationship mapping.',
        useCases: ["Never lose a prospect's information or history", 'Prevent duplicate outreach efforts', 'Quick access to decision-maker contact info', 'Automatic enrichment saves manual research time', 'Track multi-person relationships within accounts'],
        businessValue: 'Saves 5+ hours per week per sales rep on data entry and research. Prevents duplicate contacts which typically cost 15-20% of outreach budget.',
      },
      {
        name: 'Companies',
        icon: '🏢',
        description: 'Organization profiles and relationships',
        whatItDoes: 'Maintains comprehensive organization information including industry, size, funding, news, and relationships with other companies.',
        howItWorks: 'Create companies manually or auto-populate from contact company fields. AI enrichment pulls intelligence from multiple sources. News feeds update daily. Relationships tracked for ecosystem mapping.',
        useCases: ['Identify company growth and funding signals', 'Track industry trends affecting target accounts', 'Discover partnership and competitor relationships', 'Understand organizational hierarchy and decision makers', 'Monitor company news for sales opportunities'],
        businessValue: 'Provides context that enables 30% higher win rates on complex deals. News alerts trigger proactive outreach at key moments.',
      },
      {
        name: 'Deals/Opportunities',
        icon: '🎯',
        description: 'Sales pipeline and revenue tracking',
        whatItDoes: 'Tracks all sales opportunities through multiple pipeline stages with probability-weighted revenue forecasting and automation.',
        howItWorks: 'Deals created manually or auto-generated from opportunities. Drag-and-drop Kanban board for pipeline management. Status changes trigger automation rules. Probability calculations based on historical win rates.',
        useCases: ['Single source of truth for sales pipeline', 'Accurate revenue forecasting by deal stage', 'Identify early warning signs of deal slippage', 'Automate follow-ups so nothing falls through cracks', 'Analyze win/loss patterns to improve sales process'],
        businessValue: 'Improve forecast accuracy by 25-30%. Reduce sales cycle by 20% through better pipeline visibility and automation.',
      },
      {
        name: 'Activities',
        icon: '📞',
        description: 'Interaction and engagement tracking',
        whatItDoes: 'Complete audit trail of all customer interactions including emails, calls, meetings, and follow-ups with automatic tracking.',
        howItWorks: 'Activities logged automatically or manually created. Email tracking uses pixel technology. Calendar integration syncs with Google/Outlook. Activity history used for lead scoring and analytics.',
        useCases: ['Prevent lost follow-ups when team members leave', 'Track all customer communication in one place', 'Measure sales rep productivity and activity levels', 'Identify best practices by analyzing top performers', 'Trigger automations based on customer engagement'],
        businessValue: "Reduce lost opportunities by 40% from better handoffs. Identify top performers' tactics and replicate across team.",
      },
    ],
  },
  sales: {
    title: 'Sales Module',
    color: 'emerald',
    pages: [
      {
        name: 'Sales Sequences',
        icon: '📧',
        description: 'Automated multi-touch outreach campaigns',
        whatItDoes: 'Create automated email sequences with delays, conditions, and personalization that nurture leads systematically without manual effort.',
        howItWorks: 'Define sequence template with email steps and timing. Set enrollment criteria. System automatically enrolls matching leads. Each step sends based on delays/triggers. Engagement metrics tracked for optimization.',
        useCases: ['Automate lead nurturing at scale', 'Ensure consistent follow-up cadence', 'Test different messaging and timing', 'Track which sequences convert best', 'Free up sales reps to focus on high-touch deals'],
        businessValue: 'Increase pipeline by 40-50% by nurturing more leads simultaneously. Convert 15-20% more leads through consistent follow-up.',
      },
      {
        name: 'Proposals & Quotes',
        icon: '📄',
        description: 'Professional proposal creation and tracking',
        whatItDoes: 'Create branded proposals with pricing, send digitally, track views, and collect e-signatures with seamless CRM integration.',
        howItWorks: 'Select template, populate with deal details and line items (auto-priced), route through approvals, send with tracking link, monitor views and signature status.',
        useCases: ['Reduce proposal creation time from hours to minutes', 'Know immediately when prospects view proposals', 'Identify objections based on which sections they review', 'Legally binding signatures without printing', "Automated follow-ups when prospects view but don't sign"],
        businessValue: 'Accelerate deal closure by 3-5 days through faster turnarounds. Increase close rates by 15-20% through timely follow-ups.',
      },
      {
        name: 'Meeting Scheduler',
        icon: '📅',
        description: 'Frictionless meeting booking',
        whatItDoes: 'Enable prospects to self-schedule meetings from a booking link with automatic calendar syncing and timezone handling.',
        howItWorks: 'Create availability in calendar, share booking link, prospects select time (auto-adjusts timezone), calendar invite and video link generated automatically.',
        useCases: ['Eliminate back-and-forth scheduling emails', 'Reduce time-zone confusion and no-shows', 'Scale one-on-one meetings without hiring calendar coordinators', 'Automatic CRM record creation for every meeting', 'Built-in video conferencing eliminates tool switching'],
        businessValue: 'Save 5+ hours per week on scheduling. Increase meeting attendance by 10-15% through convenience.',
      },
    ],
  },
  marketing: {
    title: 'Marketing Module',
    color: 'blue',
    pages: [
      {
        name: 'Email Campaigns',
        icon: '📬',
        description: 'Segmented email marketing at scale',
        whatItDoes: 'Build and execute email campaigns with segmentation, personalization, A/B testing, and comprehensive analytics.',
        howItWorks: 'Design email in template builder, segment audience using rules, A/B test variants, schedule delivery with timezone optimization, monitor opens/clicks in real-time.',
        useCases: ['Reach right audience with relevant messaging', 'Test and optimize email performance', 'Track ROI of email marketing campaigns', 'Maintain compliance with email regulations', 'Nurture leads through automated sequences'],
        businessValue: 'Increase email open rates by 25-35% through segmentation. Improve click rates by 40-50% through A/B testing and personalization.',
      },
      {
        name: 'Lead Scoring',
        icon: '⭐',
        description: 'Lead qualification automation',
        whatItDoes: 'Automatically score leads based on engagement and demographics to identify sales-ready prospects.',
        howItWorks: 'Define scoring rules (points for each behavior), system assigns points as behaviors occur, grade assigned based on total score, auto-route qualified leads to sales.',
        useCases: ['Know which leads are ready for sales conversation', 'Prioritize sales rep time on hottest prospects', 'Prevent premature sales outreach', 'Measure content effectiveness by lead scores', 'Align sales and marketing on lead quality'],
        businessValue: 'Increase sales productivity by 25-30% by focusing on qualified leads. Improve sales/marketing alignment and reduce friction.',
      },
      {
        name: 'Landing Pages',
        icon: '🌐',
        description: 'Conversion-optimized page builder',
        whatItDoes: 'Create landing pages without coding, test variants, track conversions, and automatically integrate with CRM.',
        howItWorks: 'Select template or start blank, customize design, add forms with CRM auto-population, publish to custom domain, track performance and optimize.',
        useCases: ['Launch campaigns quickly without developer involvement', 'Test different messaging and design with A/B variants', 'Track conversion rates by campaign and page variant', 'Automatically populate forms with known contact data', 'Support multi-channel campaigns with unique landing pages'],
        businessValue: 'Reduce time-to-campaign from weeks to days. Increase conversion rates by 15-25% through continuous testing.',
      },
    ],
  },
  customerSuccess: {
    title: 'Customer Success Module',
    color: 'pink',
    pages: [
      {
        name: 'Customer Health Scoring',
        icon: '❤️',
        description: 'Churn prediction and retention',
        whatItDoes: 'Predict customer churn risk using multi-factor health scores and alert CSMs to at-risk accounts for intervention.',
        howItWorks: 'Configure health score formula, system pulls data from usage/support/billing, calculates daily health score, triggers alerts when score drops, CSM can view dashboard.',
        useCases: ['Identify at-risk customers before they churn', 'Prioritize CSM time on accounts most likely to churn', 'Measure customer health trends', 'Support proactive customer engagement', 'Improve customer retention metrics'],
        businessValue: 'Reduce churn rate by 15-25% through proactive intervention. Save 5-10% of revenue that would otherwise be lost.',
      },
      {
        name: 'Onboarding Tracking',
        icon: '🚀',
        description: 'Customer implementation management',
        whatItDoes: 'Manage customer onboarding workflows with task checklists, milestones, and success tracking.',
        howItWorks: 'Define onboarding workflow with tasks/timelines, assign to CSM and customer, track completion, collect feedback at milestones, identify bottlenecks.',
        useCases: ['Ensure every customer successfully implements', 'Reduce time-to-value for customers', 'Track CSM productivity and efficiency', 'Identify common onboarding issues for process improvement', 'Collect customer feedback on experience early'],
        businessValue: 'Reduce implementation time by 20-30%. Improve customer satisfaction and reduce early churn by 25-35%.',
      },
      {
        name: 'Renewal Management',
        icon: '🔄',
        description: 'Contract renewal tracking and forecasting',
        whatItDoes: 'Track renewal dates, predict renewal probability, and automate renewal workflows to maximize revenue retention.',
        howItWorks: 'Track contract end dates, flag 90 days before renewal, CSM initiates renewal conversation, track negotiation progress, prompt for expansion opportunities.',
        useCases: ['Never miss a renewal opportunity', 'Predict renewal revenue accurately', 'Identify expansion opportunities during renewals', 'Reduce renewal negotiations time', 'Support finance forecasting and planning'],
        businessValue: 'Achieve 95%+ renewal rates (vs. industry 80-85%). Increase expansion revenue by 15-20% during renewals.',
      },
    ],
  },
  seo: {
    title: 'SEO & Analytics Module',
    color: 'orange',
    pages: [
      {
        name: 'SEO Rankings',
        icon: '📍',
        description: 'Keyword ranking tracking and trends',
        whatItDoes: 'Track keyword positions daily, analyze trends, identify opportunities, and benchmark against competitors.',
        howItWorks: 'Configure keywords to track, system crawls search results daily, tracks position and changes, analyzes trends, identifies improvement opportunities.',
        useCases: ['Monitor organic search visibility', 'Identify keywords moving up/down', 'Validate SEO efforts are working', 'Find high-opportunity keywords', 'Benchmark performance vs. competitors'],
        businessValue: 'Achieve 50-100% more organic traffic through data-driven SEO optimization. Support content strategy with keyword insights.',
      },
      {
        name: 'Technical SEO Audits',
        icon: '🔍',
        description: 'Website health and technical optimization',
        whatItDoes: 'Crawl website, identify technical SEO issues, and provide prioritized recommendations for fixes.',
        howItWorks: 'Full site crawl, analyze technical health, generate issues report by severity, recommend fixes with guides, track implementation.',
        useCases: ['Ensure website is crawlable by search engines', 'Identify and fix performance issues', 'Improve Core Web Vitals for better rankings', 'Maintain mobile-friendly website', 'Support development team with priority fixes'],
        businessValue: 'Improve organic rankings by 15-25% through technical fixes. Reduce bounce rate by 20-30% through performance improvements.',
      },
    ],
  },
  social: {
    title: 'Social Media Module',
    color: 'cyan',
    pages: [
      {
        name: 'Social Scheduling',
        icon: '📱',
        description: 'Multi-platform content scheduling',
        whatItDoes: 'Schedule posts across all platforms with optimal timing, hashtags, and media management from single dashboard.',
        howItWorks: 'Create post in editor, add media/captions/hashtags, select platforms and time, system publishes automatically, tracks performance.',
        useCases: ['Maintain consistent posting schedule without manual effort', 'Optimize posting times for each platform', 'Create content once, repurpose across platforms', 'Prevent off-brand or accidental posts', 'Track which posts perform best'],
        businessValue: 'Maintain active social presence while reducing team time by 50-60%. Increase engagement by 25-35% through optimal timing.',
      },
      {
        name: 'Social Listening',
        icon: '👂',
        description: 'Brand mention monitoring and sentiment',
        whatItDoes: 'Monitor all mentions of brand, competitors, and keywords with sentiment analysis and crisis alerts.',
        howItWorks: 'Configure keywords to monitor, system scans 24/7, sentiment analyzed, alerts triggered for crises or spikes, trends tracked.',
        useCases: ['Detect brand mentions and press mentions immediately', 'Identify brand sentiment and emerging issues', 'Respond quickly to customer complaints', 'Monitor competitor mentions and brand perception', 'Find influencers discussing your brand'],
        businessValue: 'Prevent PR crises through early detection. Convert negative sentiment to positive through quick response.',
      },
    ],
  },
  projects: {
    title: 'Project Management Module',
    color: 'amber',
    pages: [
      {
        name: 'Project Planning',
        icon: '📋',
        description: 'Project scope and timeline management',
        whatItDoes: 'Create projects with phases, milestones, team allocation, and resource planning with visual timeline.',
        howItWorks: 'Create project from template, define phases/milestones, assign team members, set dependencies, track progress.',
        useCases: ['Plan project scope and timeline clearly', 'Allocate resources efficiently', 'Identify critical path and dependencies', 'Track project progress vs. plan', 'Support project delivery on time and budget'],
        businessValue: 'Deliver projects 15-25% faster through better planning. Reduce resource conflicts by 30-40%.',
      },
      {
        name: 'Task Management',
        icon: '✓',
        description: 'Work breakdown and tracking',
        whatItDoes: 'Break down projects into tasks, assign, track progress, and manage dependencies with notifications.',
        howItWorks: 'Create tasks with details, assign to team members, team updates status as they progress, manager views board, complete when done.',
        useCases: ['Break down work into manageable pieces', 'Ensure accountability for each task', 'Track progress and identify bottlenecks', 'Prevent tasks from falling through cracks', 'Support resource allocation'],
        businessValue: 'Improve on-time delivery by 20-30%. Increase team visibility and accountability.',
      },
    ],
  },
};

function SectionCollapsible({ section, isOpen, onToggle }) {
  const [expandedPage, setExpandedPage] = useState(null);

  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all bg-${section.color}-50 dark:bg-${section.color}-900/20 border-${section.color}-200 dark:border-${section.color}-700`}
      >
        <h3 className={`font-bold text-lg text-${section.color}-700 dark:text-${section.color}-300`}>
          {section.title}
        </h3>
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="space-y-2 pl-4">
          {section.pages.map((page, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPage(expandedPage === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{page.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">{page.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{page.description}</p>
                  </div>
                </div>
                {expandedPage === idx ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {expandedPage === idx && (
                <div className="p-4 bg-white dark:bg-gray-900 space-y-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">What It Does</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{page.whatItDoes}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">How It Works</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{page.howItWorks}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Business Use Cases</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {page.useCases.map((useCase, i) => (
                        <li key={i} className="flex gap-2">
                          <span>•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">💼 Business Value</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{page.businessValue}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Documentation() {
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleModule = (module) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <Tabs defaultValue="compliance" className="w-full">
        {/* Tab List */}
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Compliance & Security
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Complete Documentation
          </TabsTrigger>
        </TabsList>

        {/* Compliance & Security Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compliance & Security Documentation
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete guides for SSO, SCIM, audit logs, and compliance frameworks
            </p>
          </div>

          {/* Documentation Sections */}
          <div className="space-y-6">
            {docs.map((section) => {
              const SectionIcon = section.icon;
              const isExpanded = expandedSections[section.section];

              return (
                <div key={section.section} className="space-y-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.section)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <SectionIcon className="w-5 h-5 text-violet-600" />
                    <span className="font-semibold text-gray-900 dark:text-white flex-1">
                      {section.section}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {/* Section Items */}
                  {isExpanded && (
                    <div className="space-y-3 pl-4">
                      {section.items.map((item, idx) => (
                        <DocumentationCard key={idx} {...item} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Download Section */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mt-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Download Documentation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get PDF versions of all security and compliance documents
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    SOC 2 Overview (PDF)
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    SCIM Integration Guide (PDF)
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Disaster Recovery Plan (PDF)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complete Documentation Tab */}
        <TabsContent value="complete" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-8 h-8" />
                Complete CatchAll Documentation
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Detailed breakdown of every feature, use case, and business value
              </p>
            </div>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          <Card className="p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Click on any section below to expand it and see all features, detailed descriptions, use cases, and business value.
            </p>
            <div className="space-y-3">
              {Object.entries(completeSections).map(([key, section]) => (
                <SectionCollapsible
                  key={key}
                  section={section}
                  isOpen={expandedModules[key] || false}
                  onToggle={() => toggleModule(key)}
                />
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">📊 Platform Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Modules</p>
                <p className="text-gray-600 dark:text-gray-400">7+ integrated modules</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Features</p>
                <p className="text-gray-600 dark:text-gray-400">50+ major features</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Coverage</p>
                <p className="text-gray-600 dark:text-gray-400">100+ pages and workflows</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentationCard({ title, description, content }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-l-4 border-l-violet-500">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          </div>
          <Badge variant="outline">Docs</Badge>
        </div>
      </button>

      {isOpen && (
        <CardContent className="pt-0 border-t border-gray-200 dark:border-gray-700">
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
              <code>{content}</code>
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}