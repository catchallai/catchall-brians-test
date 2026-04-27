import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  HelpCircle,
  Video,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  BarChart3,
  Share2,
  Mail,
  Zap,
  Home,
  ArrowLeft,
  Globe,
  Radio,
  Settings,
  PenTool,
  TrendingUp,
  Phone,
  MessageSquare,
  Lightbulb,
  PlayCircle,
  FileQuestion,
  Sparkles,
  Star,
  Eye,
  Package,
  Presentation,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const CATEGORIES = [
  {
    id: 'getting_started',
    label: 'Getting Started',
    icon: Home,
    color: 'bg-violet-100 text-violet-700',
    description: 'New to CatchAll? Start here',
  },
  {
    id: 'crm',
    label: 'CRM & Contacts',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    description: 'Manage contacts, companies, and deals',
  },
  {
    id: 'seo',
    label: 'SEO Tools',
    icon: BarChart3,
    color: 'bg-amber-100 text-amber-700',
    description: 'Track rankings, keywords, and backlinks',
  },
  {
    id: 'analytics',
    label: 'Traffic & Analytics',
    icon: TrendingUp,
    color: 'bg-emerald-100 text-emerald-700',
    description: 'User journeys, visitor insights, and AI analytics',
  },
  {
    id: 'social_media',
    label: 'Social Media',
    icon: Share2,
    color: 'bg-pink-100 text-pink-700',
    description: 'Social listening, scheduling, and AI predictions',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Mail,
    color: 'bg-indigo-100 text-indigo-700',
    description: 'Campaigns, email marketing, and reports',
  },
  {
    id: 'content',
    label: 'Content',
    icon: PenTool,
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Content strategy and creation',
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Zap,
    color: 'bg-amber-100 text-amber-700',
    description: 'Automate your workflows',
  },
  {
    id: 'ai_tools',
    label: 'AI Tools',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-700',
    description: 'AI-powered features and tools',
  },
  {
    id: 'business_dev',
    label: 'Business Dev',
    icon: Presentation,
    color: 'bg-blue-100 text-blue-700',
    description: 'Pitch decks, DMCA, lead scoring',
  },
  {
    id: 'assets',
    label: 'Assets & Finance',
    icon: Package,
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Equipment and accounting',
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    icon: Phone,
    color: 'bg-purple-100 text-purple-700',
    description: 'CatchAll on-the-go',
  },
  {
    id: 'settings',
    label: 'Settings & Account',
    icon: Settings,
    color: 'bg-gray-100 text-gray-700',
    description: 'Profile, notifications, API keys',
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
    color: 'bg-slate-100 text-slate-700',
    description: 'Common questions answered',
  },
];

const VIDEO_TUTORIALS = [
  {
    id: 'video-getting-started',
    title: 'Getting Started with CatchAll',
    description: 'Complete walkthrough of CatchAll features and how to set up your account',
    duration: '5:32',
    views: '1.2K',
    category: 'getting_started',
    thumbnail: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    isFeatured: true,
  },
  {
    id: 'video-crm-best-practices',
    title: 'CRM Best Practices',
    description: 'Learn how to effectively manage contacts, deals, and pipeline in the CRM',
    duration: '8:15',
    views: '0.9K',
    category: 'crm',
    thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-600',
    isFeatured: true,
  },
  {
    id: 'video-seo-audit',
    title: 'SEO Audit Walkthrough',
    description: 'Step-by-step guide to running and understanding SEO audits',
    duration: '12:40',
    views: '2.1K',
    category: 'seo',
    thumbnail: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    isFeatured: true,
  },
  {
    id: 'video-social-listening',
    title: 'Social Listening Setup',
    description: 'Monitor brand mentions and sentiment across social media platforms',
    duration: '6:25',
    views: '0.7K',
    category: 'social_media',
    thumbnail: 'bg-gradient-to-br from-orange-500 to-red-600',
  },
  {
    id: 'video-email-campaigns',
    title: 'Email Campaign Creation',
    description: 'Create and send targeted email campaigns to your contacts',
    duration: '10:18',
    views: '1.3K',
    category: 'marketing',
    thumbnail: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    isFeatured: true,
  },
  {
    id: 'video-analytics-deep-dive',
    title: 'Analytics Deep Dive',
    description: 'Understand visitor behavior, journeys, and conversion optimization',
    duration: '15:05',
    views: '1.8K',
    category: 'analytics',
    thumbnail: 'bg-gradient-to-br from-violet-500 to-purple-600',
    isFeatured: true,
  },
  {
    id: 'video-ai-tools',
    title: 'AI-Powered Tools Overview',
    description: 'Discover how to use AI features for lead scoring, content generation, and more',
    duration: '11:30',
    views: '2.5K',
    category: 'ai_tools',
    thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-500',
    isFeatured: true,
  },
  {
    id: 'video-pitch-deck',
    title: 'Creating Pitch Decks',
    description: 'Use AI to create and analyze compelling pitch decks',
    duration: '9:45',
    views: '0.8K',
    category: 'business_dev',
    thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  },
  {
    id: 'video-automation',
    title: 'Marketing Automation',
    description: 'Set up automated workflows and email sequences',
    duration: '13:20',
    views: '1.1K',
    category: 'automation',
    thumbnail: 'bg-gradient-to-br from-amber-500 to-orange-500',
  },
];

const QUICK_START_STEPS = [
  {
    id: 1,
    title: 'Add Your First Contact',
    description: 'Go to Contacts and create your first lead or customer',
    link: 'Contacts',
    icon: Users,
  },
  {
    id: 2,
    title: 'Create a Deal',
    description: 'Track a sales opportunity in your pipeline',
    link: 'Deals',
    icon: Target,
  },
  {
    id: 3,
    title: 'Set Up SEO Tracking',
    description: 'Add your website to monitor SEO performance',
    link: 'SEODashboard',
    icon: Globe,
  },
  {
    id: 4,
    title: 'Start Social Listening',
    description: 'Track mentions of your brand across social media',
    link: 'SocialListening',
    icon: Radio,
  },
  {
    id: 5,
    title: 'Explore AI Analytics',
    description: 'Map user journeys and get AI-powered insights',
    link: 'TrafficAnalytics',
    icon: TrendingUp,
  },
  {
    id: 6,
    title: 'Try Mobile Hub',
    description: 'Access CatchAll on-the-go with the mobile experience',
    link: 'MobileHub',
    icon: Phone,
  },
];

