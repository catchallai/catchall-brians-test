import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Download, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sections = {
  legal: {
    title: 'Legal Module',
    color: 'indigo',
    pages: [
      {
        name: 'Legal Dashboard',
        icon: '⚖️',
        description: 'High-level legal operations overview',
        whatItDoes: 'Provides a consolidated view of all legal matters, litigation exposure, upcoming deadlines, budget vs actuals, and risk concentration across the organization.',
        howItWorks: 'Aggregates data from Matters, Litigation, Obligations, and Counsel to surface key metrics. Shows upcoming deadlines, open matters by type, and total legal spend.',
        useCases: [
          'Give GC and CLO an instant operational snapshot',
          'Track legal spend across all matters in real time',
          'Surface upcoming deadlines to avoid missed filings',
          'Identify concentration risk in litigation portfolio',
          'Report on legal operations to executive leadership',
        ],
        businessValue: 'Reduce legal risk through visibility. Prevent costly missed deadlines and filings. Demonstrate legal department value to the business.',
      },
      {
        name: 'Legal Matters',
        icon: '📁',
        description: 'Track all legal cases and projects',
        whatItDoes: 'Centralized tracking of every legal matter including type, status, assigned attorney, deadlines, estimated vs actual costs, and associated documents.',
        howItWorks: 'Create matters with type classification, assign ownership, set deadlines and budgets, track status changes, upload documents, and log activity.',
        useCases: [
          'Single source of truth for all active legal work',
          'Track legal spend by matter and attorney',
          'Ensure deadlines are never missed',
          'Support outside counsel management',
          'Provide executive reporting on legal portfolio',
        ],
        businessValue: 'Reduce legal spend by 10-20% through better matter management and outside counsel oversight. Prevent costly missed deadlines.',
      },
      {
        name: 'Litigation Management',
        icon: '⚔️',
        description: 'Manage active lawsuits and disputes',
        whatItDoes: 'Tracks all active litigation including case details, court information, hearing dates, claim amounts, settlement negotiations, and legal reserves.',
        howItWorks: 'Create case records with court, jurisdiction, opposing counsel, and role. Track hearing dates, update status through litigation stages, log settlement discussions, manage reserves.',
        useCases: [
          'Never miss a court date or filing deadline',
          'Track litigation exposure for financial reporting',
          'Manage legal reserves and settlement authority',
          'Coordinate outside counsel on active cases',
          'Identify patterns in litigation to reduce future risk',
        ],
        businessValue: 'Reduce litigation costs through proactive management. Ensure accurate reserve reporting for financial statements. Avoid default judgments from missed deadlines.',
      },
      {
        name: 'Legal Obligations',
        icon: '📜',
        description: 'Regulatory and contractual obligation tracking',
        whatItDoes: 'Tracks recurring legal and regulatory obligations including permits, licenses, filings, reporting requirements, and contractual commitments with due dates and recurrence schedules.',
        howItWorks: 'Create obligation records with type, recurrence, owner, and due dates. System highlights upcoming obligations. Track completion and renewal.',
        useCases: [
          'Prevent regulatory fines from missed filings',
          'Track all permit and license renewals',
          'Ensure contractual obligations are fulfilled on time',
          'Assign clear ownership for each obligation',
          'Audit trail for regulatory compliance',
        ],
        businessValue: 'Avoid regulatory fines and penalties that can range from thousands to millions. Demonstrate compliance to regulators and auditors.',
      },
      {
        name: 'Intellectual Property',
        icon: '💡',
        description: 'IP portfolio management and protection',
        whatItDoes: 'Manages the full IP portfolio including patents, trademarks, copyrights, trade secrets, and domains with renewal tracking, valuation, and licensing.',
        howItWorks: 'Create IP asset records with type, registration details, jurisdiction, and key dates. System tracks upcoming renewals. Supports licensing and ownership tracking.',
        useCases: [
          'Never lose IP protection from missed renewals',
          'Track total IP portfolio value',
          'Manage licensing agreements and royalties',
          'Coordinate with outside patent counsel',
          'Support M&A due diligence with IP inventory',
        ],
        businessValue: 'Protect millions in IP value from lapsing due to missed renewals. Support M&A transactions with accurate IP inventory.',
      },
      {
        name: 'Legal Counsel Management',
        icon: '👤',
        description: 'Manage internal and external counsel',
        whatItDoes: 'Tracks all legal counsel including in-house attorneys, outside firms, and contract lawyers with specializations, rates, retainers, and spend tracking.',
        howItWorks: 'Create counsel profiles with type, specialization, bar number, jurisdiction, rates, and retainer amounts. Track YTD spend per counsel. Link counsel to matters.',
        useCases: [
          'Track outside counsel spend vs budget',
          'Compare rates across firms for budget planning',
          'Ensure the right specialist is on each matter',
          'Monitor retainer utilization',
          'Support outside counsel convergence initiatives',
        ],
        businessValue: 'Reduce outside counsel spend by 10-15% through better oversight and rate management.',
      },
      {
        name: 'Legal Entities',
        icon: '🏢',
        description: 'Corporate structure and entity management',
        whatItDoes: 'Tracks all legal entities in the corporate group including type, jurisdiction, registration numbers, parent-subsidiary relationships, and compliance dates.',
        howItWorks: 'Create entity records with type, jurisdiction, EIN, registered agent, and key dates. Map parent-subsidiary relationships. Track annual report due dates and dissolution dates.',
        useCases: [
          'Maintain accurate corporate structure map',
          'Track annual report and filing deadlines by entity',
          'Support M&A integration and restructuring',
          'Manage registered agent information',
          'Provide accurate corporate structure to auditors',
        ],
        businessValue: 'Prevent entity dissolution from missed filings. Support M&A transactions with accurate entity inventory.',
      },
    ],
  },
  compliance: {
    title: 'Compliance Module',
    color: 'emerald',
    pages: [
      {
        name: 'Compliance Dashboard',
        icon: '🛡️',
        description: 'Compliance posture at a glance',
        whatItDoes: 'Aggregates compliance metrics across policies, training, incidents, audits, and risks to provide an executive view of the organization\'s compliance health.',
        howItWorks: 'Pulls data from all compliance sub-modules to calculate completion rates, open items, risk scores, and trend indicators.',
        useCases: [
          'Board and executive compliance reporting',
          'Identify highest-risk compliance areas',
          'Track compliance program maturity over time',
          'Prioritize compliance investments',
          'Support regulatory examinations with evidence',
        ],
        businessValue: 'Demonstrate compliance program effectiveness to regulators, auditors, and the board. Reduce examination findings.',
      },
      {
        name: 'Policies',
        icon: '📋',
        description: 'Policy lifecycle management',
        whatItDoes: 'Creates, versions, distributes, and tracks acknowledgment of compliance policies across the organization.',
        howItWorks: 'Create policies with category, owner, and review dates. Publish to employees. Track acknowledgment rates. Version policies and archive outdated versions.',
        useCases: [
          'Ensure all employees have read required policies',
          'Track policy acknowledgment for audits',
          'Manage policy review cycles',
          'Distribute policy updates quickly',
          'Demonstrate compliance culture to regulators',
        ],
        businessValue: 'Reduce regulatory risk through documented policy distribution. Defend against employee misconduct claims.',
      },
      {
        name: 'Compliance Training',
        icon: '🎓',
        description: 'Training program administration',
        whatItDoes: 'Creates, assigns, and tracks completion of compliance training programs across departments with due date management.',
        howItWorks: 'Create training programs with target departments, due dates, and frequency. Track completion rates. Send reminders. Archive completed training.',
        useCases: [
          'Meet mandatory training requirements',
          'Track completion for audit evidence',
          'Identify departments with low completion rates',
          'Automate training assignment for new hires',
          'Support regulatory training mandates',
        ],
        businessValue: 'Meet training mandates to avoid regulatory penalties. Reduce compliance incidents through better education.',
      },
      {
        name: 'Export Control',
        icon: '🌍',
        description: 'EAR/ITAR/OFAC compliance management',
        whatItDoes: 'Manages export control programs, technology control plans, deemed export tracking, personnel authorization, and violation reporting under EAR, ITAR, and OFAC.',
        howItWorks: 'Organize by program, create TCPs for controlled technology, log deemed exports for review, track authorized personnel and training, report violations.',
        useCases: [
          'Manage ITAR/EAR compliance programs',
          'Track deemed exports to foreign nationals',
          'Maintain TCPs for all controlled programs',
          'Ensure personnel training is current',
          'Document voluntary disclosures',
        ],
        businessValue: 'Avoid export control fines that can reach $1M+ per violation. Maintain export privileges and government contracts.',
      },
      {
        name: 'Risk Register',
        icon: '⚠️',
        description: 'Compliance risk identification and mitigation',
        whatItDoes: 'Documents, scores, and tracks compliance risks with likelihood/impact assessment, mitigation plans, and status tracking.',
        howItWorks: 'Create risk records with category, likelihood, and impact scores. System calculates risk score. Assign mitigation plans and owners. Track through resolution.',
        useCases: [
          'Identify and prioritize compliance risks',
          'Assign ownership for risk mitigation',
          'Track mitigation progress over time',
          'Support risk-based audit planning',
          'Demonstrate risk management to regulators',
        ],
        businessValue: 'Proactively manage risks before they become incidents. Support risk-based compliance program design.',
      },
    ],
  },
  hris: {
    title: 'HRIS & People Operations Module',
    color: 'teal',
    pages: [
      {
        name: 'Employee Management',
        icon: '👥',
        description: 'Full employee lifecycle management',
        whatItDoes: 'Maintains comprehensive employee profiles including personal info, work details, compensation, benefits, documents, and employment history.',
        howItWorks: 'Create employee records with all relevant fields. Link to departments, managers, and roles. Track status changes (active, on leave, terminated). Store documents securely.',
        useCases: [
          'Single source of truth for all employee data',
          'Support HR operations and employee inquiries',
          'Maintain audit trail for compliance',
          'Support payroll and benefits administration',
          'Enable people analytics and workforce planning',
        ],
        businessValue: 'Reduce HR admin time by 30-40%. Ensure compliance with employment record requirements. Support data-driven people decisions.',
      },
      {
        name: 'Payroll Management',
        icon: '💰',
        description: 'Payroll tracking and compensation management',
        whatItDoes: 'Tracks payroll runs, compensation changes, deductions, and pay history for all employees.',
        howItWorks: 'Log payroll runs with amounts, deductions, and pay dates. Track compensation changes with effective dates. Generate pay summaries.',
        useCases: [
          'Track payroll costs for budgeting',
          'Maintain compensation history for reviews',
          'Support finance with payroll data',
          'Document compensation decisions',
          'Track total compensation including benefits',
        ],
        businessValue: 'Improve payroll accuracy and reduce errors. Support finance with accurate headcount cost data.',
      },
      {
        name: 'Benefits Administration',
        icon: '❤️',
        description: 'Benefits catalog and enrollment tracking',
        whatItDoes: 'Manages benefits programs, tracks employee enrollment, and monitors benefit costs across the organization.',
        howItWorks: 'Create benefit programs, set open enrollment periods, employees enroll through system, track coverage and costs.',
        useCases: [
          'Manage benefits enrollment and changes',
          'Track total benefits cost per employee',
          'Support open enrollment periods',
          'Communicate benefits to employees',
          'Provide data to benefits brokers',
        ],
        businessValue: 'Reduce benefits administration time by 40-50%. Improve employee experience during enrollment.',
      },
      {
        name: 'Onboarding & Offboarding',
        icon: '🚀',
        description: 'Structured hire and exit workflows',
        whatItDoes: 'Manages structured onboarding task checklists for new hires and offboarding workflows for departing employees.',
        howItWorks: 'Create onboarding records for new hires, assign tasks with due dates, track completion, collect documents. Mirror process for offboarding.',
        useCases: [
          'Ensure consistent onboarding experience',
          'Reduce time-to-productivity for new hires',
          'Prevent offboarding tasks from being missed',
          'Track equipment return and access revocation',
          'Collect exit interview feedback',
        ],
        businessValue: 'Reduce new hire ramp time by 20-30%. Prevent security risks from incomplete offboarding.',
      },
      {
        name: 'Performance Management',
        icon: '🎯',
        description: 'Goals, reviews, and career development',
        whatItDoes: 'Manages OKR/KPI goal setting, performance reviews, 360 feedback, and career development planning.',
        howItWorks: 'Employees and managers set goals, mid-year and annual reviews conducted, feedback collected from peers, development plans created.',
        useCases: [
          'Align employee goals with company objectives',
          'Support fair and consistent performance reviews',
          'Identify top performers and promotion candidates',
          'Document performance issues for legal protection',
          'Drive employee development and retention',
        ],
        businessValue: 'Improve employee retention by 15-20% through better development programs. Reduce wrongful termination risk through documented performance management.',
      },
      {
        name: 'Equity Management',
        icon: '📈',
        description: 'Equity pools, grants, and vesting',
        whatItDoes: 'Manages equity pool setup, grant issuance, vesting schedule tracking, and exercise recording for comprehensive cap table support.',
        howItWorks: 'Set up equity pools, create grants per employee with vesting schedules, system tracks vested/unvested shares, record exercises and cancellations.',
        useCases: [
          'Track all equity grants and vesting',
          'Support cap table management',
          'Communicate equity value to employees',
          'Track exercises for tax reporting',
          'Support 409A valuations with grant data',
        ],
        businessValue: 'Reduce equity administration errors that can cost companies significantly in tax and legal issues. Improve employee understanding of equity value.',
      },
    ],
  },
  crmCore: {
    title: 'CRM Core Module',
    color: 'violet',
    pages: [
      {
        name: 'Contacts',
        icon: '👥',
        description: 'Centralized contact database',
        whatItDoes:
          'Manages all customer and prospect information in a single, searchable database with automatic data enrichment and deduplication.',
        howItWorks:
          'Contacts can be added manually, imported via CSV, auto-created from web forms, or synced from integrations. System enriches data from LinkedIn and company websites. Contacts link to Companies and Deals for relationship mapping.',
        useCases: [
          "Never lose a prospect's information or history",
          'Prevent duplicate outreach efforts',
          'Quick access to decision-maker contact info',
          'Automatic enrichment saves manual research time',
          'Track multi-person relationships within accounts',
        ],
        businessValue:
          'Saves 5+ hours per week per sales rep on data entry and research. Prevents duplicate contacts which typically cost 15-20% of outreach budget.',
      },
      {
        name: 'Companies',
        icon: '🏢',
        description: 'Organization profiles and relationships',
        whatItDoes:
          'Maintains comprehensive organization information including industry, size, funding, news, and relationships with other companies.',
        howItWorks:
          'Create companies manually or auto-populate from contact company fields. AI enrichment pulls intelligence from multiple sources. News feeds update daily. Relationships tracked for ecosystem mapping.',
        useCases: [
          'Identify company growth and funding signals',
          'Track industry trends affecting target accounts',
          'Discover partnership and competitor relationships',
          'Understand organizational hierarchy and decision makers',
          'Monitor company news for sales opportunities',
        ],
        businessValue:
          'Provides context that enables 30% higher win rates on complex deals. News alerts trigger proactive outreach at key moments.',
      },
      {
        name: 'Deals/Opportunities',
        icon: '🎯',
        description: 'Sales pipeline and revenue tracking',
        whatItDoes:
          'Tracks all sales opportunities through multiple pipeline stages with probability-weighted revenue forecasting and automation.',
        howItWorks:
          'Deals created manually or auto-generated from opportunities. Drag-and-drop Kanban board for pipeline management. Status changes trigger automation rules. Probability calculations based on historical win rates.',
        useCases: [
          'Single source of truth for sales pipeline',
          'Accurate revenue forecasting by deal stage',
          'Identify early warning signs of deal slippage',
          'Automate follow-ups so nothing falls through cracks',
          'Analyze win/loss patterns to improve sales process',
        ],
        businessValue:
          'Improve forecast accuracy by 25-30%. Reduce sales cycle by 20% through better pipeline visibility and automation.',
      },
      {
        name: 'Activities',
        icon: '📞',
        description: 'Interaction and engagement tracking',
        whatItDoes:
          'Complete audit trail of all customer interactions including emails, calls, meetings, and follow-ups with automatic tracking.',
        howItWorks:
          'Activities logged automatically or manually created. Email tracking uses pixel technology. Calendar integration syncs with Google/Outlook. Activity history used for lead scoring and analytics.',
        useCases: [
          'Prevent lost follow-ups when team members leave',
          'Track all customer communication in one place',
          'Measure sales rep productivity and activity levels',
          'Identify best practices by analyzing top performers',
          'Trigger automations based on customer engagement',
        ],
        businessValue:
          "Reduce lost opportunities by 40% from better handoffs. Identify top performers' tactics and replicate across team.",
      },
      {
        name: 'Relationships & Network',
        icon: '🔗',
        description: 'Complex relationship visualization',
        whatItDoes:
          'Visual network graph showing relationships between contacts, companies, and deals to identify key stakeholders and deal dynamics.',
        howItWorks:
          'System creates relationship graph from contact/company/deal associations. Visualization shows network dependencies and influencers. Identifies multi-threading opportunities.',
        useCases: [
          'Identify all stakeholders in complex deals',
          'Understand decision-making hierarchy',
          'Build relationships with multiple contacts at account',
          'Reduce deal risk by knowing who influences whom',
          'Discover champion relationships early in sales process',
        ],
        businessValue:
          'Increase deal size by 25-30% through multi-threading. Reduce deal risk by identifying and managing all stakeholders.',
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
        whatItDoes:
          'Create automated email sequences with delays, conditions, and personalization that nurture leads systematically without manual effort.',
        howItWorks:
          'Define sequence template with email steps and timing. Set enrollment criteria. System automatically enrolls matching leads. Each step sends based on delays/triggers. Engagement metrics tracked for optimization.',
        useCases: [
          'Automate lead nurturing at scale',
          'Ensure consistent follow-up cadence',
          'Test different messaging and timing',
          'Track which sequences convert best',
          'Free up sales reps to focus on high-touch deals',
        ],
        businessValue:
          'Increase pipeline by 40-50% by nurturing more leads simultaneously. Convert 15-20% more leads through consistent follow-up.',
      },
      {
        name: 'Proposals & Quotes',
        icon: '📄',
        description: 'Professional proposal creation and tracking',
        whatItDoes:
          'Create branded proposals with pricing, send digitally, track views, and collect e-signatures with seamless CRM integration.',
        howItWorks:
          'Select template, populate with deal details and line items (auto-priced), route through approvals, send with tracking link, monitor views and signature status.',
        useCases: [
          'Reduce proposal creation time from hours to minutes',
          'Know immediately when prospects view proposals',
          'Identify objections based on which sections they review',
          'Legally binding signatures without printing',
          "Automated follow-ups when prospects view but don't sign",
        ],
        businessValue:
          'Accelerate deal closure by 3-5 days through faster turnarounds. Increase close rates by 15-20% through timely follow-ups.',
      },
      {
        name: 'Meeting Scheduler',
        icon: '📅',
        description: 'Frictionless meeting booking',
        whatItDoes:
          'Enable prospects to self-schedule meetings from a booking link with automatic calendar syncing and timezone handling.',
        howItWorks:
          'Create availability in calendar, share booking link, prospects select time (auto-adjusts timezone), calendar invite and video link generated automatically.',
        useCases: [
          'Eliminate back-and-forth scheduling emails',
          'Reduce time-zone confusion and no-shows',
          'Scale one-on-one meetings without hiring calendar coordinators',
          'Automatic CRM record creation for every meeting',
          'Built-in video conferencing eliminates tool switching',
        ],
        businessValue:
          'Save 5+ hours per week on scheduling. Increase meeting attendance by 10-15% through convenience.',
      },
      {
        name: 'Sales Call Logging',
        icon: '☎️',
        description: 'Call documentation and analysis',
        whatItDoes:
          'Log calls with automatic duration tracking, outcome recording, transcription, and sentiment analysis for coaching and analytics.',
        howItWorks:
          'Log call manually or auto-capture from phone system, record outcome and next steps, transcription captured, sentiment analyzed, follow-up tasks auto-created.',
        useCases: [
          'Protect company from disputes with call records',
          'Coach sales reps using actual call insights',
          'Identify common objections across team',
          'Ensure follow-ups happen after every call',
          'Measure talk-to-listen ratio of top performers',
        ],
        businessValue:
          'Improve sales rep effectiveness by 20-25% through coaching on real call data. Identify scaling coaching topics.',
      },
      {
        name: 'Sales Forecasting',
        icon: '📊',
        description: 'Revenue prediction and pipeline health',
        whatItDoes:
          'Automatically calculate weighted pipeline forecast based on deal values, stages, and historical close rates.',
        howItWorks:
          'System aggregates deals, applies probability weights by stage, calculates expected revenue, compares to actuals for variance analysis.',
        useCases: [
          'Provide board with accurate revenue forecasts',
          'Identify at-risk deals early for intervention',
          'Measure sales team performance against quota',
          'Detect changes in team productivity',
          'Support financial planning and resource allocation',
        ],
        businessValue:
          "Improve forecast accuracy by 30-40%. Identify and save 5-10% of at-risk revenue before it's lost.",
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
        whatItDoes:
          'Build and execute email campaigns with segmentation, personalization, A/B testing, and comprehensive analytics.',
        howItWorks:
          'Design email in template builder, segment audience using rules, A/B test variants, schedule delivery with timezone optimization, monitor opens/clicks in real-time.',
        useCases: [
          'Reach right audience with relevant messaging',
          'Test and optimize email performance',
          'Track ROI of email marketing campaigns',
          'Maintain compliance with email regulations',
          'Nurture leads through automated sequences',
        ],
        businessValue:
          'Increase email open rates by 25-35% through segmentation. Improve click rates by 40-50% through A/B testing and personalization.',
      },
      {
        name: 'Content Calendar',
        icon: '📆',
        description: 'Multi-channel content coordination',
        whatItDoes:
          'Plan and coordinate all content across email, social, blog, and web with approval workflows and publishing automation.',
        howItWorks:
          'Plan topics in calendar, assign to team members, route through approval workflow, auto-publish on configured channels, track performance.',
        useCases: [
          'Ensure consistent publishing schedule across channels',
          'Prevent content gaps and redundancy',
          'Track content performance across platforms',
          'Coordinate team around content strategy',
          'Identify top-performing content types for replication',
        ],
        businessValue:
          'Increase publishing consistency which drives 30-40% more traffic. Reduce administrative overhead by 50% through automation.',
      },
      {
        name: 'Lead Scoring',
        icon: '⭐',
        description: 'Lead qualification automation',
        whatItDoes:
          'Automatically score leads based on engagement and demographics to identify sales-ready prospects.',
        howItWorks:
          'Define scoring rules (points for each behavior), system assigns points as behaviors occur, grade assigned based on total score, auto-route qualified leads to sales.',
        useCases: [
          'Know which leads are ready for sales conversation',
          'Prioritize sales rep time on hottest prospects',
          'Prevent premature sales outreach',
          'Measure content effectiveness by lead scores',
          'Align sales and marketing on lead quality',
        ],
        businessValue:
          'Increase sales productivity by 25-30% by focusing on qualified leads. Improve sales/marketing alignment and reduce friction.',
      },
      {
        name: 'Landing Pages',
        icon: '🌐',
        description: 'Conversion-optimized page builder',
        whatItDoes:
          'Create landing pages without coding, test variants, track conversions, and automatically integrate with CRM.',
        howItWorks:
          'Select template or start blank, customize design, add forms with CRM auto-population, publish to custom domain, track performance and optimize.',
        useCases: [
          'Launch campaigns quickly without developer involvement',
          'Test different messaging and design with A/B variants',
          'Track conversion rates by campaign and page variant',
          'Automatically populate forms with known contact data',
          'Support multi-channel campaigns with unique landing pages',
        ],
        businessValue:
          'Reduce time-to-campaign from weeks to days. Increase conversion rates by 15-25% through continuous testing.',
      },
      {
        name: 'Marketing Campaigns',
        icon: '🎪',
        description: 'Multi-channel campaign orchestration',
        whatItDoes:
          'Orchestrate complex, multi-touch campaigns across email, landing pages, social, and other channels with centralized tracking.',
        howItWorks:
          'Create campaign workflow, configure channels and messaging, set budget/timeline, launch automated workflow, track ROI through analytics.',
        useCases: [
          'Execute coordinated multi-channel campaigns',
          'Track campaign ROI and cost per lead',
          'Attribute revenue back to campaigns',
          'Optimize spending toward highest-performing campaigns',
          'Support marketing accountability to finance',
        ],
        businessValue:
          'Increase campaign ROI by 30-40% through better optimization. Demonstrate marketing value and secure budget for future campaigns.',
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
        whatItDoes:
          'Predict customer churn risk using multi-factor health scores and alert CSMs to at-risk accounts for intervention.',
        howItWorks:
          'Configure health score formula, system pulls data from usage/support/billing, calculates daily health score, triggers alerts when score drops, CSM can view dashboard.',
        useCases: [
          'Identify at-risk customers before they churn',
          'Prioritize CSM time on accounts most likely to churn',
          'Measure customer health trends',
          'Support proactive customer engagement',
          'Improve customer retention metrics',
        ],
        businessValue:
          'Reduce churn rate by 15-25% through proactive intervention. Save 5-10% of revenue that would otherwise be lost.',
      },
      {
        name: 'Onboarding Tracking',
        icon: '🚀',
        description: 'Customer implementation management',
        whatItDoes:
          'Manage customer onboarding workflows with task checklists, milestones, and success tracking.',
        howItWorks:
          'Define onboarding workflow with tasks/timelines, assign to CSM and customer, track completion, collect feedback at milestones, identify bottlenecks.',
        useCases: [
          'Ensure every customer successfully implements',
          'Reduce time-to-value for customers',
          'Track CSM productivity and efficiency',
          'Identify common onboarding issues for process improvement',
          'Collect customer feedback on experience early',
        ],
        businessValue:
          'Reduce implementation time by 20-30%. Improve customer satisfaction and reduce early churn by 25-35%.',
      },
      {
        name: 'Customer Feedback',
        icon: '💬',
        description: 'Customer satisfaction and feedback',
        whatItDoes:
          'Collect NPS and CSAT feedback automatically, analyze sentiment, and track action items through resolution.',
        howItWorks:
          'Create surveys with triggers, collect responses, sentiment analyzed and tagged, action items created from negative feedback, track closure.',
        useCases: [
          'Understand customer satisfaction trends',
          'Identify specific pain points driving dissatisfaction',
          'Track improvement over time',
          'Support customer-centric culture',
          'Identify promoters for case studies and referrals',
        ],
        businessValue:
          'Improve NPS by 10-15 points through addressing feedback. Increase referrals and expansion from promoters.',
      },
      {
        name: 'Renewal Management',
        icon: '🔄',
        description: 'Contract renewal tracking and forecasting',
        whatItDoes:
          'Track renewal dates, predict renewal probability, and automate renewal workflows to maximize revenue retention.',
        howItWorks:
          'Track contract end dates, flag 90 days before renewal, CSM initiates renewal conversation, track negotiation progress, prompt for expansion opportunities.',
        useCases: [
          'Never miss a renewal opportunity',
          'Predict renewal revenue accurately',
          'Identify expansion opportunities during renewals',
          'Reduce renewal negotiations time',
          'Support finance forecasting and planning',
        ],
        businessValue:
          'Achieve 95%+ renewal rates (vs. industry 80-85%). Increase expansion revenue by 15-20% during renewals.',
      },
      {
        name: 'Upsell & Expansion',
        icon: '📈',
        description: 'Revenue growth from existing customers',
        whatItDoes:
          'Identify and recommend upsell/cross-sell opportunities based on usage, features, and benchmarking.',
        howItWorks:
          'Analyze usage patterns, identify feature gaps, match against playbooks, recommend upsell to CSM, track conversation and outcome.',
        useCases: [
          'Grow revenue from existing customer base',
          'Identify usage patterns signaling expansion need',
          'Provide CSMs with playbooks for consistent selling',
          'Support revenue growth without new customer acquisition',
          'Improve customer lifetime value',
        ],
        businessValue:
          'Increase expansion revenue by 20-30% with systematic approach. Reduce dependency on new customer acquisition.',
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
        whatItDoes:
          'Track keyword positions daily, analyze trends, identify opportunities, and benchmark against competitors.',
        howItWorks:
          'Configure keywords to track, system crawls search results daily, tracks position and changes, analyzes trends, identifies improvement opportunities.',
        useCases: [
          'Monitor organic search visibility',
          'Identify keywords moving up/down',
          'Validate SEO efforts are working',
          'Find high-opportunity keywords',
          'Benchmark performance vs. competitors',
        ],
        businessValue:
          'Achieve 50-100% more organic traffic through data-driven SEO optimization. Support content strategy with keyword insights.',
      },
      {
        name: 'Technical SEO Audits',
        icon: '🔍',
        description: 'Website health and technical optimization',
        whatItDoes:
          'Crawl website, identify technical SEO issues, and provide prioritized recommendations for fixes.',
        howItWorks:
          'Full site crawl, analyze technical health, generate issues report by severity, recommend fixes with guides, track implementation.',
        useCases: [
          'Ensure website is crawlable by search engines',
          'Identify and fix performance issues',
          'Improve Core Web Vitals for better rankings',
          'Maintain mobile-friendly website',
          'Support development team with priority fixes',
        ],
        businessValue:
          'Improve organic rankings by 15-25% through technical fixes. Reduce bounce rate by 20-30% through performance improvements.',
      },
      {
        name: 'Backlink Analysis',
        icon: '🔗',
        description: 'Link profile analysis and opportunities',
        whatItDoes:
          'Analyze backlink profile, identify quality links, detect toxic links, and find link building opportunities.',
        howItWorks:
          'Index backlink profile, score links for quality/toxicity, benchmark vs. competitors, alert on new links, recommend opportunities.',
        useCases: [
          'Monitor link profile health',
          'Identify and disavow toxic links',
          'Find high-quality link opportunities',
          'Benchmark against competitors',
          'Support link building strategy',
        ],
        businessValue:
          "Improve link profile quality by 30-40%. Identify competitors' link sources to replicate strategy.",
      },
      {
        name: 'Content Performance',
        icon: '📊',
        description: 'Content effectiveness and optimization',
        whatItDoes:
          'Measure content performance, identify gaps, detect cannibalization, and recommend optimizations.',
        howItWorks:
          'Analyze top/underperforming pages, identify content issues, detect topic overlap, recommend consolidation or updates.',
        useCases: [
          'Understand which content drives traffic and conversions',
          'Identify underperforming content for improvement',
          'Detect content cannibalization hurting rankings',
          'Recommend content updates for freshness',
          'Support content strategy with performance data',
        ],
        businessValue:
          'Increase organic traffic by 25-40% through content optimization. Reduce wasted content efforts by 30-40%.',
      },
      {
        name: 'Competitor Analysis',
        icon: '⚔️',
        description: 'Competitive landscape monitoring',
        whatItDoes:
          'Analyze competitor websites, rankings, content, backlinks, and identify opportunities to outrank them.',
        howItWorks:
          'Monitor competitor websites, compare keywords/rankings/content/links, identify ranking opportunities, track strategy changes.',
        useCases: [
          'Understand competitive landscape',
          'Identify high-opportunity keywords competitors rank for',
          'Monitor competitor strategy changes',
          'Find backlink opportunities from competitor sources',
          'Support strategic SEO planning',
        ],
        businessValue:
          'Identify 20-30% more ranking opportunities through competitor analysis. Outrank competitors systematically.',
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
        whatItDoes:
          'Schedule posts across all platforms with optimal timing, hashtags, and media management from single dashboard.',
        howItWorks:
          'Create post in editor, add media/captions/hashtags, select platforms and time, system publishes automatically, tracks performance.',
        useCases: [
          'Maintain consistent posting schedule without manual effort',
          'Optimize posting times for each platform',
          'Create content once, repurpose across platforms',
          'Prevent off-brand or accidental posts',
          'Track which posts perform best',
        ],
        businessValue:
          'Maintain active social presence while reducing team time by 50-60%. Increase engagement by 25-35% through optimal timing.',
      },
      {
        name: 'Social Listening',
        icon: '👂',
        description: 'Brand mention monitoring and sentiment',
        whatItDoes:
          'Monitor all mentions of brand, competitors, and keywords with sentiment analysis and crisis alerts.',
        howItWorks:
          'Configure keywords to monitor, system scans 24/7, sentiment analyzed, alerts triggered for crises or spikes, trends tracked.',
        useCases: [
          'Detect brand mentions and press mentions immediately',
          'Identify brand sentiment and emerging issues',
          'Respond quickly to customer complaints',
          'Monitor competitor mentions and brand perception',
          'Find influencers discussing your brand',
        ],
        businessValue:
          'Prevent PR crises through early detection. Convert negative sentiment to positive through quick response.',
      },
      {
        name: 'Social Engagement',
        icon: '💬',
        description: 'Comment and DM management',
        whatItDoes:
          'Unified inbox for all comments and direct messages with team assignment and response tracking.',
        howItWorks:
          'All comments/DMs flow to unified inbox, team assigned to respond, responses tracked for speed/quality, metrics tracked.',
        useCases: [
          'Respond quickly to customer inquiries',
          'Prevent customer service issues from being missed',
          'Track team response times and quality',
          'Escalate urgent issues to support',
          'Build relationships with engaged community',
        ],
        businessValue:
          'Improve customer satisfaction through faster response times. Convert engaged followers to customers/advocates.',
      },
      {
        name: 'Social Analytics',
        icon: '📈',
        description: 'Performance measurement and ROI',
        whatItDoes:
          'Measure social media impact with metrics, growth tracking, audience insights, and competitive benchmarking.',
        howItWorks:
          'Aggregate metrics from all platforms, calculate engagement rates/growth, identify top content, compare vs. competitors.',
        useCases: [
          'Measure social media ROI and impact',
          'Identify best-performing content types',
          'Track audience growth and engagement trends',
          'Benchmark performance vs. competitors',
          'Support budget decisions with performance data',
        ],
        businessValue:
          'Demonstrate social media ROI to secure budget. Optimize strategy based on performance data to improve results.',
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
        whatItDoes:
          'Create projects with phases, milestones, team allocation, and resource planning with visual timeline.',
        howItWorks:
          'Create project from template, define phases/milestones, assign team members, set dependencies, track progress.',
        useCases: [
          'Plan project scope and timeline clearly',
          'Allocate resources efficiently',
          'Identify critical path and dependencies',
          'Track project progress vs. plan',
          'Support project delivery on time and budget',
        ],
        businessValue:
          'Deliver projects 15-25% faster through better planning. Reduce resource conflicts by 30-40%.',
      },
      {
        name: 'Task Management',
        icon: '✓',
        description: 'Work breakdown and tracking',
        whatItDoes:
          'Break down projects into tasks, assign, track progress, and manage dependencies with notifications.',
        howItWorks:
          'Create tasks with details, assign to team members, team updates status as they progress, manager views board, complete when done.',
        useCases: [
          'Break down work into manageable pieces',
          'Ensure accountability for each task',
          'Track progress and identify bottlenecks',
          'Prevent tasks from falling through cracks',
          'Support resource allocation',
        ],
        businessValue:
          'Improve on-time delivery by 20-30%. Increase team visibility and accountability.',
      },
      {
        name: 'Team Collaboration',
        icon: '👥',
        description: 'Team communication and coordination',
        whatItDoes:
          'Unified communication with comments, mentions, file sharing, and activity feeds.',
        howItWorks:
          'Team members collaborate on shared tasks, comments and mentions keep everyone informed, files stored centrally, activity feed shows updates.',
        useCases: [
          'Reduce email clutter and communication fragmentation',
          'Ensure all team members have visibility into project',
          'Prevent miscommunication and rework',
          'Improve team collaboration and morale',
          'Create audit trail of decisions',
        ],
        businessValue:
          'Reduce communication overhead by 30-40%. Improve team satisfaction and retention.',
      },
      {
        name: 'Kanban Boards',
        icon: '📊',
        description: 'Visual workflow management',
        whatItDoes:
          'Visualize workflow with drag-and-drop columns, WIP limits, and automated transitions.',
        howItWorks:
          'Create board with custom columns, drag cards as work progresses, automation rules trigger on status change.',
        useCases: [
          'Visualize workflow and identify bottlenecks',
          'Enforce WIP limits to prevent overload',
          'Automate status transitions and notifications',
          'Support continuous improvement',
          'Track velocity and productivity',
        ],
        businessValue:
          'Increase team productivity by 15-25%. Identify and remove process bottlenecks.',
      },
      {
        name: 'Time Tracking',
        icon: '⏱️',
        description: 'Resource utilization and billing',
        whatItDoes:
          'Track time spent on projects and tasks for billing, payroll, and profitability analysis.',
        howItWorks:
          'Team logs time against tasks, manager approves timesheet, data used for billing/payroll/profitability analysis.',
        useCases: [
          'Track billable time for accurate customer billing',
          'Measure project profitability',
          'Identify resource utilization',
          'Support payroll and expense management',
          'Find opportunities to improve efficiency',
        ],
        businessValue:
          'Increase billing accuracy and recovery by 10-15%. Identify unprofitable projects for management.',
      },
    ],
  },
};

