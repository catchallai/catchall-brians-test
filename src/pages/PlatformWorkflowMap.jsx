import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Info, Layers, GitBranch, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ─── MODULE DATA ─────────────────────────────────────────────────────────────

export const MODULES = [
  {
    id: 'crm', label: 'CRM', color: '#7c3aed', x: 480, y: 90,
    description: 'Central customer relationship hub. Stores contacts, companies, deals, and all customer interactions. The data backbone that every other module references.',
    pages: [
      { id: 'crm_contacts', label: 'Contacts', route: '/Contacts', description: 'Master list of all people and leads. Source of truth for all outreach.' },
      { id: 'crm_companies', label: 'Companies', route: '/Companies', description: 'Company accounts linked to contacts and deals.' },
      { id: 'crm_deals', label: 'Pipeline', route: '/Deals', description: 'Kanban-style deal pipeline from lead to won/lost.' },
      { id: 'crm_activities', label: 'Activities', route: '/Activities', description: 'Log of calls, emails, meetings tied to contacts and deals.' },
      { id: 'crm_opps', label: 'Opportunities', route: '/Opportunities', description: 'Qualified opportunities with weighted revenue forecasting.' },
      { id: 'crm_dashboard', label: 'CRM Dashboard', route: '/CRMDashboard', description: 'Pipeline metrics, conversion rates, and rep performance.' },
    ],
  },
  {
    id: 'sales', label: 'Sales', color: '#059669', x: 760, y: 220,
    description: 'Manages the full sales lifecycle from outreach to close. Sequences, proposals, meetings, quotas, and reservations all live here.',
    pages: [
      { id: 'sales_dashboard', label: 'Sales Dashboard', route: '/SalesDashboard', description: 'Revenue attainment, quota progress, and pipeline velocity.' },
      { id: 'sales_hub', label: 'Sales Hub', route: '/SalesHub', description: 'Central command for reps — tasks, sequences, and follow-ups.' },
      { id: 'sales_inbox', label: 'Sales Inbox', route: '/SalesInbox', description: 'Unified inbox for all sales emails, replies, and tracking.' },
      { id: 'sales_sequences', label: 'Sequences', route: '/SalesSequences', description: 'Multi-step automated outreach sequences for leads.' },
      { id: 'sales_proposals', label: 'Proposals', route: '/Proposals', description: 'Build and send branded proposals with e-signature.' },
      { id: 'sales_meetings', label: 'Meeting Scheduler', route: '/MeetingScheduler', description: 'Booking links, calendar sync, and meeting management.' },
      { id: 'sales_quotas', label: 'Sales Quotas', route: '/SalesQuotas', description: 'Set and track individual and team revenue quotas.' },
      { id: 'sales_reservations', label: 'Reservations', route: '/Reservations', description: 'Manage product/service reservations and bookings.' },
    ],
  },
  {
    id: 'marketing', label: 'Marketing', color: '#2563eb', x: 200, y: 220,
    description: 'Demand generation engine. Campaigns, email marketing, landing pages, lead scoring, and automation workflows.',
    pages: [
      { id: 'mkt_dashboard', label: 'Marketing Dashboard', route: '/MarketingDashboard', description: 'Campaign performance, lead volume, and ROI overview.' },
      { id: 'mkt_hub', label: 'Marketing Hub', route: '/MarketingHub', description: 'Strategy hub for all marketing initiatives.' },
      { id: 'mkt_email', label: 'Email Marketing', route: '/EmailMarketing', description: 'Campaign builder, templates, A/B tests, and analytics.' },
      { id: 'mkt_campaigns', label: 'Campaigns', route: '/Campaigns', description: 'Multi-channel campaign management and tracking.' },
      { id: 'mkt_landing', label: 'Landing Pages', route: '/LandingPageBuilder', description: 'Drag-and-drop landing page builder with conversion tracking.' },
      { id: 'mkt_automation', label: 'Automation', route: '/Automation', description: 'Trigger-based workflows for lead nurturing and scoring.' },
    ],
  },
  {
    id: 'cs', label: 'Customer Success', color: '#db2777', x: 760, y: 430,
    description: 'Retains and grows existing customers. Health scoring, onboarding tracking, feedback collection, and renewal management.',
    pages: [
      { id: 'cs_dashboard', label: 'CS Dashboard', route: '/CustomerSuccessDashboard', description: 'Health score distribution, churn risk, and NRR metrics.' },
      { id: 'cs_main', label: 'Customer Success', route: '/CustomerSuccess', description: 'Per-account health, tasks, interactions, and playbooks.' },
      { id: 'cs_feedback', label: 'Customer Feedback', route: '/FeedbackManagement', description: 'Collect, categorize, and route customer feedback.' },
    ],
  },
  {
    id: 'seo', label: 'SEO', color: '#ea580c', x: 200, y: 430,
    description: 'Drives organic growth. Keyword tracking, technical SEO audits, backlink analysis, and content performance monitoring.',
    pages: [
      { id: 'seo_dashboard', label: 'SEO Dashboard', route: '/SEODashboardPage', description: 'Keyword rankings, organic traffic trends, and health score.' },
      { id: 'seo_analytics', label: 'SEO Analytics', route: '/SEODashboard', description: 'Deep analytics on impressions, clicks, and rank positions.' },
      { id: 'seo_audits', label: 'SEO Audits', route: '/SEOAudit', description: 'Technical audit reports with actionable fix recommendations.' },
      { id: 'seo_keywords', label: 'Keywords', route: '/Keywords', description: 'Keyword research, rank tracking, and gap analysis.' },
      { id: 'seo_backlinks', label: 'Backlinks', route: '/Backlinks', description: 'Backlink monitoring, domain authority, and link building.' },
      { id: 'seo_local', label: 'Local SEO', route: '/LocalSEO', description: 'Google Business Profile management and local rank tracking.' },
    ],
  },
  {
    id: 'social', label: 'Social Media', color: '#0891b2', x: 200, y: 630,
    description: 'Manages your full social presence — scheduling, listening, engagement metrics, and analytics across all platforms.',
    pages: [
      { id: 'social_dashboard', label: 'Social Dashboard', route: '/SocialDashboard', description: 'Engagement, reach, and follower growth across platforms.' },
      { id: 'social_calendar', label: 'Social Calendar', route: '/SocialCalendar', description: 'Drag-and-drop content calendar for scheduling posts.' },
      { id: 'social_listening', label: 'Social Listening', route: '/SocialListening', description: 'Monitor brand mentions, keywords, and competitor activity.' },
      { id: 'social_analytics', label: 'Social Analytics', route: '/SocialMedia', description: 'Post performance, audience insights, and trend analysis.' },
      { id: 'social_accounts', label: 'Social Accounts', route: '/SocialAccounts', description: 'Connect and manage all social platform credentials.' },
    ],
  },
  {
    id: 'web', label: 'Web Analytics', color: '#4f46e5', x: 370, y: 780,
    description: 'Tracks website traffic, user behavior, heatmaps, conversion funnels, and A/B tests to optimize every page.',
    pages: [
      { id: 'web_dashboard', label: 'Web Dashboard', route: '/WebDashboard', description: 'Traffic overview, top pages, and real-time visitor count.' },
      { id: 'web_analytics', label: 'Web Analytics', route: '/TrafficAnalytics', description: 'Session data, referrals, bounce rates, and device breakdown.' },
      { id: 'web_advanced', label: 'Advanced Analytics', route: '/WebAnalyticsAdvanced', description: 'Heatmaps, session recordings, funnels, and cohort analysis.' },
      { id: 'web_crawler', label: 'Web Crawler', route: '/WebCrawler', description: 'Crawl your site for broken links, missing tags, and issues.' },
      { id: 'web_forms', label: 'Contact Forms', route: '/ContactForms', description: 'Build embedded forms and view all submissions.' },
    ],
  },
  {
    id: 'projects', label: 'Projects', color: '#d97706', x: 480, y: 630,
    description: 'Coordinates all internal work. Project planning, task management, Kanban boards, sprints, and time tracking.',
    pages: [
      { id: 'proj_dashboard', label: 'Projects Dashboard', route: '/ProjectsDashboard', description: 'Portfolio view of all active projects, milestones, and velocity.' },
      { id: 'proj_main', label: 'Projects', route: '/Projects', description: 'Kanban, list, and Gantt views for managing project tasks.' },
      { id: 'proj_calendar', label: 'Project Calendar', route: '/ProjectCalendar', description: 'Timeline view of milestones, deadlines, and team availability.' },
      { id: 'proj_collab', label: 'Team Collaboration', route: '/TeamCollaboration', description: 'Shared docs, whiteboards, and task threads for the team.' },
    ],
  },
  {
    id: 'hris', label: 'HRIS', color: '#0d9488', x: 620, y: 780,
    description: 'Complete HR system. Employees, payroll, time off, benefits, onboarding, and the full talent lifecycle.',
    pages: [
      { id: 'hris_dashboard', label: 'HRIS Dashboard', route: '/HRISDashboard', description: 'Headcount, turnover, open reqs, and payroll cost overview.' },
      { id: 'hris_employees', label: 'Employees', route: '/HRISEmployees', description: 'Employee directory with grid & list views. Click any employee to see comprehensive profile with data from all related modules (performance, talent, projects, sales, compliance).' },
      { id: 'hris_org', label: 'Org Chart', route: '/HRISOrgChart', description: 'Visual hierarchy of the organization by department.' },
      { id: 'hris_timeoff', label: 'Time Off', route: '/HRISTimeOff', description: 'Leave requests, balances, and approval workflows.' },
      { id: 'hris_payroll', label: 'Payroll', route: '/HRISPayroll', description: 'Payroll runs, salary records, and payslip generation.' },
      { id: 'hris_perf', label: 'Performance', route: '/HRISPerformance', description: 'Reviews, goals, and 360 feedback cycles.' },
      { id: 'hris_hiring', label: 'Hiring', route: '/HRISHiring', description: 'Job postings, candidate pipeline, and offer management.' },
    ],
  },
  {
    id: 'finance', label: 'Finance', color: '#65a30d', x: 760, y: 630,
    description: 'Full financial operations. P&L, budgets, transactions, payroll costs, forecasts, vendor management, and equity.',
    pages: [
      { id: 'fin_dashboard', label: 'Finance Dashboard', route: '/FinanceDashboard', description: 'Net income, burn rate, runway, and key financial KPIs.' },
      { id: 'fin_pl', label: 'P&L Statement', route: '/FinancePL', description: 'Real-time profit & loss with monthly breakdown.' },
      { id: 'fin_budgets', label: 'Budgets', route: '/FinanceBudgets', description: 'Department budgets, actuals, and variance tracking.' },
      { id: 'fin_transactions', label: 'Transactions', route: '/FinanceTransactions', description: 'All income and expense entries with reconciliation.' },
      { id: 'fin_payroll', label: 'Payroll Costs', route: '/FinancePayroll', description: 'Payroll expense breakdown pulled from HRIS.' },
      { id: 'fin_forecast', label: 'Forecasts', route: '/FinanceForecast', description: 'Revenue and expense forecasts vs actuals.' },
      { id: 'fin_vendor', label: 'Vendor Space', route: '/VendorSpace', description: 'Vendor management, invoices, and spend tracking.' },
      { id: 'fin_equity', label: 'Equity', route: '/Equity', description: 'Cap table, equity grants, vesting, and exercises.' },
    ],
  },
  {
    id: 'legal', label: 'Legal', color: '#a855f7', x: 480, y: 430,
    description: 'Manages the legal function. Matters, documents, litigation, IP assets, obligations, and external counsel.',
    pages: [
      { id: 'legal_dashboard', label: 'Legal Dashboard', route: '/LegalDashboard', description: 'Active matters, upcoming deadlines, and spend summary.' },
      { id: 'legal_matters', label: 'Matters', route: '/LegalMatters', description: 'Track all legal matters with status, counsel, and costs.' },
      { id: 'legal_docs', label: 'Legal Documents', route: '/LegalDocuments', description: 'Contract repository with version history and e-sign.' },
      { id: 'legal_lit', label: 'Litigation', route: '/LegalLitigation', description: 'Active and historical litigation cases and filings.' },
      { id: 'legal_ip', label: 'IP Assets', route: '/LegalIP', description: 'Patents, trademarks, copyrights, and trade secrets.' },
      { id: 'legal_counsel', label: 'Counsel', route: '/LegalCounsel', description: 'External and in-house counsel directory and billing.' },
    ],
  },
  {
    id: 'compliance', label: 'Compliance', color: '#16a34a', x: 480, y: 240,
    description: 'Enterprise compliance. SOC 2, CMMC, policies, audits, risk register, incidents, training, and export control.',
    pages: [
      { id: 'comp_dashboard', label: 'Compliance Dashboard', route: '/ComplianceDashboard', description: 'Control completion, audit readiness, and risk heat map.' },
      { id: 'comp_exec', label: 'Executive Summary', route: '/ComplianceExecutiveSummary', description: 'Board-ready compliance posture and certification status.' },
      { id: 'comp_policies', label: 'Policies', route: '/CompliancePolicies', description: 'Policy library with review cycles and attestation tracking.' },
      { id: 'comp_training', label: 'Training', route: '/ComplianceTraining', description: 'Security awareness training completion and assignments.' },
      { id: 'comp_incidents', label: 'Incidents', route: '/ComplianceIncidents', description: 'Security incident log with response and remediation.' },
      { id: 'comp_audits', label: 'Audits', route: '/ComplianceAudits', description: 'Audit findings, evidence collection, and remediation tracking.' },
      { id: 'comp_risk', label: 'Risk Register', route: '/ComplianceRisk', description: 'Risk identification, scoring, and mitigation planning.' },
      { id: 'comp_export', label: 'Export Control', route: '/ExportControl', description: 'EAR/ITAR compliance, deemed exports, and control plans.' },
    ],
  },
  {
    id: 'datarooms', label: 'Data Rooms', color: '#9333ea', x: 340, y: 430,
    description: 'Secure document sharing with access controls, external portals, activity tracking, and permission management.',
    pages: [
      { id: 'dr_main', label: 'Data Rooms', route: '/DataRooms', description: 'Create and manage secure data rooms with permission tiers.' },
      { id: 'dr_docutrace', label: 'DocuTrace', route: '/DocuTrace', description: 'Track who opened documents and for how long.' },
    ],
  },
  {
    id: 'reporting', label: 'Reporting', color: '#c026d3', x: 200, y: 90,
    description: 'Cross-module reporting. Custom dashboards, scheduled reports, PDF exports, and white-labeled client report sharing.',
    pages: [
      { id: 'rep_dashboard', label: 'Reports Dashboard', route: '/ReportsDashboardPage', description: 'Overview of all reports, schedules, and recent activity.' },
      { id: 'rep_builder', label: 'Reports', route: '/Reports', description: 'Build custom reports from any module with drag-and-drop.' },
    ],
  },
  {
    id: 'ai', label: 'AI Tools', color: '#8b5cf6', x: 760, y: 90,
    description: 'AI capabilities across the platform — content generation, lead enrichment, compliance scanning, and smart assistants.',
    pages: [
      { id: 'ai_dashboard', label: 'AI Dashboard', route: '/AIDashboard', description: 'Usage, model settings, and AI feature configuration.' },
      { id: 'ai_content', label: 'Content Studio', route: '/ContentStudio', description: 'AI-powered article, email, and social content generator.' },
      { id: 'ai_enrich', label: 'Lead Enrichment', route: '/LeadEnrichment', description: 'Auto-enrich contacts with company intelligence and firmographics.' },
      { id: 'ai_hris', label: 'HR AI Assistant', route: '/HRISAIAssistant', description: 'Answers HR policy questions and generates workforce insights.' },
    ],
  },
  {
    id: 'comms', label: 'Communications', color: '#6366f1', x: 620, y: 240,
    description: 'Internal messaging, channels, video calls, whiteboards, polls, and file sharing — the ICS collaboration system.',
    pages: [
      { id: 'comms_ics', label: 'ICS (Messaging)', route: '/ICS', description: 'Real-time channels, threads, DMs, and reactions.' },
      { id: 'comms_spaces', label: 'Spaces / Wiki', route: '/Spaces', description: 'Collaborative wiki spaces for team knowledge management.' },
    ],
  },
  {
    id: 'clientportal', label: 'Client Portal', color: '#0f766e', x: 620, y: 430,
    description: 'Authenticated customer-facing portal. Clients access shared legal documents, data rooms, and submit support/feedback requests directly.',
    pages: [
      { id: 'cp_portal', label: 'Client Portal', route: '/ClientPortal', description: 'Secure auth-gated portal for clients to view documents and submit support requests.' },
      { id: 'cp_docs', label: 'My Documents', route: '/ClientPortal', description: 'Client-facing view of legal documents and data rooms shared with their email.' },
      { id: 'cp_support', label: 'Support & Feedback', route: '/ClientPortal', description: 'Form for clients to submit support requests, bug reports, and NPS feedback.' },
    ],
  },
  {
    id: 'bizdev', label: 'Business Dev', color: '#0369a1', x: 340, y: 90,
    description: 'Intelligence-driven business development. Aerospace scanner, competitor analysis, visitor profiles, and press monitoring.',
    pages: [
      { id: 'biz_dashboard', label: 'BizDev Dashboard', route: '/BusinessDevDashboard', description: 'Pipeline of opportunities from scanner and research.' },
      { id: 'biz_scanner', label: 'Aerospace Scanner', route: '/AerospaceScanner', description: 'Industry-specific company intelligence and opportunity alerts.' },
      { id: 'biz_competitor', label: 'Competitor Analysis', route: '/CompetitorAnalysis', description: 'Side-by-side competitor benchmarking and tracking.' },
      { id: 'biz_visitors', label: 'Visitor Profiles', route: '/VisitorProfiles', description: 'Identify anonymous site visitors and score as leads.' },
      { id: 'biz_press', label: 'Press Monitoring', route: '/PressMonitoring', description: 'Track brand and competitor mentions across news sources.' },
    ],
  },
];