const DEFAULT_ARTICLES = [
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

Your all-in-one platform for managing customer relationships, SEO performance, social media, and marketing campaigns.

## What Can You Do With CatchAll?

### 🎯 CRM & Sales
- **Contacts & Companies**: Store and organize all your business relationships
- **Deal Pipeline**: Track opportunities from lead to close
- **Activities**: Log calls, emails, meetings, and tasks
- **Contact Forms**: Capture leads from your website

### 📊 SEO & Analytics
- **Website Monitoring**: Track your site's SEO health score
- **Keyword Tracking**: Monitor search rankings for important keywords
- **Backlink Analysis**: Discover and manage your backlink profile
- **Technical Audits**: Find and fix SEO issues
- **Traffic Analytics**: Understand your website visitors

### 📱 Social Media Management
- **Social Listening**: Monitor brand mentions across platforms
- **Content Calendar**: Plan and schedule posts
- **Competitor Analysis**: Track what competitors are doing
- **Engagement Analytics**: Measure your social performance

### 📧 Marketing
- **Email Campaigns**: Create and send targeted campaigns
- **Automation**: Set up triggered email sequences
- **Reports**: Generate comprehensive marketing reports

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

The left sidebar contains all main sections:

- **Dashboard**: Overview of key metrics
- **CRM**: Contacts, Companies, Deals, Activities
- **Marketing**: Campaigns, Email Marketing, Reports
- **SEO**: Dashboard, Keywords, Backlinks, Audit
- **Social**: Social Media, Social Listening, Calendar
- **Settings**: Configure your account

## Top Bar

- **Search**: Find anything quickly with global search (Cmd/Ctrl + K)
- **Notifications**: See alerts and updates
- **Dark Mode**: Toggle light/dark theme
- **Profile**: Access your account settings

## Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open global search
- **?**: Show keyboard shortcuts
- **Escape**: Close modals

## Mobile Navigation

On mobile devices, tap the menu icon to open the sidebar.`,
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
   - Company (link to existing company)
   - Job Title
   - Status (Lead, Prospect, Customer, Churned)
   - Source (how they found you)

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
    id: 'companies-guide',
    title: 'Managing Companies',
    category: 'crm',
    type: 'tutorial',
    order: 2,
    tags: ['companies', 'organizations', 'accounts'],
    content: `# Managing Companies

Organize your contacts by company for better relationship management.

## Creating a Company

1. Go to **Companies** in the sidebar
2. Click **Add Company**
3. Enter company details:
   - Company Name (required)
   - Industry
   - Website
   - Phone
   - Address
   - Employee Count

## Linking Contacts to Companies

1. When adding or editing a contact, select a company from the dropdown
2. All linked contacts appear on the company page
3. View all deals associated with a company

## Company Insights

Each company page shows:
- Total contacts at the company
- Active deals and their value
- Recent activities
- Deal history

## Tips

- Create companies before adding contacts for better organization
- Use the industry field to segment your accounts
- Track company-level metrics for account-based selling`,
  },
  {
    id: 'deals-pipeline',
    title: 'Using the Deal Pipeline',
    category: 'crm',
    type: 'tutorial',
    is_featured: true,
    order: 3,
    tags: ['deals', 'pipeline', 'sales'],
    content: `# Using the Deal Pipeline

Track your sales opportunities from lead to close.

## Deal Stages

| Stage | Description | Next Action |
|-------|-------------|-------------|
| Lead | Initial contact | Qualify the opportunity |
| Qualified | Budget/need confirmed | Send proposal |
| Proposal | Quote sent | Follow up |
| Negotiation | Discussing terms | Close the deal |
| Won | Deal closed | Onboard customer |
| Lost | Deal didn't close | Learn and move on |

## Creating a Deal

1. Go to **Deals** from the sidebar
2. Click **Add Deal**
3. Enter deal details:
   - Title
   - Value (deal amount)
   - Stage
   - Contact
   - Company
   - Expected Close Date
   - Win Probability

## Moving Deals Through Stages

1. Click on a deal to open it
2. Change the stage from the dropdown
3. Add notes about why it moved

## Pipeline View vs List View

- **Pipeline**: Kanban board showing deals by stage
- **List**: Sortable table with all deal details

## Tracking Metrics

- **Pipeline Value**: Total value of open deals
- **Win Rate**: Percentage of deals won
- **Average Deal Size**: Mean value of closed deals
- **Sales Cycle**: Average time to close`,
  },
  {
    id: 'activities-guide',
    title: 'Logging Activities',
    category: 'crm',
    type: 'tutorial',
    order: 4,
    tags: ['activities', 'tasks', 'calls', 'meetings'],
    content: `# Logging Activities

Track all interactions with your contacts and deals.

## Activity Types

- **📞 Call**: Phone calls with contacts
- **📧 Email**: Email correspondence
- **📅 Meeting**: In-person or virtual meetings
- **✅ Task**: To-do items and follow-ups

## Creating an Activity

1. Go to **Activities** or open a contact/deal
2. Click **Add Activity**
3. Select the activity type
4. Enter details:
   - Subject
   - Description/Notes
   - Contact (if applicable)
   - Deal (if applicable)
   - Date & Time
   - Completed status

## Setting Reminders

1. When creating an activity, set a future date
2. You'll receive a notification when it's due
3. Mark as complete when done

## Activity Timeline

View all activities in chronological order on:
- Contact pages
- Deal pages
- Company pages
- The main Activities page

## Tips

- Log activities immediately after they happen
- Include key details in notes
- Link activities to both contacts and deals when relevant`,
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

## Understanding Your Metrics

### Domain Authority (DA)
A score from 0-100 predicting how well your site will rank. Higher is better.

### SEO Score
An overall health score based on:
- Technical SEO factors
- Content optimization
- Backlink quality
- Page speed

### Organic Traffic
Estimated monthly visitors from search engines.

### Keyword Rankings
How many keywords your site ranks for.

## Website Analysis

Click **Analyze** on any website to:
- Update all metrics
- Scan for new keywords
- Check for SEO issues

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
3. Enter:
   - Keyword phrase
   - Target URL
   - Search volume (optional)
   - Target position

## Understanding Keyword Data

| Metric | Description |
|--------|-------------|
| Position | Current ranking (1-100) |
| Change | Movement since last check |
| Volume | Monthly searches |
| Difficulty | How hard to rank (0-100) |
| URL | Page that's ranking |

## Tracking Tips

- Focus on keywords relevant to your business
- Track both branded and non-branded terms
- Monitor competitor keywords
- Check rankings regularly

## Position Changes

- 🟢 Green arrow = improved ranking
- 🔴 Red arrow = dropped ranking
- ➡️ Gray = no change

## Grouping Keywords

Organize keywords by:
- Product/service
- Location
- Intent (informational, commercial)
- Priority level`,
  },
  {
    id: 'backlinks-guide',
    title: 'Backlink Analysis',
    category: 'seo',
    type: 'tutorial',
    order: 3,
    tags: ['backlinks', 'link building', 'authority'],
    content: `# Backlink Analysis

Discover and manage your website's backlink profile.

## What are Backlinks?

Backlinks are links from other websites pointing to your site. They're a key ranking factor for search engines.

## Viewing Your Backlinks

1. Go to **Backlinks**
2. Select a website
3. View all discovered backlinks

## Backlink Metrics

| Metric | Description |
|--------|-------------|
| Domain Authority | Authority of linking site |
| Link Type | dofollow, nofollow, ugc, sponsored |
| Anchor Text | Clickable text of the link |
| Status | Active, Lost, Broken |

## Managing Toxic Links

1. Identify links from spammy sites
2. Mark them as "Toxic"
3. Use the disavow feature if needed

## Building Quality Backlinks

- Create valuable content worth linking to
- Guest post on industry sites
- Get listed in directories
- Engage in digital PR`,
  },
  {
    id: 'seo-audit',
    title: 'Running SEO Audits',
    category: 'seo',
    type: 'tutorial',
    order: 4,
    tags: ['audit', 'technical seo', 'issues'],
    content: `# Running SEO Audits

Find and fix technical SEO issues on your website.

## Starting an Audit

1. Go to **SEO Audit**
2. Select a website
3. Click **Run Audit**
4. Wait for the analysis to complete

## Audit Categories

### Technical SEO
- Page speed issues
- Mobile-friendliness
- Crawl errors
- HTTPS status

### On-Page SEO
- Title tags
- Meta descriptions
- Header structure
- Image alt text

### Content
- Thin content pages
- Duplicate content
- Keyword usage

## Priority Levels

- 🔴 **Critical**: Fix immediately
- 🟠 **High**: Fix soon
- 🟡 **Medium**: Should fix
- 🟢 **Low**: Nice to fix

## Fixing Issues

1. Review each issue
2. Click for detailed recommendations
3. Make changes on your website
4. Re-run the audit to verify fixes`,
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
3. Choose tracking type:
   - **Keyword**: Track any word/phrase
   - **Hashtag**: Track #hashtags
   - **Mention**: Track @mentions

## Finding Mentions

After adding keywords:
1. Click **Scan** to search for mentions
2. View results in the Mentions tab
3. Filter by platform or sentiment

## Understanding Sentiment

The system analyzes each mention:
- 🟢 **Positive**: Happy customers, praise
- ⚪ **Neutral**: Informational mentions
- 🔴 **Negative**: Complaints, criticism

## Responding to Mentions

1. Find mentions needing response
2. Use AI to generate suggested replies
3. Mark as responded or ignored

## Alerts

Get notified when:
- Mention volume spikes
- Negative sentiment increases
- Influencers mention your brand
- Competitors are discussed

## Deep Scan (Forums)

Use Deep Scan to find discussions in:
- Reddit
- Forums
- Quora
- Blog comments`,
  },
  {
    id: 'social-calendar',
    title: 'Using the Social Calendar',
    category: 'social_media',
    type: 'tutorial',
    order: 2,
    tags: ['calendar', 'scheduling', 'posts'],
    content: `# Using the Social Calendar

Plan and schedule your social media content.

## Viewing the Calendar

1. Go to **Social Calendar**
2. See posts organized by date
3. Switch between calendar and grid view

## Creating a Scheduled Post

1. Click **Add Post** or click on a date
2. Enter your content:
   - Caption/text
   - Platform (Twitter, LinkedIn, etc.)
   - Scheduled date and time
   - Media (optional)
3. Set status (Draft, Scheduled, Approved)
4. Click **Save**

## Post Statuses

| Status | Color | Description |
|--------|-------|-------------|
| Draft | Gray | Not yet ready |
| Scheduled | Blue | Ready to post |
| Approved | Green | Reviewed and approved |
| Published | Purple | Already posted |

## Hashtag Pool

1. Build a library of hashtags
2. Quickly add them to posts
3. Track which hashtags perform best

## Tips

- Plan content 1-2 weeks ahead
- Use consistent posting times
- Mix content types (educational, promotional, engaging)
- Review and approve posts before publishing`,
  },
  {
    id: 'social-analytics',
    title: 'Social Media Analytics',
    category: 'social_media',
    type: 'tutorial',
    order: 3,
    tags: ['analytics', 'metrics', 'performance'],
    content: `# Social Media Analytics

Track your social media performance.

## Adding Social Accounts

1. Go to **Social Media**
2. Click **Add Account**
3. Select platform and enter handle
4. Click **Analyze** to fetch data

## Key Metrics

| Metric | Description |
|--------|-------------|
| Followers | Total audience size |
| Engagement Rate | Interactions ÷ Followers |
| Avg Likes | Average likes per post |
| Avg Comments | Average comments per post |

## Content Insights

Discover which content performs best:
- Top performing posts
- Best posting times
- Hashtag effectiveness
- Content type analysis

## Competitor Tracking

1. Add competitor accounts
2. Compare your metrics to theirs
3. Identify content gaps
4. Learn from their successes`,
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
3. Enter campaign details:
   - Name
   - Subject line
   - From name
   - Recipients

## Building Your Email

1. Choose a template or start blank
2. Write your content
3. Personalize with merge fields:
   - {first_name}
   - {company}
   - {deal_name}

## Selecting Recipients

Choose contacts by:
- Status (all leads, customers, etc.)
- Tags
- Company
- Manual selection

## Testing Before Sending

1. Send a test email to yourself
2. Check formatting on mobile
3. Verify all links work
4. Review subject line

## Scheduling

- Send immediately
- Schedule for a specific date/time
- Set up drip sequences

## Tracking Results

After sending, monitor:
- Open rate
- Click rate
- Unsubscribes
- Bounces`,
  },
  {
    id: 'reports-guide',
    title: 'Generating Reports',
    category: 'marketing',
    type: 'tutorial',
    order: 2,
    tags: ['reports', 'analytics', 'data'],
    content: `# Generating Reports

Create comprehensive reports for your stakeholders.

## Report Types

- **SEO Reports**: Rankings, traffic, backlinks
- **Social Reports**: Engagement, growth, mentions
- **CRM Reports**: Pipeline, activities, conversions
- **Marketing Reports**: Campaigns, email performance

## Creating a Report

1. Go to **Reports**
2. Click **Create Report**
3. Select a template or build custom
4. Choose date range
5. Select metrics to include
6. Generate and preview

## Scheduling Reports

1. When creating a report, enable scheduling
2. Set frequency (weekly, monthly)
3. Add email recipients
4. Reports will be sent automatically

## Customizing Reports

- Add your logo
- Choose which sections to include
- Add custom notes
- Export as PDF

## Sharing Reports

- Email directly from the platform
- Download and share manually
- Schedule automatic sends`,
  },

  // Content Articles
  {
    id: 'content-strategy',
    title: 'Content Strategy Tools',
    category: 'content',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['content', 'strategy', 'planning'],
    content: `# Content Strategy Tools

Plan and create content that ranks and converts.

## Content Ideas

1. Go to **Content Strategy**
2. View AI-generated content ideas
3. Each idea includes:
   - Topic suggestion
   - Target keyword
   - Search volume
   - Difficulty score

## Creating Content Briefs

1. Select a content idea
2. Click **Create Brief**
3. AI generates an outline including:
   - Target keywords
   - Suggested headings
   - Competitor analysis
   - Content guidelines

## Content Studio

Use Content Studio for:
- AI-assisted writing
- Brand voice consistency
- SEO optimization
- Content scheduling

## Tracking Performance

After publishing, monitor:
- Page views
- Time on page
- Rankings achieved
- Conversions`,
  },

  // Automation Articles
  {
    id: 'automation-basics',
    title: 'Automation Rules',
    category: 'automation',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['automation', 'rules', 'triggers'],
    content: `# Automation Rules

Automate repetitive tasks and workflows.

## How Automations Work

1. **Trigger**: Something happens (new contact, deal stage change)
2. **Condition**: Optional filter (if status = lead)
3. **Action**: What to do (send email, create task)

## Common Automations

### Welcome Email
- Trigger: New contact created
- Action: Send welcome email

### Lead Follow-up
- Trigger: Contact status = Lead
- Condition: No activity in 3 days
- Action: Create follow-up task

### Deal Won Notification
- Trigger: Deal stage = Won
- Action: Send notification, create onboarding task

## Creating an Automation

1. Go to **Automation**
2. Click **Add Rule**
3. Select trigger event
4. Add conditions (optional)
5. Choose action(s)
6. Save and activate

## Managing Automations

- Enable/disable rules as needed
- View automation history
- Test before activating
- Monitor for errors`,
  },

  // Traffic & Analytics Articles
  {
    id: 'traffic-overview',
    title: 'Traffic Analytics Overview',
    category: 'analytics',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['traffic', 'analytics', 'visitors'],
    content: `# Traffic Analytics Overview

Monitor and analyze your website traffic with comprehensive insights.

## Accessing Traffic Analytics

1. Navigate to **Traffic Analytics** from the sidebar
2. Select your website and date range
3. View real-time and historical data

## Key Metrics

| Metric | Description |
|--------|-------------|
| Total Visitors | Unique users visiting your site |
| Page Views | Total pages viewed |
| Bounce Rate | Visitors leaving after one page |
| Avg. Duration | Time spent on site |

## Dashboard Tabs

### Daily Trends
View traffic patterns over time with interactive charts.

### Traffic Sources
Understand where visitors come from:
- Organic Search
- Direct Traffic
- Social Media
- Referrals
- Paid Ads

### Visitors Tab
Deep dive into visitor profiles, demographics, session insights, and technology data.

### User Journeys Tab
AI-powered journey mapping to understand conversion paths.

### Regional
Geographic distribution of your audience.

### Market
Industry benchmarks and market positioning.

## Toggle Widgets

Use the toggle panel to show/hide specific analytics cards based on your needs.`,
  },
  {
    id: 'user-journey-mapping',
    title: 'AI User Journey Mapping',
    category: 'analytics',
    type: 'tutorial',
    is_featured: true,
    order: 2,
    tags: ['ai', 'user journey', 'conversion', 'optimization'],
    content: `# AI User Journey Mapping

Understand how users navigate your website and social media touchpoints with AI-powered analysis.

## What is User Journey Mapping?

AI analyzes all touchpoints across your website and social channels to:
- Map complete user journeys
- Identify conversion paths
- Find drop-off points
- Suggest optimizations

## Using the Feature

1. Go to **Traffic Analytics**
2. Click the **User Journeys** tab
3. Click **Map Journeys** button
4. Wait for AI analysis to complete

## Understanding the Results

### Overview Tab
- **Conversion Rate**: Overall site conversion
- **Avg Touchpoints**: Steps before conversion
- **Avg Time to Convert**: Typical customer timeline
- **Top Channel**: Best performing acquisition source
- **Journey Stages Funnel**: Visual conversion funnel

### Personas Tab
AI-detected user personas including:
- Demographics and goals
- Pain points
- Preferred channels
- Decision factors

### Journeys Tab
**Conversion Paths**: Top routes users take to convert
- Path sequence visualization
- Conversion rate per path
- Success factors

**Cross-Channel Insights**: How users move between channels
- Social to website transitions
- Multi-touch attribution

### Drop-offs Tab
Identify where users abandon:
- Location and stage
- Drop-off rate
- Likely reasons
- Recommended fixes
- Recovery potential

### Optimize Tab
Prioritized recommendations:
- Specific action items
- Expected impact
- Effort level
- Affected journey stages

## Best Practices

- Run analysis monthly to track changes
- Prioritize high-impact, low-effort fixes
- Test recommendations with A/B testing
- Monitor drop-off rates after changes`,
  },
  {
    id: 'visitor-profiles',
    title: 'Visitor Profiles & AI Lead Scoring',
    category: 'analytics',
    type: 'tutorial',
    order: 3,
    tags: ['visitors', 'demographics', 'lead scoring', 'ai'],
    content: `# Visitor Profiles & AI Lead Scoring

Understand who visits your website with detailed visitor analytics and AI-powered lead scoring.

## Visitor Profiles

Track individual sessions with:
- **Entry source**: How they found you
- **Location**: Geographic data
- **Company info**: B2B visitor identification
- **AI Lead score**: Dynamically calculated conversion potential
- **Session journey**: Pages visited in order

## AI Lead Scoring Engine

Our AI analyzes visitor behavior in real-time to calculate conversion potential (0-100 score).

### Scoring Factors

| Factor | Impact | Description |
|--------|--------|-------------|
| Industry | +12 to +20 | High-value industries score higher |
| Engagement Depth | +10 to +15 | Pages viewed indicates interest level |
| Session Duration | +8 to +12 | Longer sessions = higher intent |
| High-Intent Pages | +8 to +16 | Visits to pricing, contact, specs pages |
| Return Visits | +3 to +12 | Repeat visitors show sustained interest |
| Referrer Quality | +8 | Premium referral sources |
| Device Type | +5 | Desktop users convert higher in B2B |

### Score Tiers

- 🔥 **Hot Lead (85+)**: Immediate outreach recommended
- ⚡ **Warm (70-84)**: Priority follow-up needed
- 📊 **Engaged (50-69)**: Add to nurture sequence
- 👀 **Early Stage (<50)**: Monitor for increased engagement

### Viewing Score Breakdown

1. Go to **Traffic Analytics** > **Visitors** tab
2. Find the **Visitor Profiles** card
3. Click on any lead score badge
4. View detailed breakdown of contributing factors
5. See AI recommendation for next steps

## Date Range Filtering

Filter visitor profiles by time period:
- **30 Days**: Recent high-value visitors
- **60 Days**: Extended view
- **90 Days**: Full quarter analysis

## Session Journey View

Click on any visitor to expand:
- Device and browser info
- Referral source
- Total visits count
- Page-by-page journey with time spent
- Scroll depth per page

## Best Practices

- Focus outreach on Hot and Warm leads
- Review score breakdowns to understand buyer behavior
- Use patterns to optimize high-intent pages
- Compare industry distribution to target market`,
  },
  {
    id: 'user-journey-segments',
    title: 'Journey Mapping with Segments',
    category: 'analytics',
    type: 'tutorial',
    order: 4,
    tags: ['segments', 'user journey', 'filtering', 'conversion funnel'],
    content: `# Journey Mapping with Segments

Analyze user journeys by specific visitor segments and entry points for deeper insights.

## Segment Filtering

Filter journey analysis by visitor type:

### Available Segments

| Segment | Description | Use Case |
|---------|-------------|----------|
| All Visitors | Complete traffic | Overall patterns |
| New Visitors | First-time users | Acquisition analysis |
| Returning Visitors | Repeat users | Loyalty patterns |
| High Intent | Purchase-ready | Conversion optimization |
| Mobile Users | Mobile traffic | Mobile UX analysis |

### Entry Point Filtering

Filter by where users start:
- **Homepage**: Main entry
- **Product Pages**: Direct product interest
- **Performance/Specs**: Technical buyers
- **Ownership Page**: High intent
- **Contact Page**: Conversion ready
- **Social Media**: Social traffic
- **Organic Search**: SEO traffic

## Using Filters

1. Go to **Traffic Analytics** > **User Journeys** tab
2. Click **Filters** button
3. Select **Visitor Segment**
4. Select **Entry Point**
5. View updated funnel and paths

## Visual Conversion Funnel

The funnel shows stage-by-stage progression:
- **Landing**: Initial visitors
- **Engaged**: Interacted with content
- **Interested**: Viewed multiple pages
- **Qualified**: High-intent behavior
- **Converted**: Completed goal

Drop-off percentages shown between stages.

## Common Paths Analysis

See top paths for your selected filters:
- Path sequence visualization
- Percentage of traffic using path
- Conversion rate per path
- Visual progress bars

## Drop-off Points

Identify where users leave:
- Location in journey
- Drop-off percentage
- Reason analysis
- Recommended fix (hover for details)

## Segment Insights

Different segments show different metrics:
- **New Visitors**: Higher bounce, longer conversion time
- **Returning**: Higher conversion, fewer touchpoints
- **High Intent**: Best conversion rates
- **Mobile**: Different path preferences

## Best Practices

- Compare segments to find optimization opportunities
- Analyze high-intent entry points for conversion tips
- Review mobile vs desktop journey differences
- Test fixes on high drop-off points`,
  },

  // Mobile App Articles
  {
    id: 'mobile-hub-guide',
    title: 'Mobile Hub Guide',
    category: 'mobile',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['mobile', 'app', 'on-the-go'],
    content: `# Mobile Hub Guide

Access CatchAll on your phone or tablet with our mobile-optimized experience.

## Accessing Mobile Hub

1. Navigate to **Mobile Hub** from the sidebar
2. Or visit on your mobile device for auto-detection
3. Add to home screen for app-like experience

## Mobile Hub Tabs

### Home
Quick overview with:
- Pipeline value
- New contacts today
- Quick action buttons
- Recent mentions
- Scheduled posts

### CRM
Mobile-friendly CRM access:
- Browse recent contacts
- Tap to call or email
- View active deals
- Quick contact lookup

### Social
Social media on-the-go:
- Connected accounts
- Quick post composer
- Engagement stats
- Platform overview

### Alerts
Real-time notifications:
- Social mentions
- CRM updates
- SEO alerts
- System notifications

### Stats
Key analytics at a glance:
- Visitor metrics
- Page views
- Conversions
- Duration stats

## Quick Post Composer

Create posts from anywhere:
1. Tap the **+** button or **Create New Post**
2. Select platforms (Twitter, LinkedIn, etc.)
3. Write your content
4. Post immediately or schedule

## Mobile Notifications

Get notified about:
- Brand mentions
- Deal stage changes
- Engagement spikes
- SEO ranking changes

## Tips for Mobile Use

- Use quick actions for common tasks
- Swipe to call/email contacts
- Check alerts regularly
- Review analytics on-the-go`,
  },
  {
    id: 'mobile-install',
    title: 'Install as Mobile App',
    category: 'mobile',
    type: 'guide',
    order: 2,
    tags: ['install', 'pwa', 'home screen'],
    content: `# Install CatchAll as a Mobile App

Add CatchAll to your home screen for a native app-like experience.

## iOS Installation

1. Open CatchAll in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "CatchAll"
5. Tap **Add**

## Android Installation

1. Open CatchAll in Chrome
2. Tap the **menu** (three dots)
3. Select **Add to Home Screen**
4. Tap **Add**

## Benefits of Installing

- **Full screen**: No browser chrome
- **Quick access**: Launch from home screen
- **Faster loading**: Cached resources
- **Notifications**: Real-time alerts
- **Offline access**: Basic features work offline

## Mobile Features

- Touch-optimized interface
- Bottom navigation bar
- Swipe gestures
- Pull to refresh
- Native sharing`,
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

Customize your CatchAll experience with user settings.

## Accessing Settings

Navigate to **User Settings** from the sidebar.

## Profile Settings

Update your personal information:
- Full Name
- Job Title
- Company
- Phone
- Bio
- Timezone

## Notification Preferences

### Email Notifications
- **Critical Alerts**: Security and system alerts
- **Content Ideas**: AI-generated suggestions
- **Competitor Updates**: Activity changes
- **Weekly Digest**: Performance summary
- **SEO Alerts**: Ranking changes

### Push Notifications
- **Social Mentions**: Brand mentions
- **Engagement Spikes**: Unusual activity
- **Campaign Updates**: Milestones
- **Deal Updates**: Stage changes

Toggle each on/off based on your preferences.

## Integrations

Connect third-party accounts:
- Social media platforms
- Email services

## API Keys

Generate API keys for:
- External integrations
- Automation tools
- Custom development

### Managing API Keys
1. Enter a key name
2. Click **Generate Key**
3. Copy and store securely
4. Use in Authorization header`,
  },
  {
    id: 'api-keys',
    title: 'API Keys & Integrations',
    category: 'settings',
    type: 'tutorial',
    order: 2,
    tags: ['api', 'integrations', 'developers'],
    content: `# API Keys & Integrations

Connect CatchAll to your other tools and build custom integrations.

## Generating API Keys

1. Go to **User Settings**
2. Click the **API Keys** tab
3. Enter a descriptive name (e.g., "Production", "Zapier")
4. Click **Generate Key**
5. Copy the key immediately (shown once)

## Using API Keys

Include in request headers:
\`\`\`
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
\`\`\`

## API Endpoints

Access CatchAll data programmatically:
- Contacts and companies
- Deals and pipeline
- Keywords and rankings
- Social mentions
- Analytics data

## Security Best Practices

- Never share API keys publicly
- Use different keys per application
- Rotate keys periodically
- Delete unused keys
- Use environment variables

## Connected Integrations

View and manage connected services:
- Social media accounts
- Email providers
- Analytics platforms`,
  },

  // Social Media - New AI Features
  {
    id: 'social-ai-predictions',
    title: 'AI Predictions & Forecasting',
    category: 'social_media',
    type: 'tutorial',
    is_featured: true,
    order: 4,
    tags: ['ai', 'predictions', 'trends', 'forecasting'],
    content: `# AI Predictions & Forecasting

Leverage AI to predict trends and plan your social strategy.

## Accessing AI Predictions

1. Go to **Social Media**
2. Click the **Predictions** tab
3. View AI-generated insights

## Predictive Trends

AI analyzes patterns to forecast:
- **Engagement Predictions**: Expected performance
- **Trending Topics**: Emerging subjects in your industry
- **Optimal Posting Times**: Best times for engagement
- **Content Recommendations**: What to post next

## Competitor Forecasting

Predict competitor moves:
- Upcoming campaign predictions
- Market position forecasts
- Strategy shift indicators
- Counter-strategy recommendations

## AI Content Calendar

Let AI plan your content:
- **2-Week Schedule**: Auto-generated posting plan
- **Topic Suggestions**: Relevant content ideas
- **Platform Optimization**: Tailored per channel
- **Engagement Estimates**: Predicted performance

## How AI Predictions Work

The AI analyzes:
- Your historical performance
- Industry trends
- Competitor activity
- Seasonal patterns
- Audience behavior

## Using Predictions

1. Review weekly predictions
2. Adjust content calendar accordingly
3. Prepare for trending topics
4. Monitor competitor forecasts
5. Iterate based on results`,
  },
  {
    id: 'competitor-intelligence',
    title: 'Competitor Intelligence',
    category: 'social_media',
    type: 'tutorial',
    order: 5,
    tags: ['competitors', 'analysis', 'benchmarking'],
    content: `# Competitor Intelligence

Track and analyze competitor social media activity.

## Adding Competitors

1. Go to **Competitor Analysis** from the sidebar
2. Click **Add Competitor**
3. Enter competitor name and social handles

## What's Tracked

### Activity Metrics
- Posting frequency
- Engagement rates
- Follower growth
- Content mix

### Content Analysis
- Top performing posts
- Content themes
- Hashtag usage
- Posting schedule

### Strategy Insights
- Content pillars
- Tone of voice
- Visual style
- CTA patterns

## Comparative Reports

Generate side-by-side comparisons:
- Your brand vs competitor
- Strengths and weaknesses
- Opportunity areas
- Strategic recommendations

## AI-Powered Insights

- Predicted campaigns
- Strategy shift alerts
- Industry benchmarking
- News monitoring

## Using Intelligence

1. Review competitor reports weekly
2. Identify successful tactics to adapt
3. Find content gaps to exploit
4. Stay ahead of campaign launches`,
  },
  {
    id: 'hashtag-pool',
    title: 'Hashtag Pool Management',
    category: 'social_media',
    type: 'tutorial',
    order: 6,
    tags: ['hashtags', 'social media', 'organization'],
    content: `# Hashtag Pool Management

Build and organize your hashtag library for consistent social media posting.

## Accessing Hashtag Pool

Navigate to **Hashtag Pool** from the Social section in the sidebar.

## Adding Hashtags

1. Click **Add Hashtag**
2. Enter hashtag (without #)
3. Assign a category
4. Save to your pool

## Organizing by Category

Create categories like:
- **Brand**: Your branded hashtags
- **Industry**: Sector-specific tags
- **Trending**: Current popular tags
- **Campaign**: Campaign-specific tags
- **Location**: Geographic tags

## Using Hashtags

### In Social Calendar
1. Create a new post
2. Click hashtag icon
3. Select from your pool
4. Add to post

### Quick Copy
- Click any hashtag to copy
- Paste into external tools

## Tracking Performance

Monitor which hashtags perform best:
- Usage count
- Engagement correlation
- Reach metrics

## Best Practices

- Limit to 5-10 hashtags per post
- Mix popular and niche tags
- Rotate hashtags regularly
- Track what works per platform
- Mark favorites for quick access`,
  },

  // FAQ
  // AI Tools Articles
  {
    id: 'ai-dashboard',
    title: 'AI Dashboard Overview',
    category: 'ai_tools',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['ai', 'tools', 'overview'],
    content: `# AI Dashboard Overview

Your hub for all AI-powered features and tools.

## Accessing AI Tools

Navigate to **AI Dashboard** from the sidebar to see all available AI features.

## Available AI Tools

### AI Lead Generator
- Discover and enrich leads automatically
- Data enrichment with company info
- AI-powered lead scoring
- CRM integration

### Content Writer
- Generate SEO-optimized content
- Blog post generation
- Social media posts
- Ad copy creation

### Competitor Analysis
- Deep market intelligence
- Strategy insights
- Trend prediction
- News monitoring

### SEO Optimizer
- Technical SEO audits
- Keyword research
- Gap analysis
- Backlink discovery

### Content Optimizer
- A/B testing recommendations
- Performance analysis
- Content scoring
- Improvement suggestions

### Web Creator
- Generate complete websites
- Responsive design
- SEO-ready output
- Code export

### Social Listening
- Brand mention tracking
- Sentiment analysis
- Trend detection
- Alert system

### Analytics & Reports
- Auto-generated insights
- Data visualization
- Trend analysis
- Predictive analytics

## Using AI Features

Each AI tool includes:
- Clear instructions
- Sample outputs
- Best practices
- Integration options

Click "Launch Feature" to access any tool.`,
  },
  {
    id: 'visitor-profiles-lead-scoring',
    title: 'AI Lead Scoring & Visitor Profiles',
    category: 'ai_tools',
    type: 'tutorial',
    order: 2,
    tags: ['ai', 'lead scoring', 'visitor tracking'],
    content: `# AI Lead Scoring & Visitor Profiles

Automatically score and prioritize leads based on behavior and engagement.

## How It Works

Our AI analyzes visitor behavior in real-time to calculate conversion potential (0-100 score).

## Scoring Factors

The AI considers:
- Industry value
- Engagement depth (pages viewed)
- Session duration
- High-intent pages visited
- Return visitor frequency
- Referrer quality
- Device type

## Score Tiers

- 🔥 **Hot Lead (85+)**: Immediate outreach
- ⚡ **Warm (70-84)**: Priority follow-up
- 📊 **Engaged (50-69)**: Nurture sequence
- 👀 **Early Stage (<50)**: Monitor

## Viewing Profiles

1. Go to **Traffic Analytics** > **Visitors**
2. Find the **Visitor Profiles** card
3. Click any lead score to see breakdown
4. View AI recommendations

## Taking Action

- Focus on hot and warm leads first
- Review score factors to understand behavior
- Use patterns to optimize pages
- Add high-score visitors to CRM`,
  },
  // Business Dev Articles
  {
    id: 'pitch-deck-creator',
    title: 'Pitch Deck Creator',
    category: 'business_dev',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['pitch deck', 'business', 'ai'],
    content: `# Pitch Deck Creator

Create professional pitch decks with AI assistance.

## Getting Started

1. Navigate to **Pitch Deck Creator**
2. Fill in your business details
3. Click **Generate Pitch Deck**
4. Review and refine the output

## Required Information

### Company Basics
- Company name
- Problem you're solving
- Your solution
- Target market size
- Business model

### Traction & Metrics
- Revenue/customers
- Growth rate
- Key milestones

### Team & Vision
- Team background
- Competitive advantage
- Funding ask

## AI-Generated Content

The AI creates:
- Executive summary
- Problem/solution slides
- Market opportunity
- Business model
- Traction data
- Team overview
- Financial projections
- Ask slide

## Each Slide Includes

- **Content**: Key points and data
- **Talking Points**: What to say
- **Visual Suggestions**: Design ideas
- **Presenter Notes**: Tips for delivery

## Best Practices

- Be specific with your data
- Use the brand selector for consistency
- Review all AI suggestions
- Customize for your audience
- Practice your delivery`,
  },
  {
    id: 'pitch-deck-analyzer',
    title: 'Pitch Deck Analyzer',
    category: 'business_dev',
    type: 'tutorial',
    order: 2,
    tags: ['pitch deck', 'analysis', 'feedback'],
    content: `# Pitch Deck Analyzer

Get AI-powered feedback on your pitch deck.

## How to Analyze

1. Go to **Pitch Deck Analyzer**
2. Upload your pitch deck (PDF, PPTX, etc.)
3. Wait for AI analysis
4. Review detailed feedback

## Analysis Categories

### Content & Messaging (0-100)
- Problem clarity
- Solution strength
- Market opportunity
- Value proposition

### Design & Visual Impact
- Layout quality
- Visual hierarchy
- Brand consistency
- Professional appearance

### Structure & Flow
- Logical progression
- Story narrative
- Slide organization
- Pacing

### Data & Evidence
- Metrics quality
- Proof points
- Credibility
- Research depth

### Investor Readiness
- Completeness
- Professionalism
- Persuasiveness
- Call to action

## AI Recommendations

Get specific suggestions for:
- **Strengths**: What works well
- **Weaknesses**: Areas to improve
- **Improvements**: Specific actions
- **Next Steps**: Priority fixes

## Using Feedback

1. Review overall score
2. Read category breakdowns
3. Focus on critical items
4. Make improvements
5. Re-analyze to track progress`,
  },
  {
    id: 'takedown-requestor',
    title: 'DMCA Takedown Requestor',
    category: 'business_dev',
    type: 'tutorial',
    order: 3,
    tags: ['dmca', 'copyright', 'legal'],
    content: `# DMCA Takedown Requestor

Generate professional DMCA takedown notices and cease & desist letters.

## When to Use

Use this tool when you discover:
- Copyright infringement
- Unauthorized use of your content
- Brand impersonation
- Stolen intellectual property

## Creating a Notice

1. Navigate to **TakeDown Requestor**
2. Select notice type:
   - DMCA Takedown
   - Cease & Desist
   - Trademark Infringement
   - Brand Impersonation
3. Fill in the details
4. Generate the notice
5. Review and send

## Required Information

### Infringement Details
- Type of infringement
- Your copyrighted work URL
- Infringing content URL
- Description of infringement
- Platform where hosted

### Your Information
- Your name/company
- Contact details
- Relationship to content
- Signature

## AI-Generated Notice

The AI creates a professional legal notice including:
- Proper legal language
- Statutory references
- Required declarations
- Contact information
- Deadlines for response

## Important Notes

- Review all information carefully
- Ensure accuracy of claims
- Keep records of all communications
- Consider legal counsel for complex cases
- Follow up if no response

## After Sending

1. Document the date sent
2. Save copies of correspondence
3. Track response deadline
4. Follow escalation procedures if needed`,
  },
  // Assets & Finance Articles
  {
    id: 'equipment-inventory',
    title: 'Equipment Inventory Management',
    category: 'assets',
    type: 'tutorial',
    is_featured: true,
    order: 1,
    tags: ['equipment', 'inventory', 'assets'],
    content: `# Equipment Inventory Management

Track and manage your company's physical assets.

## Adding Equipment

1. Go to **Equipment Inventory**
2. Click **Add Equipment**
3. Enter equipment details:
   - Name and category
   - Serial number
   - Purchase information
   - Current location
   - Assigned person
   - Condition status

## Categories

Organize by type:
- IT equipment
- Furniture
- Vehicles
- Machinery
- Office supplies
- Other assets

## Tracking Information

### Financial Data
- Purchase price
- Current value
- Depreciation
- Total asset value

### Maintenance
- Maintenance schedule
- Last maintenance date
- Next service due
- Service history

### Status Tracking
- Active
- In Repair
- Retired
- Disposed

## Dashboard Metrics

Monitor:
- Total items count
- Total asset value
- Items needing maintenance
- Total depreciation

## Best Practices

- Record all purchases immediately
- Update condition regularly
- Schedule preventive maintenance
- Track location changes
- Document repairs and services
- Review and audit periodically`,
  },
  {
    id: 'accounting-dashboard',
    title: 'Accounting Dashboard',
    category: 'assets',
    type: 'tutorial',
    order: 2,
    tags: ['accounting', 'finance', 'reports'],
    content: `# Accounting Dashboard

Monitor your financial health and performance.

## Overview Metrics

Track key financials:
- **Total Revenue**: Income for period
- **Total Expenses**: Costs incurred
- **Net Profit**: Revenue minus expenses
- **Profit Margin**: Profitability percentage

## Revenue vs Expenses Chart

View monthly trends:
- Revenue line (green)
- Expenses line (red)
- Profit line (blue)

Identify patterns and seasonality.

## Expenses by Category

See spending breakdown:
- Salaries
- Marketing
- Operations
- Software
- Other categories

Use pie chart to visualize proportions.

## Cash Flow Analysis

Monitor money movement:
- Cash inflows (income)
- Cash outflows (expenses)
- Net cash flow
- Trends over time

## Recent Transactions

View latest activity:
- Date and description
- Amount (income/expense)
- Category
- Balance impact

## Generating Reports

1. Click **Generate Report**
2. Select date range
3. Choose format (PDF, CSV)
4. Add custom notes
5. Download or email

## Financial Health Tips

- Monitor profit margins
- Control expense growth
- Maintain positive cash flow
- Review transactions regularly
- Plan for seasonal variations`,
  },
  {
    id: 'user-profile-settings',
    title: 'User Profile & Settings',
    category: 'settings',
    type: 'tutorial',
    order: 1,
    tags: ['profile', 'settings', 'account'],
    content: `# User Profile & Settings

Manage your personal information and preferences.

## Accessing Your Profile

Click your avatar in the top right, then select **Profile**.

## Profile Sections

### Personal Information
- Full name
- Email address
- Bio
- Location
- Phone number
- Company
- Website

### Security
- Change password
- Two-factor authentication
- Active sessions
- Security alerts

### Notifications
- Email notifications
- Push notifications
- Mention alerts
- Lead notifications
- Report ready alerts

### Preferences
- Theme (Light/Dark/Auto)
- Language
- Timezone
- Date format
- Dashboard settings

## Updating Information

1. Navigate to the relevant tab
2. Make your changes
3. Click **Save Changes**
4. Changes take effect immediately

## Security Best Practices

- Use a strong, unique password
- Enable two-factor authentication
- Review active sessions regularly
- Log out from unused devices
- Update contact info

## Notification Settings

Customize what you receive:
- Critical alerts (always on)
- Content ideas
- Competitor updates
- Weekly digest
- SEO alerts

## Privacy & Data

- Export your data anytime
- Control what's shared
- Manage connected apps
- Delete account option`,
  },
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
A: Start by adding your first contact, then create a deal to track your sales opportunity. Check out our Quick Start Guide for step-by-step instructions.