const SectionCollapsible = ({ section, isOpen, onToggle }) => {
  const [expandedPage, setExpandedPage] = useState(null);

  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
          isOpen
            ? `bg-${section.color}-50 dark:bg-${section.color}-900/20 border-${section.color}-300 dark:border-${section.color}-700`
            : `bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`
        }`}
      >
        <h3
          className={`font-bold text-lg ${isOpen ? `text-${section.color}-700 dark:text-${section.color}-300` : 'text-gray-700 dark:text-gray-300'}`}
        >
          {section.title}
        </h3>
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="space-y-2 pl-4">
          {section.pages.map((page, idx) => (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
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
                {expandedPage === idx ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
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
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      Business Use Cases
                    </h4>
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
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      💼 Business Value
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      {page.businessValue}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Documentation() {
  const [openSections, setOpenSections] = useState({});
  const [downloadFormat, setDownloadFormat] = useState('md');

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleDownload = () => {
    const docContent = generateDocumentation();
    const element = document.createElement('a');
    const file = new Blob([docContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Catchall_Executive_Documentation.${downloadFormat}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateDocumentation = () => {
    let doc = `# CATCHALL: Complete Platform Documentation\n\n`;
    doc += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    Object.entries(sections).forEach(([_key, section]) => {
      doc += `## ${section.title}\n\n`;
      section.pages.forEach((page) => {
        doc += `### ${page.name}\n`;
        doc += `${page.icon} **Description**: ${page.description}\n\n`;
        doc += `**What It Does**\n${page.whatItDoes}\n\n`;
        doc += `**How It Works**\n${page.howItWorks}\n\n`;
        doc += `**Business Use Cases**\n`;
        page.useCases.forEach((uc) => (doc += `- ${uc}\n`));
        doc += `\n**Business Value**\n${page.businessValue}\n\n---\n\n`;
      });
    });

    return doc;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Complete Catchall Documentation
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Detailed breakdown of every feature, use case, and business value
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="md">Markdown (.md)</option>
            <option value="txt">Text (.txt)</option>
          </select>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      <Card className="glass-card p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Click on any section below to expand it and see all features, detailed descriptions, use
          cases, and business value.
        </p>
        <div className="space-y-3">
          {Object.entries(sections).map(([key, section]) => (
            <SectionCollapsible
              key={key}
              section={section}
              isOpen={openSections[key] || false}
              onToggle={() => toggleSection(key)}
            />
          ))}
        </div>
      </Card>

      <Card className="glass-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">📊 Platform Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Modules</p>
            <p className="text-gray-600 dark:text-gray-400">12+ integrated modules</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Features</p>
            <p className="text-gray-600 dark:text-gray-400">80+ major features</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Coverage</p>
            <p className="text-gray-600 dark:text-gray-400">150+ pages and workflows</p>
          </div>
        </div>
      </Card>
    </div>
  );
}