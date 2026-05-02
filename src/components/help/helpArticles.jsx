export const DEFAULT_ARTICLES = [
  // Getting Started
  {
    id: 'welcome',
    title: 'Welcome to CatchAll Business Suite',
    category: 'getting_started',
    type: 'guide',
    is_featured: true,
    order: 1,
    tags: ['introduction', 'overview', 'basics'],
    content: `# Welcome to CatchAll Business Suite

Your all-in-one platform for managing customer relationships, SEO, social media, marketing, legal, compliance, HRIS, and more.

## What Can You Do With CatchAll?

### 🎯 CRM & Sales
- **Contacts & Companies**: Store and organize all your business relationships
- **Deal Pipeline**: Track opportunities from lead to close
- **Activities**: Log calls, emails, meetings, and tasks
- **Contact Forms**: Capture leads from your website

### 📊 SEO & Analytics
- **Website Monitoring**: Track your site's SEO health score
- **Keyword Tracking**: Monitor search rankings
- **Backlink Analysis**: Discover and manage your backlink profile
- **Technical Audits**: Find and fix SEO issues
- **Traffic Analytics**: Understand your website visitors with AI insights

### 📱 Social Media Management
- **Social Listening**: Monitor brand mentions across platforms
- **Content Calendar**: Plan and schedule posts
- **Competitor Analysis**: Track what competitors are doing
- **Engagement Analytics**: Measure your social performance
- **AI Predictions**: Forecast trends and optimal posting times

### ⚖️ Legal Module
- **Matters**: Track all legal cases and matters
- **Litigation**: Manage active lawsuits and disputes
- **Intellectual Property**: Track patents, trademarks, copyrights
- **Obligations**: Monitor regulatory and contractual obligations
- **Counsel**: Manage internal and external legal counsel
- **Legal Entities**: Track corporate structure and subsidiaries

### 🛡️ Compliance
- **Policies**: Manage and distribute compliance policies
- **Audits**: Schedule and track internal/external audits
- **Risk Register**: Identify and mitigate compliance risks
- **Incidents**: Report and investigate compliance incidents
- **Export Control**: Manage EAR/ITAR obligations

### 👥 HRIS & People Operations
- **Employees**: Full employee profiles and lifecycle management
- **Payroll**: Track payroll runs and compensation
- **Time Off**: Manage PTO requests and balances
- **Benefits**: Administer benefits enrollment
- **Onboarding/Offboarding**: Structured workflows for hire and exit
- **Performance**: Goals, reviews, and career development
- **Talent**: Training, mentorships, internships, skills

### 💼 Business Development
- **Pitch Decks**: AI-generated and analyzed pitch decks
- **Data Rooms**: Secure document sharing for due diligence
- **DocuTrace**: Track document opens and engagement
- **Aerospace Scanner**: Intelligence on aerospace & defense companies
- **DMCA Takedowns**: Generate takedown and cease & desist letters

### 💰 Finance & Assets
- **Equity**: Manage equity pools, grants, and vesting
- **Equipment Inventory**: Track physical assets
- **Accounting Dashboard**: Monitor financials

## Need Help?
- Browse articles by category using the sidebar
- Use the search bar to find specific topics
- Check the FAQ for common questions`,
  },
  {
    id: 'quick-start',
    title: 'Quick Start Guide',
    category: 'getting_started',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['setup', 'first steps', 'beginner'],
    content: `# Quick Start Guide

Get up and running in just a few minutes.

## Step 1: Add Your First Contact

1. Click **Contacts** in the sidebar
2. Click the **Add Contact** button
3. Enter the contact's name and email
4. Set their status (Lead, Prospect, Customer)
5. Click **Save**

## Step 2: Create a Deal

1. Go to **Deals** in the sidebar
2. Click **Add Deal**
3. Enter a title and value
4. Link it to your contact
5. Set the deal stage
6. Click **Save**

## Step 3: Set Up Your Website for SEO

1. Navigate to **SEO Dashboard**
2. Click **Add Website**
3. Enter your website URL
4. Click **Save** - the system will analyze your site

## Step 4: Start Tracking Keywords

1. Go to **Keywords**
2. Click **Add Keyword**
3. Enter keywords you want to rank for
4. The system will track your positions

## Step 5: Set Up Social Listening

1. Go to **Social Listening**
2. Click **Add Keyword**
3. Enter your brand name or keywords to monitor
4. Click **Scan** to find mentions

## Step 6: Explore Legal & Compliance

1. Go to **Legal Dashboard** for an overview
2. Add a **Matter** to track a legal case
3. Visit **Compliance Dashboard** to see your compliance posture
4. Check **Policies** to manage company policies

## Step 7: Set Up HRIS

1. Go to **HRIS Dashboard**
2. Add your **Departments**
3. Add **Employees** under each department
4. Set up **Onboarding** workflows for new hires

## You're All Set!

Explore more features as you get comfortable with the platform.`,
  },
  {
    id: 'navigation',
    title: 'Navigating the Dashboard',
    category: 'getting_started',
    type: 'guide',
    order: 3,
    tags: ['navigation', 'dashboard', 'interface'],
    content: `# Navigating the Dashboard

Learn your way around the CatchAll interface.

## Sidebar Navigation

The left sidebar is organized into sections:

- **Brand Dashboard**: Overview of key metrics
- **Business Dev**: Aerospace, Pitch Decks, Data Rooms, DocuTrace, Leads
- **Legal**: Dashboard, Matters, Documents, Litigation, Obligations, IP, Counsel, Entities
- **CRM**: Contacts, Companies, Deals, Activities
- **Sales**: Pipeline, Sequences, Proposals, Meeting Scheduler
- **Customer Success**: Health, Onboarding, Feedback, Renewals
- **Marketing**: Campaigns, Email Marketing, Reports
- **SEO**: Dashboard, Keywords, Backlinks, Audit
- **Social**: Social Media, Social Listening, Calendar
- **Compliance**: Dashboard, Policies, Incidents, Audits, Risk, Export Control
- **HRIS**: Employees, Departments, Payroll, Benefits, Talent
- **Finance**: Equity, Accounting Dashboard
- **Settings**: Configure your account

## Top Bar

- **Search**: Find anything quickly with global search
- **Notifications**: See alerts and updates
- **Dark Mode**: Toggle light/dark theme
- **Profile**: Access your account settings

## Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open global search
- **?**: Show keyboard shortcuts
- **Escape**: Close modals

## Collapsible Sections

Click any section header in the sidebar to collapse or expand it.`,
  },

  // CRM Articles
  {
    id: 'contacts-guide',
    title: 'Managing Contacts',
    category: 'crm',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['contacts', 'leads', 'crm'],
    content: `# Managing Contacts

Learn how to effectively manage your contacts in the CRM.

## Adding a New Contact

1. Navigate to **Contacts** from the sidebar
2. Click the **Add Contact** button
3. Fill in the contact details:
   - First Name (required)
   - Last Name
   - Email (required)
   - Phone
   - Company
   - Job Title
   - Status (Lead, Prospect, Customer, Churned)
   - Source

## Contact Statuses Explained

| Status | Description |
|--------|-------------|
| Lead | New potential customer, not yet qualified |
| Prospect | Qualified and showing interest |
| Customer | Active paying customer |
| Churned | Former customer no longer active |

## Filtering & Searching

- Use the search bar to find contacts by name or email
- Filter by status, company, or source
- Sort by name, date added, or last activity

## Importing Contacts

1. Click the **Import** button
2. Upload a CSV file with contact data
3. Map columns to fields
4. Review and confirm import

## Best Practices

✅ Keep contact information up to date
✅ Log all interactions as activities
✅ Use consistent naming conventions
✅ Set follow-up reminders for important contacts`,
  },
  {
    id: 'deals-pipeline',
    title: 'Using the Deal Pipeline',
    category: 'crm',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['deals', 'pipeline', 'sales'],
    content: `# Using the Deal Pipeline

Track your sales opportunities from lead to close.

## Deal Stages

| Stage | Description |
|-------|-------------|
| Lead | Initial contact |
| Qualified | Budget/need confirmed |
| Proposal | Quote sent |
| Negotiation | Discussing terms |
| Won | Deal closed |
| Lost | Deal didn't close |

## Creating a Deal

1. Go to **Deals** from the sidebar
2. Click **Add Deal**
3. Enter deal details: title, value, stage, contact, expected close date

## Pipeline View vs List View

- **Pipeline**: Kanban board showing deals by stage
- **List**: Sortable table with all deal details`,
  },

  // SEO Articles
  {
    id: 'seo-basics',
    title: 'SEO Dashboard Overview',
    category: 'seo',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['seo', 'dashboard', 'overview'],
    content: `# SEO Dashboard Overview

Your command center for SEO performance monitoring.

## Adding a Website

1. Go to **SEO Dashboard**
2. Click **Add Website**
3. Enter your website URL and name
4. The system will automatically analyze your site

## Key Metrics

- **Domain Authority (DA)**: 0-100 ranking prediction score
- **SEO Score**: Overall health score
- **Organic Traffic**: Estimated monthly visitors
- **Keyword Rankings**: How many keywords your site ranks for

## Quick Actions

From the dashboard you can:
- Run a technical audit
- View keyword rankings
- Analyze backlinks
- Generate reports`,
  },
  {
    id: 'keyword-tracking',
    title: 'Tracking Keywords',
    category: 'seo',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['keywords', 'rankings', 'serp'],
    content: `# Tracking Keywords

Monitor your search engine rankings for important keywords.

## Adding Keywords

1. Navigate to **Keywords**
2. Click **Add Keyword**
3. Enter keyword phrase, target URL, and target position

## Understanding Keyword Data

| Metric | Description |
|--------|-------------|
| Position | Current ranking (1-100) |
| Change | Movement since last check |
| Volume | Monthly searches |
| Difficulty | How hard to rank (0-100) |

## Position Changes

- 🟢 Green arrow = improved ranking
- 🔴 Red arrow = dropped ranking
- ➡️ Gray = no change`,
  },

  // Legal Articles
  {
    id: 'legal-overview',
    title: 'Legal Module Overview',
    category: 'legal',
    type: 'guide',
    is_featured: true,
    order: 1,
    tags: ['legal', 'overview', 'matters'],
    content: `# Legal Module Overview

CatchAll's Legal module provides end-to-end management of your company's legal operations.

## Key Features

### ⚖️ Legal Dashboard
A high-level view of your legal posture including open matters, upcoming deadlines, litigation exposure, and budget vs actuals.

### 📁 Legal Matters
Track all legal cases with:
- Matter type (contract, litigation, employment, IP, M&A, etc.)
- Status (open, in progress, on hold, closed)
- Assigned attorney
- Deadlines and costs
- Priority levels

### ⚔️ Litigation
Manage active lawsuits and disputes:
- Case name and number
- Our role (plaintiff/defendant)
- Court and jurisdiction
- Hearing dates
- Claim and settlement amounts
- Legal reserves

### 📜 Legal Obligations
Track regulatory and contractual obligations:
- Obligation type (regulatory, statutory, license, permit, filing)
- Due dates and renewal dates
- Recurrence schedules
- Non-compliance penalties
- Owner and department

### 💡 Intellectual Property
Manage your IP portfolio:
- Patents, trademarks, copyrights, trade secrets
- Registration and expiry dates
- Filing and renewal tracking
- Jurisdictions and classes
- Estimated value

### 👤 Legal Counsel
Manage your legal team:
- In-house and external counsel
- Specializations
- Hourly rates and retainers
- YTD spend tracking

### 🏢 Legal Entities
Track corporate structure:
- Entity types (corporation, LLC, partnership, etc.)
- Jurisdictions and registration numbers
- Parent-subsidiary relationships
- Incorporation and dissolution dates
- Annual report due dates

## Getting Started

1. Go to **Legal Dashboard** for a summary
2. Add a **Matter** to track your first legal case
3. Register your **Legal Entities** for corporate structure
4. Add your **Counsel** contacts
5. Set up **Obligations** for recurring compliance requirements`,
  },
  {
    id: 'legal-matters-guide',
    title: 'Managing Legal Matters',
    category: 'legal',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['matters', 'cases', 'legal'],
    content: `# Managing Legal Matters

Track every legal case and project in one place.

## Creating a Matter

1. Go to **Matters** from the Legal section
2. Click **Add Matter**
3. Fill in:
   - Title (required)
   - Matter type
   - Status
   - Priority
   - Assigned attorney
   - Open date and deadline
   - Estimated and actual costs
   - Billing type

## Matter Types

| Type | Examples |
|------|---------|
| Contract | Vendor agreements, customer contracts |
| Litigation | Lawsuits, arbitration |
| Regulatory | Compliance filings |
| Employment | HR disputes, terminations |
| IP | Patent filings, trademark disputes |
| Corporate | M&A, restructuring |
| Data Privacy | GDPR, CCPA compliance |

## Tracking Costs

- Set **Estimated Cost** when opening the matter
- Update **Actual Cost** as bills come in
- The dashboard shows budget vs actuals across all matters

## Best Practices

✅ Create a matter for every active legal issue
✅ Assign a clear owner and deadline
✅ Upload relevant documents
✅ Update status regularly`,
  },
  {
    id: 'legal-ip-guide',
    title: 'Intellectual Property Management',
    category: 'legal',
    type: 'tutorial',
    order: 3,
    tags: ['ip', 'patents', 'trademarks', 'copyright'],
    content: `# Intellectual Property Management

Protect and manage your company's IP portfolio.

## IP Asset Types

| Type | Description |
|------|-------------|
| Patent | Utility and design patents |
| Trademark | Brand names, logos, slogans |
| Copyright | Original creative works |
| Trade Secret | Proprietary information |
| Domain | Web domains |

## Adding an IP Asset

1. Go to **Intellectual Property**
2. Click **Add IP Asset**
3. Enter:
   - Title and description
   - IP type
   - Status (pending, registered, active, expired)
   - Registration and application numbers
   - Jurisdiction
   - Filing, registration, and expiry dates
   - Renewal date

## Renewal Tracking

The system highlights IP assets with upcoming renewal dates so you never miss a deadline.

## Best Practices

✅ Add all IP assets when registering
✅ Set renewal dates in advance
✅ Track licensed IP separately
✅ Document all inventors and owners`,
  },

  // Compliance Articles
  {
    id: 'compliance-overview',
    title: 'Compliance Module Overview',
    category: 'compliance',
    type: 'guide',
    is_featured: true,
    order: 1,
    tags: ['compliance', 'overview', 'policies'],
    content: `# Compliance Module Overview

Manage your organization's entire compliance program from one place.

## Key Features

### 📋 Compliance Dashboard
High-level metrics across policies, training, incidents, audits, and risks.

### 📄 Policies
- Create and version compliance policies
- Assign ownership and review dates
- Track employee acknowledgment
- Categorize by type (HR, data privacy, financial, etc.)

### 🎓 Compliance Training
- Create and assign training programs
- Track completion rates
- Set due dates and recurrence
- Target specific departments

### 🚨 Incidents
- Report compliance violations and policy breaches
- Assign severity levels (low, medium, high, critical)
- Track investigation status
- Support anonymous reporting

### 🔍 Audits
- Schedule internal and external audits
- Track findings and recommendations
- Assign risk ratings
- Follow up on remediation

### ⚠️ Risk Register
- Document compliance risks
- Score by likelihood and impact
- Assign mitigation plans
- Track status through resolution

### 🌍 Export Control
- Manage EAR/ITAR programs
- Track deemed exports
- Log export violations
- Manage export control personnel and training

## Getting Started

1. Navigate to **Compliance Dashboard** for an overview
2. Add your **Policies** to the system
3. Create **Training** programs for employees
4. Set up the **Risk Register** with known risks
5. Schedule your first **Audit**`,
  },
  {
    id: 'export-control-guide',
    title: 'Export Control Management',
    category: 'compliance',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['export control', 'EAR', 'ITAR', 'compliance'],
    content: `# Export Control Management

Manage your EAR, ITAR, and OFAC compliance obligations.

## Key Components

### Export Control Programs
Define and manage your export control programs:
- Applicable regulations (EAR, ITAR, OFAC)
- Risk level
- Owner and department
- Review dates

### Tech Control Plans (TCPs)
Document technology control plans:
- Associated program
- ECCN classification
- Controls and restrictions
- Approval status and dates

### Deemed Exports
Track technology transfers to foreign nationals:
- Technology item and ECCN
- Recipient information and nationality
- Disclosure type
- License requirements
- Review and approval status

### Export Violations
Log and investigate export control violations:
- Violation type and regulation
- Severity level
- Voluntary disclosure decisions
- Remediation plans

### Export Control Personnel
Track authorized personnel:
- US person status
- Clearance levels
- Training completion and expiry
- Program assignments

## Best Practices

✅ Review all foreign national access to controlled technology
✅ Maintain current TCPs for all programs
✅ Track training expiry for all personnel
✅ Report violations promptly (voluntary disclosure reduces penalties)
✅ Review OFAC sanctions lists regularly`,
  },

  // HRIS Articles
  {
    id: 'hris-overview',
    title: 'HRIS Module Overview',
    category: 'hris',
    type: 'guide',
    is_featured: true,
    order: 1,
    tags: ['hris', 'employees', 'hr', 'people ops'],
    content: `# HRIS Module Overview

CatchAll's HRIS module covers the full employee lifecycle.

## Core HR

### 👥 Employees
Full employee profiles including:
- Personal and contact information
- Department and manager
- Employment status and type
- Salary and compensation
- Start date and job history

### 🏢 Departments
Organize your company structure:
- Department hierarchy
- Budget tracking
- Headcount management
- Department heads

### 📅 Team Calendar
View team availability, PTO, and events in one calendar view.

### 📊 HR Analytics
Data-driven HR insights on headcount, turnover, compensation, and more.

## People Operations

### 🚀 Onboarding
Structured onboarding workflows:
- Task checklists per new hire
- Track completion status
- Document collection
- System access provisioning

### 👋 Offboarding
Structured exit workflows to ensure smooth transitions.

### 🏖️ Time Off
- PTO request and approval workflow
- Balance tracking
- Policy configuration
- Team availability view

### 💰 Payroll
- Payroll run tracking
- Compensation management
- Deductions and benefits
- Pay stubs and history

### ❤️ Benefits
- Benefits catalog management
- Employee enrollment tracking
- Open enrollment periods
- Cost tracking

### 📝 Contracts
Manage employment contracts and agreements.

### 📁 HR Documents
Centralized document storage per employee.

## Culture & Talent

### 📣 Announcements
Company-wide and department-level announcements.

### 🏆 Recognition
Employee recognition and awards.

### 🎯 Performance
- Goal setting (OKRs/KPIs)
- Performance reviews
- 360 feedback
- Career development

### 📚 Training
Employee training programs and completion tracking.

### 🛤️ Career Paths
Define growth tracks and competency frameworks.

### 🤝 Mentorships
Match employees with mentors for development.

### 🎓 Internships
Manage intern cohorts and projects.

### ⚡ Skills
Track employee skills and identify gaps.

### 📋 Surveys
Employee engagement and pulse surveys.

## Getting Started

1. Add your **Departments** first
2. Create **Employee** records
3. Set up **Onboarding** workflows
4. Configure **Time Off** policies
5. Add **Benefits** programs`,
  },
  {
    id: 'hris-employees-guide',
    title: 'Managing Employees',
    category: 'hris',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['employees', 'profiles', 'hr'],
    content: `# Managing Employees

Add and manage employee records in the HRIS.

## Adding an Employee

1. Go to **Employees** from the HRIS section
2. Click **Add Employee**
3. Fill in:
   - Full name (required)
   - Employee ID
   - Email
   - Department
   - Job title and level
   - Manager
   - Employment type (full-time, part-time, contractor)
   - Start date
   - Salary

## Employee Status

| Status | Description |
|--------|-------------|
| Active | Currently employed |
| On Leave | Temporarily absent |
| Terminated | Employment ended |
| Contractor | Non-employee worker |

## Employee Profile Sections

Each employee profile shows:
- **Personal Info**: Contact details, emergency contacts
- **Work Info**: Role, department, manager, start date
- **Compensation**: Salary, bonuses, equity
- **Benefits**: Current enrollment
- **Documents**: Contracts, ID, certifications
- **Time Off**: Balance and request history
- **Performance**: Goals and review history

## Best Practices

✅ Add employees on day one
✅ Keep department and manager assignments current
✅ Upload all employment documents
✅ Track salary changes with effective dates`,
  },

  // Social Media Articles
  {
    id: 'social-listening',
    title: 'Social Listening Guide',
    category: 'social_media',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['social listening', 'mentions', 'monitoring'],
    content: `# Social Listening Guide

Monitor what people are saying about your brand across social media.

## Setting Up Tracking

1. Go to **Social Listening**
2. Click **Add Keyword**
3. Choose tracking type: Keyword, Hashtag, or Mention

## Understanding Sentiment

- 🟢 **Positive**: Happy customers, praise
- ⚪ **Neutral**: Informational mentions
- 🔴 **Negative**: Complaints, criticism

## Alerts

Get notified when:
- Mention volume spikes
- Negative sentiment increases
- Influencers mention your brand

## Deep Scan (Forums)

Use Deep Scan to find discussions in Reddit, Quora, forums, and blog comments.`,
  },
  {
    id: 'social-ai-predictions',
    title: 'AI Predictions & Forecasting',
    category: 'social_media',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['ai', 'predictions', 'trends', 'forecasting'],
    content: `# AI Predictions & Forecasting

Leverage AI to predict trends and plan your social strategy.

## Predictive Trends

AI analyzes patterns to forecast:
- **Engagement Predictions**: Expected performance
- **Trending Topics**: Emerging subjects in your industry
- **Optimal Posting Times**: Best times for engagement
- **Content Recommendations**: What to post next

## Competitor Forecasting

Predict competitor moves and strategy shifts.

## AI Content Calendar

Let AI plan your content with a 2-week auto-generated posting schedule including topic suggestions and engagement estimates.`,
  },

  // Marketing Articles
  {
    id: 'email-campaigns',
    title: 'Creating Email Campaigns',
    category: 'marketing',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['email', 'campaigns', 'marketing'],
    content: `# Creating Email Campaigns

Send targeted emails to your contacts.

## Creating a Campaign

1. Go to **Email Marketing**
2. Click **New Campaign**
3. Enter campaign details and recipients

## Building Your Email

1. Choose a template or start blank
2. Write your content
3. Personalize with merge fields: {first_name}, {company}

## Tracking Results

After sending, monitor:
- Open rate
- Click rate
- Unsubscribes
- Bounces`,
  },

  // Business Dev Articles
  {
    id: 'data-rooms-guide',
    title: 'Data Rooms',
    category: 'business_dev',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['data rooms', 'documents', 'due diligence'],
    content: `# Data Rooms

Securely share confidential documents with investors, acquirers, or partners.

## Creating a Data Room

1. Go to **Data Rooms**
2. Click **Create Data Room**
3. Enter name and description
4. Set access permissions (public, private, invite-only)

## Uploading Documents

1. Open a data room
2. Click **Upload Document**
3. Add title and description
4. Set access level per document
5. Upload file

## Access Control

- Set room-level access restrictions
- Control individual document visibility
- Invite specific users via email
- Track who has accessed what

## Document Version History

Each document maintains a full version history:
1. Open a document
2. Click **Version History**
3. View all previous versions
4. Preview or restore any version

## Access Logs

See a complete audit trail:
- Who accessed each document
- When they accessed it
- How long they viewed it

## Best Practices

✅ Organize documents in logical folders
✅ Use descriptive file names
✅ Set expiration dates for time-sensitive access
✅ Review access logs regularly`,
  },
  {
    id: 'docutrace-guide',
    title: 'DocuTrace - Document Tracking',
    category: 'business_dev',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['docutrace', 'tracking', 'documents'],
    content: `# DocuTrace - Document Tracking

Track when and how recipients engage with your documents.

## How DocuTrace Works

1. Upload a document to DocuTrace
2. Share the tracked link with recipients
3. Get notified when they open it
4. See detailed engagement analytics

## Tracking Metrics

- **Opens**: When and how many times opened
- **Time Spent**: How long they viewed
- **Pages Viewed**: Which pages received attention
- **Device**: What device they used

## Setting Up Alerts

Configure notifications for:
- First open
- Multiple opens (high interest signal)
- Long viewing time
- Re-opens after a gap

## Use Cases

- Track proposal/pitch deck opens
- Monitor investor document engagement
- Follow up at the right time
- Prioritize outreach based on engagement

## Best Practices

✅ Share DocuTrace links instead of attachments
✅ Set up alerts so you can follow up immediately
✅ Review page-level data to understand interest areas`,
  },
  {
    id: 'aerospace-scanner',
    title: 'Aerospace Scanner',
    category: 'business_dev',
    type: 'tutorial',
    is_featured: true,
    order: 3,
    tags: ['aerospace', 'defense', 'business intelligence'],
    content: `# Aerospace Scanner

Discover and track aerospace & defense companies for business development.

## What It Does

The Aerospace Scanner provides intelligence on aerospace and defense companies including:
- Company profiles and financials
- Contract awards and government programs
- Technology focus areas
- Recent news and announcements

## Searching for Companies

1. Go to **Aerospace Scanner**
2. Use filters to narrow by sector, size, or location
3. Click on any company to view full profile

## Company Profiles

Each company profile shows:
- Overview and description
- Key programs and contracts
- Technology areas
- Financial data
- Recent news
- Contact and BD opportunities

## Portfolio Manager

Track companies you're actively pursuing:
1. Click **Add to Portfolio** on any company
2. Add notes about the relationship
3. Track engagement history
4. Set follow-up reminders

## Alerts

Get notified about:
- New contract awards
- Company news
- Funding announcements
- Program changes

## Use Cases

- Identify new teaming partners
- Research potential customers
- Track competitor activity
- Monitor program opportunities`,
  },
  {
    id: 'pitch-deck-creator',
    title: 'Pitch Deck Creator',
    category: 'business_dev',
    type: 'tutorial',
    order: 4,
    tags: ['pitch deck', 'business', 'ai'],
    content: `# Pitch Deck Creator

Create professional pitch decks with AI assistance.

## Getting Started

1. Navigate to **Pitch Deck Creator**
2. Fill in your business details
3. Click **Generate Pitch Deck**
4. Review and refine the output

## Required Information

- Company name, problem, solution
- Target market size and business model
- Revenue/customers and growth rate
- Team background and funding ask

## AI-Generated Content

The AI creates slides for: executive summary, problem/solution, market opportunity, business model, traction, team, financial projections, and ask.

## Best Practices

- Be specific with your data
- Use the brand selector for consistency
- Review all AI suggestions
- Customize for your audience`,
  },

  // Assets & Finance
  {
    id: 'equity-guide',
    title: 'Equity Management',
    category: 'assets',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['equity', 'options', 'vesting', 'cap table'],
    content: `# Equity Management

Manage your company's equity pool, grants, and vesting schedules.

## Equity Pool

1. Go to **Equity** from the Finance section
2. Set up your equity pool with:
   - Total shares authorized
   - Pool size
   - Pool type (ISO, NSO, RSA, etc.)

## Equity Grants

Issue grants to employees and founders:
1. Click **Add Grant**
2. Select employee
3. Enter shares, strike price
4. Set vesting schedule (cliff and period)
5. Set grant date

## Vesting Schedules

Standard vesting: 4-year vesting with 1-year cliff (25% vests after year 1, then monthly thereafter).

## Exercises

Track when employees exercise their options:
- Exercise date and shares
- Strike price and FMV at exercise
- Total cost and gain
- Exercise type (cash, cashless, net)

## Vesting View

See vested vs unvested shares per employee over time with visual charts.

## Best Practices

✅ Set up equity pools before issuing grants
✅ Document all grant agreements
✅ Track exercises promptly for accurate cap table
✅ Review vesting schedules annually`,
  },
  {
    id: 'equipment-inventory',
    title: 'Equipment Inventory Management',
    category: 'assets',
    type: 'tutorial',
    order: 2,
    tags: ['equipment', 'inventory', 'assets'],
    content: `# Equipment Inventory Management

Track and manage your company's physical assets.

## Adding Equipment

1. Go to **Equipment Inventory**
2. Click **Add Equipment**
3. Enter: name, category, serial number, purchase info, location, assigned person

## Status Tracking

- Active / In Repair / Retired / Disposed

## Financial Tracking

- Purchase price, current value, depreciation

## Maintenance

- Schedule and log maintenance history
- Track next service due dates`,
  },

  // Settings Articles
  {
    id: 'user-settings-guide',
    title: 'User Settings Guide',
    category: 'settings',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['settings', 'profile', 'account'],
    content: `# User Settings Guide

Customize your CatchAll experience.

## Profile Settings

Update: Full Name, Job Title, Company, Phone, Bio, Timezone

## Notification Preferences

Toggle email and push notifications for:
- Critical Alerts
- Social Mentions
- SEO Alerts
- Deal Updates
- Campaign Updates
- Weekly Digest

## API Keys

Generate API keys for external integrations:
1. Enter a key name
2. Click **Generate Key**
3. Copy and store securely
4. Use in Authorization header`,
  },

  // FAQ
  {
    id: 'faq-general',
    title: 'General FAQ',
    category: 'faq',
    type: 'faq',
    is_featured: true,
    order: 1,
    tags: ['faq', 'help', 'questions'],
    content: `# Frequently Asked Questions

## Getting Started

**Q: How do I get started?**
A: Start by adding your first contact, then create a deal to track your sales opportunity. For Legal, add a Matter. For HRIS, add your Departments and Employees. Check the Quick Start Guide for step-by-step instructions.

**Q: Can I import existing data?**
A: Yes! You can import contacts, companies, deals, and employees from CSV files. Look for the Import button in each section.

**Q: Is my data secure?**
A: Absolutely. All data is encrypted and stored securely following industry best practices.

## Legal Module

**Q: What is the difference between a Matter and Litigation?**
A: A Matter is any legal issue or project (contracts, regulatory, IP, etc.). Litigation is a specific type for active lawsuits or disputes with courts, case numbers, and hearing dates.

**Q: How do I track IP renewal dates?**
A: In the Intellectual Property section, add your IP assets with expiry and renewal dates. The dashboard highlights upcoming renewals.

**Q: Can I track legal entity subsidiaries?**
A: Yes. In Legal Entities, you can set a parent entity to map your corporate structure.

## Compliance

**Q: What export control regulations are supported?**
A: CatchAll supports EAR, ITAR, OFAC, and FCPA tracking through the Export Control module.

**Q: How do I report a compliance incident anonymously?**
A: When creating an incident, check the **Anonymous** option. Your name will not be displayed on the incident record.

**Q: What is a Deemed Export?**
A: A Deemed Export is the transfer of controlled technology to a foreign national within the US, which is treated as an export under EAR/ITAR regulations.

## HRIS

**Q: How do I track PTO balances?**
A: Go to Time Off. Each employee's balance is tracked automatically based on accrual policy and approved requests.

**Q: Can I manage onboarding tasks for new hires?**
A: Yes. Go to Onboarding, create an onboarding record for the new hire, and assign tasks with due dates.

**Q: How does the equity vesting work?**
A: Go to Equity under Finance. Set up your equity pool, create grants with vesting schedules, and the system tracks vested vs. unvested shares automatically.

## CRM & Sales

**Q: How many contacts can I add?**
A: There's no limit to contacts, companies, or deals.

**Q: How do I track deal activities?**
A: Open any deal and add activities (calls, emails, meetings, tasks) directly from the deal record.

## SEO

**Q: How often are keyword rankings updated?**
A: Rankings update when you run an analysis on your website. Click the Analyze button for the latest data.

## Social Media

**Q: Which platforms are supported?**
A: Twitter/X, LinkedIn, Facebook, Instagram, and YouTube for social listening and analytics.

**Q: What are AI Predictions in Social Media?**
A: AI analyzes your historical data and industry trends to forecast engagement, trending topics, and optimal content strategies.

## Account & Settings

**Q: How do I invite team members?**
A: Go to Settings and use the team management section to invite colleagues.

**Q: Can I export my data?**
A: Yes, most sections have an Export option to download your data as CSV.`,
  },
];