// ─── MODULE EDGES ──────────────────────────────────────────────────────────
// [fromId, toId, flowLabel, color, description]
export const MODULE_EDGES = [
  ['crm', 'sales', 'Qualified leads → pipeline', '#059669', 'Contacts and deals flow from CRM into Sales sequences and pipeline management'],
  ['crm', 'marketing', 'Contacts ← campaigns', '#2563eb', 'CRM contacts are targeted by Marketing; lead scores flow back to CRM'],
  ['crm', 'cs', 'Won deals → onboarding', '#db2777', 'Closed-won deals in CRM trigger Customer Success onboarding workflows'],
  ['crm', 'datarooms', 'Deals → document sharing', '#9333ea', 'Deals link to Data Rooms for secure document exchange with prospects'],
  ['crm', 'legal', 'Contacts → contracts', '#a855f7', 'CRM contacts and companies are referenced in Legal documents and matters'],
  ['crm', 'reporting', 'Pipeline data → reports', '#c026d3', 'CRM pipeline and activity data powers cross-module executive reports'],
  ['marketing', 'crm', 'MQLs → contacts', '#7c3aed', 'Marketing qualified leads are created as Contacts in CRM'],
  ['marketing', 'seo', 'Content ↔ keywords', '#ea580c', 'Marketing content calendar is informed by SEO keyword opportunities'],
  ['marketing', 'social', 'Campaigns → posts', '#0891b2', 'Marketing campaigns coordinate with Social Media publishing'],
  ['marketing', 'web', 'Landing pages → traffic', '#4f46e5', 'Marketing landing pages drive traffic measured in Web Analytics'],
  ['marketing', 'reporting', 'Campaign ROI → reports', '#c026d3', 'Campaign performance and ROI are included in executive reports'],
  ['sales', 'finance', 'Won deals → revenue', '#65a30d', 'Closed deals create revenue transactions in Finance and update forecasts'],
  ['sales', 'legal', 'Proposals → contracts', '#a855f7', 'Sales proposals convert into Legal contracts requiring review and signature'],
  ['sales', 'cs', 'Handoff → onboarding', '#db2777', 'Sales closes deals and hands off customers to Customer Success'],
  ['sales', 'comms', 'Sales inbox → messages', '#6366f1', 'Sales email activities sync with the ICS communications system'],
  ['sales', 'ai', 'Lead enrichment', '#8b5cf6', 'AI enriches lead profiles with company intelligence'],
  ['finance', 'hris', 'Payroll ↔ headcount', '#0d9488', 'Finance payroll pulls salary data from HRIS employee records'],
  ['finance', 'legal', 'Contracts → spend', '#a855f7', 'Legal contracts are tracked as financial commitments in Finance'],
  ['finance', 'reporting', 'P&L → reports', '#c026d3', 'Finance P&L, budgets, and forecasts feed into executive reports'],
  ['finance', 'compliance', 'Audit evidence', '#16a34a', 'Finance transactions serve as audit evidence for SOC 2 / CMMC'],
  ['hris', 'finance', 'Salaries → payroll costs', '#65a30d', 'HRIS employee salaries and payroll runs feed into Finance'],
  ['hris', 'compliance', 'Training records → controls', '#16a34a', 'Training completion records satisfy Compliance requirements'],
  ['hris', 'projects', 'Team members → tasks', '#d97706', 'HRIS employee data is used to assign team members to Projects'],
  ['hris', 'reporting', 'Headcount → reports', '#c026d3', 'Headcount, diversity, and turnover metrics appear in reports'],
  ['compliance', 'legal', 'Policies → obligations', '#a855f7', 'Compliance policies link to Legal obligations and regulations'],
  ['compliance', 'datarooms', 'Evidence → secure storage', '#9333ea', 'Compliance evidence files are stored in secure Data Rooms'],
  ['compliance', 'reporting', 'SOC2 status → reports', '#c026d3', 'Compliance program status feeds into executive reports'],
  ['compliance', 'ai', 'Evidence scanning', '#8b5cf6', 'AI scans compliance evidence for sensitive data and risks'],
  ['legal', 'datarooms', 'Docs → secure sharing', '#9333ea', 'Legal documents are shared via Data Room portals'],
  ['legal', 'compliance', 'Obligations → controls', '#16a34a', 'Legal obligations map to Compliance controls'],
  ['cs', 'crm', 'Health scores → CRM', '#7c3aed', 'Customer health scores flow back to CRM contact records'],
  ['cs', 'finance', 'Renewals → revenue', '#65a30d', 'CS manages renewals that update revenue forecasts in Finance'],
  ['bizdev', 'crm', 'Prospects → contacts', '#7c3aed', 'Aerospace scanner creates new leads and contacts in CRM'],
  ['bizdev', 'marketing', 'Market intel → campaigns', '#2563eb', 'Business intelligence informs Marketing campaign targeting'],
  ['bizdev', 'datarooms', 'M&A docs → rooms', '#9333ea', 'Business development deals use Data Rooms for document exchange'],
  ['social', 'marketing', 'Engagement → leads', '#2563eb', 'Social listening and leads feed into Marketing and CRM'],
  ['social', 'reporting', 'Social metrics → reports', '#c026d3', 'Social performance metrics are included in executive reports'],
  ['seo', 'web', 'Rankings → traffic', '#4f46e5', 'SEO rankings and audits impact Web Analytics traffic'],
  ['seo', 'reporting', 'SEO metrics → reports', '#c026d3', 'SEO rankings and backlinks feed into reports'],
  ['web', 'crm', 'Visitors → leads', '#7c3aed', 'Visitor identification and form submissions create CRM contacts'],
  ['web', 'marketing', 'Conversion → optimization', '#2563eb', 'Conversion rates optimize Marketing campaign performance'],
  ['projects', 'hris', 'Tasks → team', '#0d9488', 'Projects use HRIS data for team assignment and workload'],
  ['projects', 'comms', 'Updates → chat', '#6366f1', 'Project updates trigger notifications in ICS channels'],
  ['ai', 'crm', 'Enriched data', '#7c3aed', 'AI enriches CRM contact and company data'],
  ['ai', 'marketing', 'Content generation', '#2563eb', 'AI generates marketing content and email copy'],
  ['ai', 'hris', 'HR assistant', '#0d9488', 'AI assistant answers HR policy questions'],
  ['comms', 'projects', 'Channel → project updates', '#d97706', 'ICS channels are linked to Projects for team communication'],
  ['reporting', 'ai', 'AI insights', '#8b5cf6', 'AI generates automated insights within Reports'],
  ['legal', 'clientportal', 'Shared docs → portal', '#0f766e', 'Legal documents shared with client emails become visible in the Client Portal'],
  ['datarooms', 'clientportal', 'Data rooms → portal', '#0f766e', 'Data rooms with recipient email set are accessible in the Client Portal'],
  ['cs', 'clientportal', 'Feedback → CS', '#db2777', 'Feedback submitted via Client Portal flows into Customer Success for review'],
  ['clientportal', 'cs', 'Support requests', '#db2777', 'Client support submissions create CustomerFeedback records for the CS team'],
];

