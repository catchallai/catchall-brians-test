import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search, BookOpen, HelpCircle, Video, ChevronRight, ChevronDown, ChevronUp,
  Users, Target, BarChart3, Share2, Mail, Zap, Home, ArrowLeft, Globe, Radio,
  Settings, PenTool, TrendingUp, Phone, MessageSquare, Lightbulb, PlayCircle,
  FileQuestion, Sparkles, Star, Eye, Package, Presentation, Scale, ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { DEFAULT_ARTICLES } from '@/components/help/helpArticles';

const CATEGORIES = [
  { id: 'getting_started', label: 'Getting Started', icon: Home, color: 'bg-violet-100 text-violet-700', description: 'New to CatchAll? Start here' },
  { id: 'crm', label: 'CRM & Contacts', icon: Users, color: 'bg-blue-100 text-blue-700', description: 'Manage contacts, companies, and deals' },
  { id: 'seo', label: 'SEO Tools', icon: BarChart3, color: 'bg-amber-100 text-amber-700', description: 'Track rankings, keywords, and backlinks' },
  { id: 'analytics', label: 'Traffic & Analytics', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700', description: 'User journeys, visitor insights, and AI analytics' },
  { id: 'social_media', label: 'Social Media', icon: Share2, color: 'bg-pink-100 text-pink-700', description: 'Social listening, scheduling, and AI predictions' },
  { id: 'marketing', label: 'Marketing', icon: Mail, color: 'bg-indigo-100 text-indigo-700', description: 'Campaigns, email marketing, and reports' },
  { id: 'content', label: 'Content', icon: PenTool, color: 'bg-cyan-100 text-cyan-700', description: 'Content strategy and creation' },
  { id: 'automation', label: 'Automation', icon: Zap, color: 'bg-amber-100 text-amber-700', description: 'Automate your workflows' },
  { id: 'legal', label: 'Legal', icon: Scale, color: 'bg-indigo-100 text-indigo-700', description: 'Matters, litigation, IP, counsel & entities' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-700', description: 'Policies, audits, risk & export control' },
  { id: 'hris', label: 'HRIS & People', icon: Users, color: 'bg-teal-100 text-teal-700', description: 'Employees, payroll, benefits & talent' },
  { id: 'ai_tools', label: 'AI Tools', icon: Sparkles, color: 'bg-purple-100 text-purple-700', description: 'AI-powered features and tools' },
  { id: 'business_dev', label: 'Business Dev', icon: Presentation, color: 'bg-blue-100 text-blue-700', description: 'Pitch decks, data rooms, DocuTrace & aerospace' },
  { id: 'assets', label: 'Assets & Finance', icon: Package, color: 'bg-emerald-100 text-emerald-700', description: 'Equipment, accounting & equity' },
  { id: 'whitelabel', label: 'Whitelabel & SaaS', icon: Sparkles, color: 'bg-purple-100 text-purple-700', description: 'Branding, industry customization, multi-tenant setup' },
  { id: 'mobile', label: 'Mobile App', icon: Phone, color: 'bg-purple-100 text-purple-700', description: 'CatchAll on-the-go' },
  { id: 'settings', label: 'Settings & Account', icon: Settings, color: 'bg-gray-100 text-gray-700', description: 'Profile, notifications, API keys' },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, color: 'bg-slate-100 text-slate-700', description: 'Common questions answered' },
];

const VIDEO_TUTORIALS = [
  { id: 'v1', title: 'Getting Started with CatchAll', description: 'Complete walkthrough of CatchAll features and setup', duration: '5:32', views: '1.2K', category: 'getting_started', thumbnail: 'bg-gradient-to-br from-blue-500 to-indigo-600', isFeatured: true },
  { id: 'v2', title: 'CRM Best Practices', description: 'Manage contacts, deals, and pipeline effectively', duration: '8:15', views: '0.9K', category: 'crm', thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-600', isFeatured: true },
  { id: 'v3', title: 'SEO Audit Walkthrough', description: 'Step-by-step guide to running SEO audits', duration: '12:40', views: '2.1K', category: 'seo', thumbnail: 'bg-gradient-to-br from-emerald-500 to-teal-600', isFeatured: true },
  { id: 'v4', title: 'Legal Module Overview', description: 'Manage matters, litigation, IP, and legal entities', duration: '9:20', views: '0.8K', category: 'legal', thumbnail: 'bg-gradient-to-br from-indigo-500 to-blue-600', isFeatured: true },
  { id: 'v5', title: 'Compliance Dashboard', description: 'Set up policies, audits, risk register, and export control', duration: '11:05', views: '0.7K', category: 'compliance', thumbnail: 'bg-gradient-to-br from-emerald-500 to-green-600', isFeatured: true },
  { id: 'v6', title: 'HRIS Setup Guide', description: 'Add departments, employees, and set up onboarding', duration: '10:30', views: '1.1K', category: 'hris', thumbnail: 'bg-gradient-to-br from-teal-500 to-cyan-600', isFeatured: true },
  { id: 'v7', title: 'Social Listening Setup', description: 'Monitor brand mentions and sentiment', duration: '6:25', views: '0.7K', category: 'social_media', thumbnail: 'bg-gradient-to-br from-orange-500 to-red-600' },
  { id: 'v8', title: 'AI-Powered Tools Overview', description: 'Discover AI features for lead scoring, content, and more', duration: '11:30', views: '2.5K', category: 'ai_tools', thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-500', isFeatured: true },
  { id: 'v9', title: 'Data Rooms & DocuTrace', description: 'Secure document sharing and engagement tracking', duration: '7:45', views: '0.6K', category: 'business_dev', thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  { id: 'v10', title: 'Equity Management', description: 'Set up equity pools, grants, and vesting schedules', duration: '8:55', views: '0.5K', category: 'assets', thumbnail: 'bg-gradient-to-br from-lime-500 to-green-500' },
];

const QUICK_START_STEPS = [
  { id: 1, title: 'Add Your First Contact', description: 'Go to Contacts and create your first lead or customer', link: 'Contacts', icon: Users },
  { id: 2, title: 'Create a Deal', description: 'Track a sales opportunity in your pipeline', link: 'Deals', icon: Target },
  { id: 3, title: 'Set Up Legal Matter', description: 'Add a legal matter to track a case or project', link: 'LegalMatters', icon: Scale },
  { id: 4, title: 'Add an Employee', description: 'Create an employee record in HRIS', link: 'HRISEmployees', icon: Users },
  { id: 5, title: 'Set Up SEO Tracking', description: 'Add your website to monitor SEO performance', link: 'SEODashboard', icon: Globe },
  { id: 6, title: 'Start Social Listening', description: 'Track mentions of your brand across social media', link: 'SocialListening', icon: Radio },
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

  useEffect(() => {
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

  const allArticles = [...DEFAULT_ARTICLES, ...customArticles].sort((a, b) => (a.order || 99) - (b.order || 99));

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchesSearch = !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allArticles, searchQuery, selectedCategory]);

  const articlesByCategory = useMemo(() => {
    const grouped = {};
    CATEGORIES.forEach((cat) => { grouped[cat.id] = allArticles.filter((a) => a.category === cat.id); });
    return grouped;
  }, [allArticles]);

  const toggleSection = (categoryId) => {
    setExpandedSections((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setIsAskingAI(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for the CatchAll Business Suite platform. Answer the following question based on the platform's features: CRM, SEO tools, social media management, marketing automation, analytics, AI tools, Legal module (matters, litigation, IP, obligations, counsel, entities), Compliance (policies, audits, risk, export control), HRIS (employees, payroll, benefits, onboarding, performance, equity, talent), Business Dev (pitch decks, data rooms, DocuTrace, aerospace scanner), and Finance (equity, accounting). Question: ${aiQuestion}`,
      });
      setAiAnswer(response);
    } catch (_error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsAskingAI(false);
    }
  };

  const filteredVideos = videoCategory === 'all' ? VIDEO_TUTORIALS : VIDEO_TUTORIALS.filter((v) => v.category === videoCategory);

  const mdComponents = {
    h1: ({ node: _n, ...p }) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700" {...p} />,
    h2: ({ node: _n, ...p }) => <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4" {...p} />,
    h3: ({ node: _n, ...p }) => <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3" {...p} />,
    p: ({ node: _n, ...p }) => <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed" {...p} />,
    ul: ({ node: _n, ...p }) => <ul className="space-y-2 mb-6 ml-4 list-disc" {...p} />,
    ol: ({ node: _n, ...p }) => <ol className="space-y-2 mb-6 ml-4 list-decimal" {...p} />,
    li: ({ node: _n, ...p }) => <li className="text-gray-600 dark:text-gray-300" {...p} />,
    strong: ({ node: _n, ...p }) => <strong className="font-semibold text-gray-900 dark:text-white" {...p} />,
    table: ({ node: _n, ...p }) => <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-gray-700"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...p} /></div>,
    thead: ({ node: _n, ...p }) => <thead className="bg-gray-50 dark:bg-gray-800" {...p} />,
    th: ({ node: _n, ...p }) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" {...p} />,
    td: ({ node: _n, ...p }) => <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700" {...p} />,
    blockquote: ({ node: _n, ...p }) => <blockquote className="border-l-4 border-violet-400 bg-violet-50 dark:bg-violet-900/20 pl-4 py-3 my-4 rounded-r-lg text-gray-700 dark:text-gray-300 italic" {...p} />,
    code: ({ node: _n, inline, ...p }) => inline
      ? <code className="bg-gray-100 dark:bg-gray-800 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-sm font-mono" {...p} />
      : <code className="block bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-xl text-sm font-mono overflow-x-auto my-4" {...p} />,
  };

  if (selectedArticle) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        <aside className="w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hidden lg:block">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={() => { setSelectedArticle(null); setSelectedCategory(null); }} className="gap-2 w-full justify-start">
              <ArrowLeft className="w-4 h-4" />
              Back to Help Center
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-4">
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <button onClick={() => toggleSection(cat.id)} className={`w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors ${selectedArticle?.category === cat.id ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <span className="flex items-center gap-2"><cat.icon className="w-4 h-4" />{cat.label}</span>
                    {expandedSections[cat.id] || selectedArticle?.category === cat.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {(expandedSections[cat.id] || selectedArticle?.category === cat.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {articlesByCategory[cat.id]?.map((article) => (
                        <button key={article.id} onClick={() => setSelectedArticle(article)} className={`w-full text-left p-2 rounded text-sm transition-colors ${selectedArticle?.id === article.id ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
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

        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-8">
            <Button variant="ghost" onClick={() => { setSelectedArticle(null); setSelectedCategory(null); }} className="mb-4 gap-2 lg:hidden">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div className="flex items-center gap-2 mb-4">
              <Badge className={CATEGORIES.find((c) => c.id === selectedArticle.category)?.color || 'bg-gray-100'}>
                {CATEGORIES.find((c) => c.id === selectedArticle.category)?.label || selectedArticle.category}
              </Badge>
              <Badge variant="outline" className="capitalize">{selectedArticle.type}</Badge>
            </div>
            <article className="max-w-none">
              <ReactMarkdown components={mdComponents}>{selectedArticle.content}</ReactMarkdown>
            </article>
            {articlesByCategory[selectedArticle.category]?.length > 1 && (
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                <div className="grid gap-2">
                  {articlesByCategory[selectedArticle.category].filter((a) => a.id !== selectedArticle.id).slice(0, 3).map((article) => (
                    <button key={article.id} onClick={() => setSelectedArticle(article)} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
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

  return (
    <div className="p-6 lg:p-8 space-y-8 min-h-screen">
      <div className="text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">How can we help?</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Search our knowledge base, watch video tutorials, or ask our AI assistant</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Search articles — Legal, HRIS, Compliance, CRM, SEO..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); }} className="pl-12 h-12 text-lg rounded-xl" />
          </div>
          <Button onClick={handleAskAI} disabled={isAskingAI} className="h-12 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
            <Sparkles className="w-5 h-5 mr-2" />
            {isAskingAI ? 'Asking...' : 'Ask AI'}
          </Button>
        </div>
        {aiAnswer && (
          <Card className="mt-4 text-left bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">AI Assistant</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiAnswer}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="guides"><BookOpen className="w-4 h-4 mr-2" />Guides</TabsTrigger>
            <TabsTrigger value="videos"><Video className="w-4 h-4 mr-2" />Videos</TabsTrigger>
            <TabsTrigger value="quickstart"><PlayCircle className="w-4 h-4 mr-2" />Quick Start</TabsTrigger>
            <TabsTrigger value="popular"><Star className="w-4 h-4 mr-2" />Popular</TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="mt-6">
            {searchQuery && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">{filteredArticles.length} results for "{searchQuery}"</h2>
                <div className="space-y-2">
                  {filteredArticles.map((article) => {
                    const cat = CATEGORIES.find((c) => c.id === article.category);
                    return (
                      <Card key={article.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedArticle(article)}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                            {cat?.icon && <cat.icon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white">{article.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{article.content?.replace(/[#*`]/g, '').substring(0, 100)}...</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredArticles.length === 0 && (
                    <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center"><FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No articles found matching your search</p></CardContent></Card>
                  )}
                </div>
              </div>
            )}
            {!searchQuery && (
              <>
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <PlayCircle className="w-5 h-5 text-violet-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Start</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {QUICK_START_STEPS.map((step, idx) => (
                      <Link key={step.id} to={createPageUrl(step.link)} className="group">
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">{idx + 1}</div>
                              <step.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{step.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-violet-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Browse by Category</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CATEGORIES.map((cat) => (
                      <Card key={cat.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => { setSelectedCategory(cat.id); const first = articlesByCategory[cat.id]?.[0]; if (first) setSelectedArticle(first); }}>
                        <CardContent className="p-4">
                          <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <cat.icon className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cat.label}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{cat.description}</p>
                          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">{articlesByCategory[cat.id]?.length || 0} articles</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Popular Articles</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allArticles.filter((a) => a.is_featured).slice(0, 8).map((article) => {
                      const cat = CATEGORIES.find((c) => c.id === article.category);
                      return (
                        <Card key={article.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedArticle(article)}>
                          <CardContent className="p-4 flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                              {cat?.icon && <cat.icon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-white mb-1">{article.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{article.content?.replace(/[#*`]/g, '').substring(0, 80)}...</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div className="max-w-xl mx-auto text-center">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
                    <CardContent className="p-6">
                      <MessageSquare className="w-10 h-10 text-violet-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Still need help?</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Can't find what you're looking for? Our support team is here to help.</p>
                      <Button className="bg-violet-600 hover:bg-violet-700">Contact Support</Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Button variant={videoCategory === 'all' ? 'default' : 'outline'} onClick={() => setVideoCategory('all')} size="sm">All Videos</Button>
                {CATEGORIES.map((cat) => {
                  const count = VIDEO_TUTORIALS.filter((v) => v.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <Button key={cat.id} variant={videoCategory === cat.id ? 'default' : 'outline'} onClick={() => setVideoCategory(cat.id)} size="sm" className="gap-1">
                      <cat.icon className="w-3 h-3" />{cat.label} ({count})
                    </Button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => {
                  const cat = CATEGORIES.find((c) => c.id === video.category);
                  return (
                    <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className={`aspect-video ${video.thumbnail} relative flex items-center justify-center cursor-pointer group`}>
                        {video.isFeatured && <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                        <div className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-10 h-10 text-violet-600" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">{video.duration}</div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{video.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{video.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views} views</div>
                          <Badge variant="outline" className="text-xs">{cat?.label}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quickstart" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {QUICK_START_STEPS.map((step, idx) => (
                <Link key={step.id} to={createPageUrl(step.link)} className="group">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">{idx + 1}</div>
                        <step.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allArticles.filter((a) => a.is_featured).slice(0, 10).map((article) => {
                const cat = CATEGORIES.find((c) => c.id === article.category);
                return (
                  <Card key={article.id} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedArticle(article)}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${cat?.color || 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                        {cat?.icon && <cat.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{article.content?.replace(/[#*`]/g, '').substring(0, 80)}...</p>
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