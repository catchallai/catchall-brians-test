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
- Examples: Audit logging, compliance scanning

### Webhook Automations
- Connector-based (OAuth integrations)
- Examples: Google Calendar events, Slack messages
- Real-time event handling
- Conditional routing to functions

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

const modules = [
  { name: 'CRM Core Module', description: 'Contacts, companies, deals, and activities' },
  { name: 'Sales Module', description: 'Pipeline, proposals, meetings, and quotas' },
  { name: 'Marketing Module', description: 'Campaigns, email marketing, and analytics' },
  { name: 'Customer Success Module', description: 'Health scores, onboarding, and feedback' },
  { name: 'SEO & Analytics Module', description: 'Keywords, backlinks, audits, and reporting' },
  { name: 'Social Media Module', description: 'Listening, calendar, competitor analysis' },
  { name: 'Project Management Module', description: 'Projects, tasks, timeline, and resources' },
  { name: 'Legal Module', description: 'Matters, litigation, IP, counsel, and entities' },
  { name: 'Compliance Module', description: 'Policies, audits, incidents, and risk register' },
  { name: 'HRIS Module', description: 'Employees, payroll, benefits, and talent' },
  { name: 'Finance Module', description: 'Transactions, budgets, forecasts, and equity' },
  { name: 'Data Rooms', description: 'Secure document sharing and access control' },
];

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
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-8 h-8" />
                  Complete CatchAll Documentation
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Detailed breakdown of every feature, use case, and business value
                </p>
              </div>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            Click on any section below to expand it and see all features, detailed descriptions, use cases, and business value.
          </p>

          {/* Modules List */}
          <div className="space-y-3">
            {modules.map((module) => (
              <button
                key={module.name}
                onClick={() => toggleModule(module.name)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {module.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules[module.name] ? 'rotate-90' : ''}`} />
              </button>
            ))}
          </div>

          {/* Platform Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 mt-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Platform Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Modules</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12+</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">integrated modules</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Features</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">50+</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">major features</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">100+</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">pages and workflows</p>
                </div>
              </div>
            </CardContent>
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