**Q: Can I import existing data?**
A: Yes! You can import contacts, companies, and deals from CSV files. Go to the relevant section and look for the Import button.

**Q: Is my data secure?**
A: Absolutely. All data is encrypted and stored securely. We follow industry best practices for data protection.

## CRM

**Q: How many contacts can I add?**
A: There's no limit to the number of contacts, companies, or deals you can create.

**Q: Can I link a contact to multiple companies?**
A: Currently, a contact can be linked to one company at a time.

**Q: How do I track activities?**
A: You can log calls, emails, meetings, and tasks on any contact or deal. Go to Activities or open a contact/deal to add activities.

## SEO

**Q: How often are keyword rankings updated?**
A: Rankings update when you run an analysis on your website. For the most current data, click the Analyze button.

**Q: What does Domain Authority mean?**
A: Domain Authority (DA) is a score from 0-100 that predicts how well your website will rank in search results. Higher is better.

**Q: How do I fix SEO issues?**
A: Run an SEO Audit to identify issues. Each issue includes recommendations for how to fix it on your website.

## Social Media

**Q: Which platforms are supported?**
A: We support Twitter/X, LinkedIn, Facebook, Instagram, and YouTube for social listening and analytics.

**Q: Can I post directly to social media?**
A: Use the Mobile Hub or Social Calendar to compose posts. You can schedule content and post directly to connected platforms.