// ─── PAGE-LEVEL EDGES (within module drilldown) ────────────────────────────
// [fromPageId, toPageId, flowLabel, color, description]
export const PAGE_EDGES = {
  crm: [
    ['crm_contacts', 'crm_deals', 'Contact → Deal', '#7c3aed', 'Contacts are linked to deals as primary stakeholders'],
    ['crm_contacts', 'crm_activities', 'Log activity', '#6366f1', 'Activities (calls, emails) are logged against contacts'],
    ['crm_deals', 'crm_opps', 'Deal → Opportunity', '#059669', 'Qualified deals are elevated to tracked Opportunities'],
    ['crm_dashboard', 'crm_deals', 'Drill down', '#c026d3', 'Dashboard widgets link directly into Pipeline view'],
    ['crm_companies', 'crm_contacts', 'Company → contacts', '#7c3aed', 'Companies contain multiple linked contacts'],
  ],
  sales: [
    ['sales_hub', 'sales_sequences', 'Enroll lead', '#059669', 'Reps enroll leads into automated outreach sequences from Hub'],
    ['sales_inbox', 'sales_hub', 'Reply tracked', '#6366f1', 'Email replies in Sales Inbox update Hub tasks and history'],
    ['sales_hub', 'sales_proposals', 'Create proposal', '#8b5cf6', 'Hub actions include generating a new proposal'],
    ['sales_meetings', 'sales_hub', 'Meeting booked', '#d97706', 'Booked meetings create follow-up tasks in Sales Hub'],
    ['sales_dashboard', 'sales_quotas', 'Track attainment', '#c026d3', 'Dashboard shows quota progress linking to Quotas detail'],
  ],
  marketing: [
    ['mkt_email', 'mkt_campaigns', 'Email in campaign', '#2563eb', 'Email sends are components of larger campaign workflows'],
    ['mkt_automation', 'mkt_email', 'Trigger email', '#ea580c', 'Automation rules trigger targeted emails based on behavior'],
    ['mkt_landing', 'mkt_campaigns', 'Landing page → campaign', '#d97706', 'Landing pages are assigned to campaigns for tracking'],
    ['mkt_dashboard', 'mkt_email', 'Drill into email', '#c026d3', 'Dashboard metrics link directly into Email Analytics'],
  ],
  finance: [
    ['fin_dashboard', 'fin_pl', 'View P&L', '#c026d3', 'Dashboard KPI cards drill into the full P&L Statement'],
    ['fin_pl', 'fin_transactions', 'Transaction detail', '#65a30d', 'P&L line items drill down to underlying transactions'],
    ['fin_budgets', 'fin_transactions', 'Budget vs actual', '#d97706', 'Budgets compare against real transactions in real time'],
    ['fin_payroll', 'fin_transactions', 'Payroll entries', '#0d9488', 'Each payroll run creates expense transactions automatically'],
    ['fin_vendor', 'fin_transactions', 'Invoice → transaction', '#9333ea', 'Vendor invoices create payable transactions in Finance'],
    ['fin_forecast', 'fin_pl', 'Forecast vs actual', '#8b5cf6', 'Forecasts are overlaid on P&L for variance analysis'],
  ],
  hris: [
    ['hris_dashboard', 'hris_employees', 'View team', '#0d9488', 'Dashboard headcount cards link into the employee directory'],
    ['hris_employees', 'hris_org', 'Org placement', '#6366f1', 'Each employee record shows their position in the org chart'],
    ['hris_employees', 'hris_timeoff', 'Request leave', '#db2777', 'Leave requests are submitted from the employee profile'],
    ['hris_hiring', 'hris_employees', 'Hire → onboard', '#059669', 'Accepted offers create new employee records automatically'],
    ['hris_payroll', 'hris_employees', 'Pay employee', '#65a30d', 'Payroll runs are linked to employee salary records'],
    ['hris_perf', 'hris_employees', 'Review cycle', '#d97706', 'Performance reviews are created per employee each cycle'],
  ],
  compliance: [
    ['comp_dashboard', 'comp_audits', 'View audit gaps', '#c026d3', 'Dashboard shows control gaps linking to Audit details'],
    ['comp_policies', 'comp_training', 'Policy → training', '#16a34a', 'Policies require employee training and attestation'],
    ['comp_risk', 'comp_incidents', 'Risk → incident', '#ea580c', 'High-risk items can escalate to tracked Incidents'],
    ['comp_audits', 'comp_policies', 'Finding → policy', '#8b5cf6', 'Audit findings trigger policy updates and remediation'],
    ['comp_exec', 'comp_dashboard', 'Drill down', '#6366f1', 'Executive Summary links to Dashboard for full detail'],
  ],
  legal: [
    ['legal_dashboard', 'legal_matters', 'View matters', '#c026d3', 'Dashboard stats link into the Matters list view'],
    ['legal_matters', 'legal_docs', 'Matter → contracts', '#a855f7', 'Each matter has associated legal documents and contracts'],
    ['legal_matters', 'legal_lit', 'Matter → litigation', '#ea580c', 'Disputes in matters can escalate to tracked Litigation'],
    ['legal_docs', 'legal_ip', 'IP licensing docs', '#8b5cf6', 'IP asset licensing agreements are stored as Legal Documents'],
    ['legal_matters', 'legal_counsel', 'Assign counsel', '#0369a1', 'Matters are assigned to internal or external counsel'],
  ],
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MOD_W = 130;
const MOD_H = 46;

const PAGE_W = 140;
const PAGE_H = 38;

const CONNECTION_TYPES = [
  { color: '#7c3aed', label: 'CRM connections' },
  { color: '#059669', label: 'Sales flow' },
  { color: '#2563eb', label: 'Marketing flow' },
  { color: '#db2777', label: 'Customer Success' },
  { color: '#ea580c', label: 'SEO flow' },
  { color: '#0891b2', label: 'Social flow' },
  { color: '#4f46e5', label: 'Web flow' },
  { color: '#d97706', label: 'Projects flow' },
  { color: '#0d9488', label: 'HRIS flow' },
  { color: '#65a30d', label: 'Finance flow' },
  { color: '#16a34a', label: 'Compliance flow' },
  { color: '#9333ea', label: 'Data Room flow' },
  { color: '#c026d3', label: 'Reporting flow' },
  { color: '#8b5cf6', label: 'AI flow' },
  { color: '#6366f1', label: 'Communications' },
  { color: '#0369a1', label: 'Business Dev' },
  { color: '#a855f7', label: 'Legal flow' },
  { color: '#0f766e', label: 'Client Portal' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getModuleById(id) { return MODULES.find(m => m.id === id); }
function getEdgesForNode(nodeId, edges) { return edges.filter(e => e[0] === nodeId || e[1] === nodeId); }

function curvedPath(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const cx1 = x1 + dx * 0.4 + dy * 0.1;
  const cy1 = y1 + dy * 0.4 - dx * 0.1;
  const cx2 = x1 + dx * 0.6 + dy * 0.1;
  const cy2 = y1 + dy * 0.6 - dx * 0.1;
  return `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
}

// Layout pages in a circle around center
function getPageLayout(module) {
  const pages = module.pages;
  const cx = 500, cy = 420;
  const radius = Math.min(300, 60 + pages.length * 38);
  return pages.map((p, i) => {
    const angle = (2 * Math.PI * i) / pages.length - Math.PI / 2;
    return {
      ...p,
      x: cx + radius * Math.cos(angle) - PAGE_W / 2,
      y: cy + radius * Math.sin(angle) - PAGE_H / 2,
    };
  });
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function EdgeArrows({ colors }) {
  return (
    <defs>
      {colors.map(color => (
        <marker key={color} id={`arr-${color.replace('#', '')}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill={color} />
        </marker>
      ))}
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

function GridBackground() {
  return (
    <>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth="0.5" />
      </pattern>
      <rect x={-5000} y={-5000} width={12000} height={12000} fill="url(#grid)" />
    </>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function PlatformWorkflowMap() {
  const [view, setView] = useState('modules'); // 'modules' | 'pages'
  const [selectedModule, setSelectedModule] = useState(null); // for page drilldown
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);
  const svgRef = useRef(null);

  // Switch to page view for a module
  const drillIntoModule = (module) => {
    setSelectedModule(module);
    setSelectedNode(null);
    setHoveredNode(null);
    setView('pages');
    setZoom(1);
    setPan({ x: 20, y: 20 });
  };

  const backToModules = () => {
    setView('modules');
    setSelectedModule(null);
    setSelectedNode(null);
    setZoom(0.85);
    setPan({ x: 20, y: 20 });
  };

  // Active edges based on hovered/selected
  const currentEdges = view === 'modules'
    ? MODULE_EDGES
    : selectedModule ? (PAGE_EDGES[selectedModule.id] || []) : [];

  const activeEdges = selectedNode
    ? getEdgesForNode(selectedNode.id, currentEdges)
    : hoveredNode
    ? getEdgesForNode(hoveredNode.id, currentEdges)
    : [];

  const activeNodeIds = new Set(activeEdges.flatMap(e => [e[0], e[1]]));
  const isFiltered = activeNodeIds.size > 0;

  // Pan/zoom
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('.node-group')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!isPanning || !panStart.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [isPanning]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.min(2.5, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Page layout for drilldown
  const pageNodes = selectedModule ? getPageLayout(selectedModule) : [];

  // Connection detail for right panel
  const connectedEdgeDetails = selectedNode ? getEdgesForNode(selectedNode.id, currentEdges) : [];

  // Get name from id for page view
  const getPageName = (id) => pageNodes.find(p => p.id === id)?.label || id;

  const allEdgeColors = [...new Set(currentEdges.map(e => e[3]))];

  return (
    <div className="flex flex-col bg-gray-950 text-white" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          {view === 'pages' && (
            <button
              onClick={backToModules}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← All Modules
            </button>
          )}
          {view === 'pages' && <span className="text-gray-600">/</span>}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              {view === 'modules' ? 'Platform Workflow Map' : `${selectedModule?.label} — Page Flow`}
            </h1>
            <p className="text-xs text-gray-500">
              {view === 'modules'
                ? 'Click a module to explore connections · Double-click to drill into pages · Scroll to zoom'
                : 'Pages and their internal connections · Click to inspect'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => { setView('modules'); setSelectedModule(null); setSelectedNode(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'modules' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Modules
            </button>
            <button
              onClick={() => selectedModule ? setView('pages') : null}
              disabled={!selectedModule}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'pages' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Pages
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowLegend(l => !l)} className="text-xs border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 h-8">
            <Info className="w-3.5 h-3.5 mr-1" /> Legend
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 h-8 w-8 p-0">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 h-8 w-8 p-0">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setZoom(view === 'modules' ? 0.85 : 1); setPan({ x: 20, y: 20 }); }} className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 h-8 w-8 p-0">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
          <svg ref={svgRef} width="100%" height="100%"
            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          >
            <EdgeArrows colors={allEdgeColors} />
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              <GridBackground />

              {/* ── MODULE VIEW ── */}
              {view === 'modules' && (
                <>
                  {/* Module edges */}
                  {MODULE_EDGES.map((edge, i) => {
                    const from = getModuleById(edge[0]);
                    const to = getModuleById(edge[1]);
                    if (!from || !to) return null;
                    const isActive = activeEdges.some(ae => ae === edge);
                    const isDimmed = isFiltered && !isActive;
                    const x1 = from.x + MOD_W / 2, y1 = from.y + MOD_H / 2;
                    const x2 = to.x + MOD_W / 2, y2 = to.y + MOD_H / 2;
                    return (
                      <g key={i}>
                        <path
                          d={curvedPath(x1, y1, x2, y2)}
                          fill="none"
                          stroke={edge[3]}
                          strokeWidth={isActive ? 2.5 : 1}
                          strokeOpacity={isDimmed ? 0.04 : isActive ? 1 : 0.25}
                          markerEnd={`url(#arr-${edge[3].replace('#', '')})`}
                          filter={isActive ? 'url(#glow)' : undefined}
                        />
                        {isActive && (
                          <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7}
                            textAnchor="middle" fontSize="8.5" fill={edge[3]} opacity="0.95"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}>
                            {edge[2]}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Module nodes */}
                  {MODULES.map(mod => {
                    const isSel = selectedNode?.id === mod.id;
                    const isHov = hoveredNode?.id === mod.id;
                    const isDimmed = isFiltered && !activeNodeIds.has(mod.id) && !isSel;
                    const isConn = activeNodeIds.has(mod.id) && !isSel;
                    return (
                      <g key={mod.id} className="node-group"
                        transform={`translate(${mod.x},${mod.y})`}
                        onClick={() => setSelectedNode(prev => prev?.id === mod.id ? null : mod)}
                        onDoubleClick={() => drillIntoModule(mod)}
                        onMouseEnter={() => setHoveredNode(mod)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {isSel && (
                          <rect x={-5} y={-5} width={MOD_W + 10} height={MOD_H + 10} rx={11}
                            fill="none" stroke={mod.color} strokeWidth={3} opacity={0.7} filter="url(#glow)" />
                        )}
                        {isConn && (
                          <rect x={-2} y={-2} width={MOD_W + 4} height={MOD_H + 4} rx={9}
                            fill="none" stroke={mod.color} strokeWidth={1.5} opacity={0.5} />
                        )}
                        <rect width={MOD_W} height={MOD_H} rx={8}
                          fill={mod.color}
                          opacity={isDimmed ? 0.12 : isSel || isHov ? 1 : 0.82}
                          stroke={mod.color} strokeWidth={1}
                        />
                        <text x={MOD_W / 2} y={MOD_H / 2}
                          dominantBaseline="middle" textAnchor="middle"
                          fontSize={mod.label.length > 13 ? 9 : 11}
                          fontWeight="700" fill="#fff"
                          opacity={isDimmed ? 0.2 : 1}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}>
                          {mod.label}
                        </text>
                        {/* Page count badge */}
                        <g opacity={isDimmed ? 0.1 : 1}>
                          <circle cx={MOD_W - 9} cy={9} r={9} fill="rgba(0,0,0,0.4)" />
                          <text x={MOD_W - 9} y={9} dominantBaseline="middle" textAnchor="middle"
                            fontSize={7} fill="#fff" fontWeight="700"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}>
                            {mod.pages.length}
                          </text>
                        </g>
                        {/* Drill-in hint */}
                        {isHov && (
                          <text x={MOD_W / 2} y={MOD_H + 13} textAnchor="middle" fontSize="8"
                            fill={mod.color} opacity={0.8}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}>
                            dbl-click to drill in
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              )}

              {/* ── PAGE VIEW ── */}
              {view === 'pages' && selectedModule && (
                <>
                  {/* Center module node */}
                  <g transform="translate(435, 385)">
                    <rect width={130} height={50} rx={10}
                      fill={selectedModule.color} opacity={0.95}
                      stroke={selectedModule.color} strokeWidth={2} filter="url(#glow)" />
                    <text x={65} y={25} dominantBaseline="middle" textAnchor="middle"
                      fontSize={12} fontWeight="800" fill="#fff"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {selectedModule.label}
                    </text>
                    <text x={65} y={40} dominantBaseline="middle" textAnchor="middle"
                      fontSize={8} fill="rgba(255,255,255,0.7)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {selectedModule.pages.length} pages
                    </text>
                  </g>

                  {/* Spokes from center to each page node */}
                  {pageNodes.map(page => (
                    <line key={`spoke-${page.id}`}
                      x1={500} y1={410}
                      x2={page.x + PAGE_W / 2} y2={page.y + PAGE_H / 2}
                      stroke={selectedModule.color} strokeWidth={0.8} strokeOpacity={0.2}
                      strokeDasharray="4 3"
                    />
                  ))}

                  {/* Page-level edges */}
                  {(PAGE_EDGES[selectedModule.id] || []).map((edge, i) => {
                    const from = pageNodes.find(p => p.id === edge[0]);
                    const to = pageNodes.find(p => p.id === edge[1]);
                    if (!from || !to) return null;
                    const isActive = activeEdges.some(ae => ae === edge);
                    const isDimmed = isFiltered && !isActive;
                    const x1 = from.x + PAGE_W / 2, y1 = from.y + PAGE_H / 2;
                    const x2 = to.x + PAGE_W / 2, y2 = to.y + PAGE_H / 2;
                    return (
                      <g key={i}>
                        <path
                          d={curvedPath(x1, y1, x2, y2)}
                          fill="none"
                          stroke={edge[3]}
                          strokeWidth={isActive ? 2.5 : 1.2}
                          strokeOpacity={isDimmed ? 0.05 : isActive ? 1 : 0.35}
                          markerEnd={`url(#arr-${edge[3].replace('#', '')})`}
                          filter={isActive ? 'url(#glow)' : undefined}
                        />
                        {isActive && (
                          <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7}
                            textAnchor="middle" fontSize="8" fill={edge[3]} opacity="0.9"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}>
                            {edge[2]}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Page nodes */}
                  {pageNodes.map(page => {
                    const isSel = selectedNode?.id === page.id;
                    const isHov = hoveredNode?.id === page.id;
                    const isDimmed = isFiltered && !activeNodeIds.has(page.id) && !isSel;
                    const isConn = activeNodeIds.has(page.id) && !isSel;
                    const col = selectedModule.color;
                    return (
                      <g key={page.id} className="node-group"
                        transform={`translate(${page.x},${page.y})`}
                        onClick={() => setSelectedNode(prev => prev?.id === page.id ? null : page)}
                        onMouseEnter={() => setHoveredNode(page)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {isSel && (
                          <rect x={-4} y={-4} width={PAGE_W + 8} height={PAGE_H + 8} rx={10}
                            fill="none" stroke={col} strokeWidth={2.5} opacity={0.7} filter="url(#glow)" />
                        )}
                        {isConn && (
                          <rect x={-2} y={-2} width={PAGE_W + 4} height={PAGE_H + 4} rx={8}
                            fill="none" stroke={col} strokeWidth={1.5} opacity={0.5} />
                        )}
                        <rect width={PAGE_W} height={PAGE_H} rx={7}
                          fill={col}
                          fillOpacity={isDimmed ? 0.1 : isSel || isHov ? 1 : 0.75}
                          stroke={col} strokeWidth={1}
                        />
                        <text x={PAGE_W / 2} y={PAGE_H / 2}
                          dominantBaseline="middle" textAnchor="middle"
                          fontSize={page.label.length > 14 ? 9 : 10.5}
                          fontWeight="600" fill="#fff"
                          opacity={isDimmed ? 0.2 : 1}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}>
                          {page.label}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </g>
          </svg>

          {/* Bottom zoom badge */}
          <div className="absolute bottom-3 left-3 text-xs text-gray-500 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
            {Math.round(zoom * 100)}%
          </div>

          {/* Page view hint overlay */}
          {view === 'modules' && !selectedNode && !hoveredNode && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-600 bg-gray-900/80 px-3 py-2 rounded border border-gray-800 max-w-xs text-right">
              Click = inspect · Double-click = drill into pages · Hover = highlight connections
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        {selectedNode ? (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-800 flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3.5 h-3.5 rounded-sm shrink-0 mt-0.5"
                  style={{ background: view === 'pages' ? selectedModule?.color : selectedNode.color }} />
                <div className="min-w-0">
                  {view === 'pages' && (
                    <p className="text-xs text-gray-500 mb-0.5">{selectedModule?.label}</p>
                  )}
                  <h2 className="font-bold text-base text-white leading-snug truncate">{selectedNode.label}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-sm">
              {/* Description */}
              <p className="text-gray-300 leading-relaxed text-sm">{selectedNode.description}</p>

              {/* Pages list (module view) */}
              {view === 'modules' && selectedNode.pages && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Pages in this module
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.pages.map(p => (
                      <span key={p.id || p} className="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-300">
                        {p.label || p}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => drillIntoModule(selectedNode)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" /> Drill into page flow
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Connections */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Connections ({connectedEdgeDetails.length})
                </p>
                {connectedEdgeDetails.length === 0 ? (
                  <p className="text-xs text-gray-600 italic">No mapped connections yet</p>
                ) : (
                  <div className="space-y-2">
                    {connectedEdgeDetails.map((edge, i) => {
                      const isOut = edge[0] === selectedNode.id;
                      const otherId = isOut ? edge[1] : edge[0];
                      const other = view === 'modules'
                        ? getModuleById(otherId)
                        : pageNodes.find(p => p.id === otherId);
                      return (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/40">
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: edge[3] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-gray-500 text-xs font-mono">{isOut ? '→' : '←'}</span>
                              <span className="text-white font-semibold text-xs">{other?.label || otherId}</span>
                            </div>
                            <p className="text-gray-400 text-xs leading-snug mb-1">{edge[4]}</p>
                            <span className="text-xs font-medium" style={{ color: edge[3] }}>{edge[2]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : showLegend ? (
          <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Legend</span>
              <button onClick={() => setShowLegend(false)} className="text-gray-600 hover:text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1.5">
              {CONNECTION_TYPES.map(ct => (
                <div key={ct.color} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 shrink-0">
                    <div className="w-5 h-0.5" style={{ background: ct.color }} />
                    <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `6px solid ${ct.color}` }} />
                  </div>
                  <span className="text-xs text-gray-400 leading-tight">{ct.label}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">6</div>
                  <span className="text-xs text-gray-500">Badge = page count</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-purple-500 bg-purple-900 shrink-0" />
                  <span className="text-xs text-gray-500">Glow = selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-purple-500 bg-transparent shrink-0" />
                  <span className="text-xs text-gray-500">Outline = connected</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">Node types</p>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-4 rounded bg-violet-700 shrink-0" />
                  <span className="text-xs text-gray-500">Module</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-4 rounded bg-violet-500 opacity-75 shrink-0" />
                  <span className="text-xs text-gray-500">Page (drilldown)</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}