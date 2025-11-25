import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, BookOpen, HelpCircle, Video, ChevronRight, ChevronDown,
  Users, Target, BarChart3, Share2, Mail, Zap, Home, ArrowLeft
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = [
  { id: 'getting_started', label: 'Getting Started', icon: Home, color: 'bg-violet-100 text-violet-700' },
  { id: 'crm', label: 'CRM', icon: Users, color: 'bg-blue-100 text-blue-700' },
  { id: 'seo', label: 'SEO', icon: BarChart3, color: 'bg-amber-100 text-amber-700' },
  { id: 'social_media', label: 'Social Media', icon: Share2, color: 'bg-pink-100 text-pink-700' },
  { id: 'marketing', label: 'Marketing', icon: Mail, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'automation', label: 'Automation', icon: Zap, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, color: 'bg-gray-100 text-gray-700' },
];

const DEFAULT_ARTICLES = [
  {
    id: 'welcome',
    title: 'Welcome to CRM + SEO Suite',
    category: 'getting_started',
    type: 'guide',
    is_featured: true,
    tags: ['introduction', 'overview', 'basics'],
    content: `# Welcome to CRM + SEO Suite

Your all-in-one platform for managing customer relationships, SEO performance, and social media presence.

## Key Features

### CRM & Lead Management
- **Contacts**: Store and manage all your contacts in one place
- **Companies**: Organize contacts by company
- **Deals**: Track sales opportunities through your pipeline
- **Activities**: Log calls, emails, meetings, and tasks

### SEO Tools
- **Website Monitoring**: Track your site's SEO health
- **Keyword Tracking**: Monitor search rankings
- **Backlink Analysis**: Discover and track backlinks
- **SEO Audits**: Run comprehensive site audits

### Social Media
- **Account Analysis**: Analyze your social presence
- **Post Scheduling**: Schedule posts with AI optimization
- **Competitor Tracking**: Monitor competitor strategies
- **A/B Testing**: Test different content variations

### Marketing Automation
- **Email Campaigns**: Create and send email campaigns
- **Templates**: Design reusable email templates
- **Automation Rules**: Set up triggered actions
- **Campaign Tracking**: Monitor campaign performance

## Getting Started

1. **Add your first contact** - Go to Contacts and click "Add Contact"
2. **Create a deal** - Link it to your contact and track progress
3. **Set up your website** - Add your site to monitor SEO
4. **Connect social accounts** - Analyze your social presence

Need help? Browse our tutorials or check the FAQ section.`
  },
  {
    id: 'contacts-guide',
    title: 'Managing Contacts',
    category: 'crm',
    type: 'tutorial',
    is_featured: true,
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

## Contact Statuses

- **Lead**: New potential customer
- **Prospect**: Qualified and interested
- **Customer**: Active customer
- **Churned**: Former customer

## Linking Contacts to Companies

1. Create or select a company first
2. When editing a contact, select the company from the dropdown
3. All contacts for a company will be visible on the company page

## Best Practices

- Keep contact information up to date
- Log all interactions as activities
- Use tags for easy filtering
- Set follow-up reminders`
  },
  {
    id: 'deals-pipeline',
    title: 'Using the Deal Pipeline',
    category: 'crm',
    type: 'tutorial',
    tags: ['deals', 'pipeline', 'sales'],
    content: `# Using the Deal Pipeline

Track your sales opportunities from lead to close.

## Deal Stages

1. **Lead**: Initial contact, not yet qualified
2. **Qualified**: Confirmed interest and budget
3. **Proposal**: Sent proposal or quote
4. **Negotiation**: Discussing terms
5. **Won**: Deal closed successfully
6. **Lost**: Deal didn't close

## Creating a Deal

1. Go to **Deals** from the sidebar
2. Click **Add Deal**
3. Enter deal details:
   - Title
   - Value
   - Stage
   - Contact
   - Company
   - Expected Close Date
   - Win Probability

## Tips for Success

- Update deal stages promptly
- Add notes for context
- Link related activities
- Review pipeline regularly`
  },
  {
    id: 'seo-basics',
    title: 'SEO Monitoring Basics',
    category: 'seo',
    type: 'tutorial',
    is_featured: true,
    tags: ['seo', 'keywords', 'rankings'],
    content: `# SEO Monitoring Basics

Learn how to track and improve your search engine rankings.

## Adding a Website

1. Go to **SEO Dashboard**
2. Click **Add Website**
3. Enter your website URL and name
4. The system will analyze your site

## Tracking Keywords

1. Navigate to **Keywords**
2. Click **Add Keyword**
3. Enter the keyword and target URL
4. Monitor position changes over time

## Understanding Metrics

- **Domain Authority**: Overall site authority (0-100)
- **Organic Traffic**: Estimated monthly visitors
- **SEO Score**: Overall health score
- **Keyword Position**: Search ranking for specific terms

## Running an SEO Audit

1. Go to **SEO Audit**
2. Select a website
3. Click **Run Audit**
4. Review issues by priority`
  },
  {
    id: 'social-scheduling',
    title: 'Scheduling Social Posts',
    category: 'social_media',
    type: 'tutorial',
    tags: ['social', 'scheduling', 'posts'],
    content: `# Scheduling Social Posts

Plan and schedule your social media content in advance.

## Adding a Social Account

1. Go to **Social Media**
2. Click **Add Account**
3. Select the platform
4. Enter your account handle

## Scheduling a Post

1. Click **Schedule Post**
2. Select the platform and account
3. Write your content
4. Use **AI Optimize** for suggestions
5. Add hashtags
6. Set the date and time
7. Click **Schedule**

## AI Features

- **Content Optimization**: Improve engagement
- **Hashtag Suggestions**: Relevant hashtags
- **Best Times**: Optimal posting times
- **A/B Testing**: Test content variations`
  },
  {
    id: 'faq-general',
    title: 'Frequently Asked Questions',
    category: 'faq',
    type: 'faq',
    is_featured: true,
    tags: ['faq', 'help', 'questions'],
    content: `# Frequently Asked Questions

## General

**Q: How do I get started?**
A: Start by adding your first contact, then create a deal to track your sales opportunity.

**Q: Can I import existing data?**
A: Yes, you can bulk import contacts and other data through CSV files.

**Q: Is my data secure?**
A: Yes, all data is encrypted and stored securely.

## CRM

**Q: How many contacts can I add?**
A: There's no limit to the number of contacts.

**Q: Can I link a contact to multiple companies?**
A: Currently, a contact can be linked to one company.

## SEO

**Q: How often are keyword rankings updated?**
A: Rankings are updated when you run an analysis.

**Q: What does Domain Authority mean?**
A: It's a score (0-100) predicting how well a site will rank.

## Social Media

**Q: Which platforms are supported?**
A: Twitter/X, LinkedIn, Facebook, Instagram, and YouTube.

**Q: Can I post directly from the app?**
A: Currently, the app helps you schedule and plan content.`
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedFAQs, setExpandedFAQs] = useState({});

  // Get article from URL if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
      const article = DEFAULT_ARTICLES.find(a => a.id === articleId);
      if (article) setSelectedArticle(article);
    }
  }, []);

  const { data: customArticles = [] } = useQuery({
    queryKey: ['help-articles'],
    queryFn: () => base44.entities.HelpArticle.list('order', 100),
  });

  const allArticles = [...DEFAULT_ARTICLES, ...customArticles];

  const filteredArticles = useMemo(() => {
    return allArticles.filter(article => {
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allArticles, searchQuery, selectedCategory]);

  const featuredArticles = allArticles.filter(a => a.is_featured);

  const toggleFAQ = (id) => {
    setExpandedFAQs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (selectedArticle) {
    return (
      <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Button>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={CATEGORIES.find(c => c.id === selectedArticle.category)?.color || 'bg-gray-100'}>
                  {CATEGORIES.find(c => c.id === selectedArticle.category)?.label || selectedArticle.category}
                </Badge>
                <Badge variant="outline">{selectedArticle.type}</Badge>
              </div>
              <div className="prose prose-violet max-w-none">
                <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-500 mb-6">Find answers, tutorials, and guides to help you get the most out of CRM + SEO Suite</p>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="gap-1"
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Featured Articles */}
      {!searchQuery && selectedCategory === 'all' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map(article => {
              const cat = CATEGORIES.find(c => c.id === article.category);
              return (
                <Card 
                  key={article.id}
                  className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center mb-3`}>
                      {cat?.icon && <cat.icon className="w-5 h-5" />}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {article.content?.substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">{article.type}</Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Articles */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {searchQuery ? `Search Results (${filteredArticles.length})` : 'All Articles'}
        </h2>
        <div className="space-y-2">
          {filteredArticles.map(article => {
            const cat = CATEGORIES.find(c => c.id === article.category);
            return (
              <Card 
                key={article.id}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                    {cat?.icon && <cat.icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{article.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${cat?.color} text-xs border-0`}>{cat?.label}</Badge>
                      <Badge variant="outline" className="text-xs">{article.type}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}