**Q: How does sentiment analysis work?**
A: Our AI analyzes the text of each mention to determine if it's positive, neutral, or negative.

**Q: What is AI User Journey Mapping?**
A: AI analyzes all touchpoints across your website and social media to map how users navigate, identify conversion paths, find drop-off points, and suggest optimizations.

**Q: Is there a mobile app?**
A: Yes! The Mobile Hub provides a mobile-optimized experience. You can also install CatchAll to your home screen as a PWA for an app-like experience.

**Q: What are AI Predictions in Social Media?**
A: AI analyzes your historical data, industry trends, and competitor activity to forecast engagement, trending topics, and optimal content strategies.

**Q: How do I set up notifications?**
A: Go to User Settings > Notifications to customize email and push notification preferences for alerts, content ideas, competitor updates, and more.

**Q: Can I generate API keys?**
A: Yes, go to User Settings > API Keys to generate, manage, and revoke API keys for external integrations.

## Account & Settings

**Q: How do I invite team members?**
A: Go to Settings and look for the team management section to invite colleagues.

**Q: How do I change my password?**
A: Click on your profile in the top right and select account settings.

**Q: Can I export my data?**
A: Yes, most sections have an Export option to download your data as CSV.`,
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('guides');
  const [videoCategory, setVideoCategory] = useState('all');
  const [aiQuestion, _setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Get article from URL if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
      const article = DEFAULT_ARTICLES.find((a) => a.id === articleId);
      if (article) {
        setSelectedArticle(article);
        setSelectedCategory(article.category);
      }
    }
  }, []);

  const { data: customArticles = [] } = useQuery({
    queryKey: ['help-articles'],
    queryFn: () => base44.entities.HelpArticle.list('order', 100),
  });

  const allArticles = [...DEFAULT_ARTICLES, ...customArticles].sort(
    (a, b) => (a.order || 99) - (b.order || 99)
  );

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allArticles, searchQuery, selectedCategory]);

  const articlesByCategory = useMemo(() => {
    const grouped = {};
    CATEGORIES.forEach((cat) => {
      grouped[cat.id] = allArticles.filter((a) => a.category === cat.id);
    });
    return grouped;
  }, [allArticles]);

  const toggleSection = (categoryId) => {
    setExpandedSections((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) {
      return;
    }

    setIsAskingAI(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for the CatchAll Business Suite platform. Answer the following question based on the platform's features: CRM, SEO tools, social media management, marketing automation, analytics, AI tools, pitch deck creator/analyzer, DMCA takedown generator, equipment inventory, accounting dashboard, and user profiles. Question: ${aiQuestion}`,
      });
      setAiAnswer(response);
    } catch (_error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsAskingAI(false);
    }
  };

  const filteredVideos =
    videoCategory === 'all'
      ? VIDEO_TUTORIALS
      : VIDEO_TUTORIALS.filter((v) => v.category === videoCategory);

  // Article view
  if (selectedArticle) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hidden lg:block">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedArticle(null);
                setSelectedCategory(null);
              }}
              className="gap-2 w-full justify-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Help Center
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-4">
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => toggleSection(cat.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedArticle?.category === cat.id
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </span>
                    {expandedSections[cat.id] || selectedArticle?.category === cat.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {(expandedSections[cat.id] || selectedArticle?.category === cat.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {articlesByCategory[cat.id]?.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setSelectedArticle(article)}
                          className={`w-full text-left p-2 rounded text-sm transition-colors ${
                            selectedArticle?.id === article.id
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Article Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-8">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedArticle(null);
                setSelectedCategory(null);
              }}
              className="mb-4 gap-2 lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-2 mb-4">
              <Badge
                className={
                  CATEGORIES.find((c) => c.id === selectedArticle.category)?.color || 'bg-gray-100'
                }
              >
                {CATEGORIES.find((c) => c.id === selectedArticle.category)?.label ||
                  selectedArticle.category}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {selectedArticle.type}
              </Badge>
            </div>

            <article className="max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node: _node, ...props }) => (
                    <h1
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700"
                      {...props}
                    />
                  ),
                  h2: ({ node: _node, ...props }) => (
                    <h2
                      className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4 flex items-center gap-2"
                      {...props}
                    />
                  ),
                  h3: ({ node: _node, ...props }) => (
                    <h3
                      className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3"
                      {...props}
                    />
                  ),
                  p: ({ node: _node, ...props }) => (
                    <p
                      className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed"
                      {...props}
                    />
                  ),
                  ul: ({ node: _node, ...props }) => (
                    <ul className="space-y-2 mb-6 ml-1" {...props} />
                  ),
                  ol: ({ node: _node, ...props }) => (
                    <ol className="space-y-3 mb-6 ml-1 list-none counter-reset-item" {...props} />
                  ),
                  li: ({ node: _node, ordered, ...props }) => (
                    <li className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-medium mt-0.5">
                        {ordered ? props.index + 1 : '•'}
                      </span>
                      <span className="flex-1" {...props} />
                    </li>
                  ),
                  strong: ({ node: _node, ...props }) => (
                    <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                  ),
                  table: ({ node: _node, ...props }) => (
                    <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <table
                        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                        {...props}
                      />
                    </div>
                  ),
                  thead: ({ node: _node, ...props }) => (
                    <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
                  ),
                  th: ({ node: _node, ...props }) => (
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      {...props}
                    />
                  ),
                  td: ({ node: _node, ...props }) => (
                    <td
                      className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700"
                      {...props}
                    />
                  ),
                  tr: ({ node: _node, ...props }) => (
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      {...props}
                    />
                  ),
                  blockquote: ({ node: _node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-violet-400 bg-violet-50 dark:bg-violet-900/20 pl-4 py-3 my-4 rounded-r-lg text-gray-700 dark:text-gray-300 italic"
                      {...props}
                    />
                  ),
                  code: ({ node: _node, inline, ...props }) =>
                    inline ? (
                      <code
                        className="bg-gray-100 dark:bg-gray-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      />
                    ) : (
                      <code
                        className="block bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-xl text-sm font-mono overflow-x-auto my-4"
                        {...props}
                      />
                    ),
                  hr: ({ node: _node, ...props }) => (
                    <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />
                  ),
                  a: ({ node: _node, ...props }) => (
                    <a
                      className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                      {...props}
                    />
                  ),
                }}
              >
                {selectedArticle.content}
              </ReactMarkdown>
            </article>

            {/* Related Articles */}
            {articlesByCategory[selectedArticle.category]?.length > 1 && (
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                <div className="grid gap-2">
                  {articlesByCategory[selectedArticle.category]
                    .filter((a) => a.id !== selectedArticle.id)
                    .slice(0, 3)
                    .map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{article.title}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Main Help Center view
  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">How can we help?</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Search our knowledge base, watch video tutorials, or ask our AI assistant
        </p>

        {/* Search with Ask AI */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search for help articles or ask a question..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null);
              }}
              className="pl-12 h-12 text-lg rounded-xl"
            />
          </div>
          <Button
            onClick={handleAskAI}
            disabled={isAskingAI}
            className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {isAskingAI ? 'Asking...' : 'Ask AI'}
          </Button>
        </div>

        {/* AI Answer */}
        {aiAnswer && (
          <Card className="mt-4 text-left bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">AI Assistant</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {aiAnswer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="guides">
              <BookOpen className="w-4 h-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="quickstart">
              <PlayCircle className="w-4 h-4 mr-2" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="popular">
              <Star className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
          </TabsList>

          {/* Guides Tab */}
          <TabsContent value="guides" className="mt-6">
            {/* Search Results */}
            {searchQuery && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">
                  {filteredArticles.length} results for "{searchQuery}"
                </h2>
                <div className="space-y-2">
                  {filteredArticles.map((article) => {
                    const cat = CATEGORIES.find((c) => c.id === article.category);
                    return (
                      <Card
                        key={article.id}
                        className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}
                          >
                            {cat?.icon && <cat.icon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {article.content?.replace(/[#*`]/g, '').substring(0, 100)}...
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredArticles.length === 0 && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-8 text-center">
                        <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No articles found matching your search</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Default View (no search) */}
            {!searchQuery && (
              <>
                {/* Quick Start */}
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <PlayCircle className="w-5 h-5 text-violet-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Quick Start
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_START_STEPS.map((step, idx) => (
                      <Link key={step.id} to={createPageUrl(step.link)} className="group">
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                                {idx + 1}
                              </div>
                              <step.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                              {step.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {step.description}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-violet-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Browse by Category
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CATEGORIES.map((cat) => (
                      <Card
                        key={cat.id}
                        className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          const firstArticle = articlesByCategory[cat.id]?.[0];
                          if (firstArticle) {
                            setSelectedArticle(firstArticle);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div
                            className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                          >
                            <cat.icon className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {cat.label}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {cat.description}
                          </p>
                          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                            {articlesByCategory[cat.id]?.length || 0} articles
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Featured Articles */}
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Popular Articles
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allArticles
                      .filter((a) => a.is_featured)
                      .slice(0, 6)
                      .map((article) => {
                        const cat = CATEGORIES.find((c) => c.id === article.category);
                        return (
                          <Card
                            key={article.id}
                            className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setSelectedArticle(article)}
                          >
                            <CardContent className="p-4 flex items-start gap-4">
                              <div
                                className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}
                              >
                                {cat?.icon && <cat.icon className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                                  {article.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {article.content?.replace(/[#*`]/g, '').substring(0, 80)}...
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                {/* Still Need Help */}
                <div className="max-w-xl mx-auto text-center">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
                    <CardContent className="p-6">
                      <MessageSquare className="w-10 h-10 text-violet-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Still need help?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Can't find what you're looking for? Our support team is here to help.
                      </p>
                      <Button className="bg-violet-600 hover:bg-violet-700">Contact Support</Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={videoCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setVideoCategory('all')}
                  size="sm"
                >
                  All Videos
                </Button>
                {CATEGORIES.map((cat) => {
                  const videosInCategory = VIDEO_TUTORIALS.filter(
                    (v) => v.category === cat.id
                  ).length;
                  if (videosInCategory === 0) {
                    return null;
                  }
                  return (
                    <Button
                      key={cat.id}
                      variant={videoCategory === cat.id ? 'default' : 'outline'}
                      onClick={() => setVideoCategory(cat.id)}
                      size="sm"
                      className="gap-1"
                    >
                      <cat.icon className="w-3 h-3" />
                      {cat.label} ({videosInCategory})
                    </Button>
                  );
                })}
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => {
                  const cat = CATEGORIES.find((c) => c.id === video.category);
                  return (
                    <Card
                      key={video.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div
                        className={`aspect-video ${video.thumbnail} relative flex items-center justify-center cursor-pointer group`}
                      >
                        {video.isFeatured && (
                          <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                        <div className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-10 h-10 text-violet-600" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {video.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {video.views} views
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {cat?.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {QUICK_START_STEPS.map((step, idx) => (
                <Link key={step.id} to={createPageUrl(step.link)} className="group">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <step.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allArticles
                .filter((a) => a.is_featured)
                .slice(0, 8)
                .map((article) => {
                  const cat = CATEGORIES.find((c) => c.id === article.category);
                  return (
                    <Card
                      key={article.id}
                      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="p-4 flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}
                        >
                          {cat?.icon && <cat.icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {article.content?.replace(/[#*`]/g, '').substring(0, 80)}...
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
