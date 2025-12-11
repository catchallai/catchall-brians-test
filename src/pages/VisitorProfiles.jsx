import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserCircle, MapPin, Clock, Eye, MousePointer, Building2, Sparkles, 
  TrendingUp, Target, Zap, Star, Globe, Monitor, Smartphone, Tablet,
  Search, Filter, ChevronRight, ArrowUpRight, ExternalLink, Mail,
  Calendar, Activity, Info
} from "lucide-react";

// AI Lead Scoring Engine
const calculateAILeadScore = (visitor) => {
  const scoreFactors = [];
  let baseScore = 40;
  
  const highValueIndustries = ['Aviation', 'Private Aviation', 'Private Equity', 'Investment', 'Banking', 'Conglomerate'];
  const mediumValueIndustries = ['Financial Services', 'Energy', 'Automotive', 'Luxury Goods', 'Technology'];
  
  if (highValueIndustries.includes(visitor.industry)) {
    baseScore += 20;
    scoreFactors.push({ factor: 'High-value industry', impact: '+20', icon: 'industry', description: `${visitor.industry} has 3.2x higher conversion rate` });
  } else if (mediumValueIndustries.includes(visitor.industry)) {
    baseScore += 12;
    scoreFactors.push({ factor: 'Target industry', impact: '+12', icon: 'industry', description: `${visitor.industry} shows strong purchase intent` });
  }
  
  if (visitor.pagesViewed >= 8) {
    baseScore += 15;
    scoreFactors.push({ factor: 'Deep engagement', impact: '+15', icon: 'engagement', description: `${visitor.pagesViewed} pages viewed indicates serious interest` });
  } else if (visitor.pagesViewed >= 5) {
    baseScore += 10;
    scoreFactors.push({ factor: 'Good engagement', impact: '+10', icon: 'engagement', description: `${visitor.pagesViewed} pages explored` });
  }
  
  const timeMinutes = parseInt(visitor.timeOnSite.split('m')[0]);
  if (timeMinutes >= 15) {
    baseScore += 12;
    scoreFactors.push({ factor: 'Extended session', impact: '+12', icon: 'time', description: `${visitor.timeOnSite} on site (converts 2.8x more likely)` });
  } else if (timeMinutes >= 8) {
    baseScore += 8;
    scoreFactors.push({ factor: 'Quality session', impact: '+8', icon: 'time', description: `${visitor.timeOnSite} shows genuine interest` });
  }
  
  const highIntentPages = ['/ownership', '/contact', '/specs'];
  const visitedHighIntent = visitor.journey?.filter(j => highIntentPages.includes(j.page)) || [];
  if (visitedHighIntent.length > 0) {
    const intentBonus = Math.min(visitedHighIntent.length * 8, 16);
    baseScore += intentBonus;
    scoreFactors.push({ factor: 'High-intent pages', impact: `+${intentBonus}`, icon: 'intent', description: `Visited ${visitedHighIntent.map(p => p.page).join(', ')}` });
  }
  
  if (visitor.visitCount > 1) {
    const returnBonus = Math.min(visitor.visitCount * 3, 12);
    baseScore += returnBonus;
    scoreFactors.push({ factor: 'Return visitor', impact: `+${returnBonus}`, icon: 'return', description: `${visitor.visitCount} total visits shows sustained interest` });
  }
  
  const premiumReferrers = ['bloomberg.com', 'ainonline.com', 'bjtonline.com', 'linkedin.com'];
  if (premiumReferrers.includes(visitor.referrer)) {
    baseScore += 8;
    scoreFactors.push({ factor: 'Quality referrer', impact: '+8', icon: 'referrer', description: `Came from ${visitor.referrer} (high-intent source)` });
  }
  
  if (visitor.device === 'Desktop') {
    baseScore += 5;
    scoreFactors.push({ factor: 'Desktop user', impact: '+5', icon: 'device', description: 'Desktop users have 2.1x higher conversion rate' });
  }
  
  const finalScore = Math.min(baseScore, 100);
  
  let tier, recommendation;
  if (finalScore >= 85) {
    tier = 'hot';
    recommendation = 'Immediate outreach recommended - high purchase intent signals';
  } else if (finalScore >= 70) {
    tier = 'warm';
    recommendation = 'Priority follow-up - nurture with targeted content';
  } else if (finalScore >= 50) {
    tier = 'engaged';
    recommendation = 'Add to nurture sequence - building interest';
  } else {
    tier = 'early';
    recommendation = 'Early stage - monitor for increased engagement';
  }
  
  return { score: finalScore, factors: scoreFactors, tier, recommendation };
};

// Generate visitors data
const generateVisitors = () => {
  const companies = [
    { company: 'Desert Aviation Holdings', industry: 'Private Aviation', city: 'Scottsdale, AZ', country: 'United States' },
    { company: 'Al Futtaim Group', industry: 'Conglomerate', city: 'Dubai', country: 'United Arab Emirates' },
    { company: 'Swiss Private Bank', industry: 'Financial Services', city: 'Geneva', country: 'Switzerland' },
    { company: 'Gulfstream Aerospace', industry: 'Aviation', city: 'Savannah, GA', country: 'United States' },
    { company: 'BMW Group', industry: 'Automotive', city: 'Munich', country: 'Germany' },
    { company: 'Temasek Holdings', industry: 'Investment', city: 'Singapore', country: 'Singapore' },
    { company: 'Rogers Communications', industry: 'Telecommunications', city: 'Toronto', country: 'Canada' },
    { company: 'Macquarie Group', industry: 'Financial Services', city: 'Sydney', country: 'Australia' },
    { company: 'Mitsubishi Corporation', industry: 'Conglomerate', city: 'Tokyo', country: 'Japan' },
    { company: 'Berkshire Partners', industry: 'Private Equity', city: 'Boston, MA', country: 'United States' },
    { company: 'LVMH', industry: 'Luxury Goods', city: 'Paris', country: 'France' },
    { company: 'Ambani Group', industry: 'Conglomerate', city: 'Mumbai', country: 'India' },
    { company: 'Samsung C&T', industry: 'Construction', city: 'Seoul', country: 'South Korea' },
    { company: 'Aramco', industry: 'Energy', city: 'Riyadh', country: 'Saudi Arabia' },
    { company: 'Credit Suisse', industry: 'Banking', city: 'Zurich', country: 'Switzerland' },
    { company: 'Blackstone', industry: 'Investment', city: 'New York, NY', country: 'United States' },
    { company: 'KKR & Co', industry: 'Private Equity', city: 'San Francisco, CA', country: 'United States' },
    { company: 'Softbank', industry: 'Technology', city: 'Tokyo', country: 'Japan' },
    { company: 'NetJets', industry: 'Aviation', city: 'Columbus, OH', country: 'United States' },
    { company: 'Carlyle Group', industry: 'Private Equity', city: 'Washington, DC', country: 'United States' },
  ];
  
  const devices = ['Desktop', 'iPad', 'Mobile'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const referrers = ['google.com', 'linkedin.com', 'Direct', 'bloomberg.com', 'twitter.com', 'ainonline.com'];
  const pages = ['/', '/sj30i', '/performance', '/interior', '/ownership', '/contact', '/gallery', '/specs'];
  
  const visitors = [];
  let sessionNum = 8900;
  
  for (let i = 0; i < 100; i++) {
    const companyData = companies[i % companies.length];
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const pagesViewed = Math.floor(Math.random() * 12) + 2;
    const timeMinutes = Math.floor(Math.random() * 20) + 2;
    const timeSeconds = Math.floor(Math.random() * 60);
    
    const journey = [];
    const journeyLength = Math.min(pagesViewed, 6);
    for (let j = 0; j < journeyLength; j++) {
      journey.push({
        page: pages[Math.floor(Math.random() * pages.length)],
        time: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 60)}s`,
        scrollDepth: Math.floor(Math.random() * 40) + 60
      });
    }
    
    const visitorData = {
      id: i + 1,
      sessionId: `SJ-2024-${sessionNum - (i % 1000)}`,
      ...companyData,
      pagesViewed,
      timeOnSite: `${timeMinutes}m ${timeSeconds}s`,
      lastPage: pages[Math.floor(Math.random() * pages.length)],
      firstVisit: Math.random() > 0.6,
      visitCount: Math.floor(Math.random() * 5) + 1,
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      entryPage: pages[Math.floor(Math.random() * pages.length)],
      journey,
      daysAgo,
      lastSeen: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const aiScore = calculateAILeadScore(visitorData);
    visitorData.leadScore = aiScore.score;
    visitorData.scoreData = aiScore;
    
    visitors.push(visitorData);
  }
  
  return visitors.sort((a, b) => b.leadScore - a.leadScore);
};

export default function VisitorProfiles() {
  const [dateRange, setDateRange] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  // Fetch real visitor sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['visitor-sessions'],
    queryFn: () => base44.entities.VisitorSession.list('-session_start', 200),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const allVisitors = useMemo(() => {
    // Use demo data for now
    return generateVisitors();
  }, []);
  
  const filteredVisitors = useMemo(() => {
    return allVisitors.filter(v => {
      const days = parseInt(dateRange);
      const matchesDate = (v.daysAgo || 0) <= days;
      const matchesSearch = !searchQuery || 
        v.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.industry.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || v.scoreData?.tier === tierFilter;
      return matchesDate && matchesSearch && matchesTier;
    });
  }, [allVisitors, dateRange, searchQuery, tierFilter]);

  const stats = useMemo(() => {
    const hot = filteredVisitors.filter(v => v.scoreData?.tier === 'hot').length;
    const warm = filteredVisitors.filter(v => v.scoreData?.tier === 'warm').length;
    const engaged = filteredVisitors.filter(v => v.scoreData?.tier === 'engaged').length;
    const avgScore = filteredVisitors.length > 0 
      ? Math.round(filteredVisitors.reduce((sum, v) => sum + v.leadScore, 0) / filteredVisitors.length)
      : 0;
    return { hot, warm, engaged, avgScore, total: filteredVisitors.length };
  }, [filteredVisitors]);

  const getLeadScoreColor = (tier) => {
    switch (tier) {
      case 'hot': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'warm': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'engaged': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  const getTierLabel = (tier) => {
    switch (tier) {
      case 'hot': return '🔥 Hot Lead';
      case 'warm': return '⚡ Warm';
      case 'engaged': return '📊 Engaged';
      default: return '👀 Early Stage';
    }
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'Desktop': return <Monitor className="w-4 h-4" />;
      case 'iPad': return <Tablet className="w-4 h-4" />;
      case 'Mobile': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getFactorIcon = (iconType) => {
    switch (iconType) {
      case 'industry': return <Building2 className="w-3 h-3" />;
      case 'engagement': return <Eye className="w-3 h-3" />;
      case 'time': return <Clock className="w-3 h-3" />;
      case 'intent': return <Target className="w-3 h-3" />;
      case 'return': return <TrendingUp className="w-3 h-3" />;
      case 'referrer': return <Zap className="w-3 h-3" />;
      case 'device': return <Star className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-violet-500" />
            Visitor Profiles
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            AI-powered lead scoring • Demo Data
          </p>
        </div>
        <Tabs value={dateRange} onValueChange={setDateRange}>
          <TabsList>
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="60">60 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Profiles</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">🔥 Hot Leads</p>
            <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">⚡ Warm Leads</p>
            <p className="text-2xl font-bold text-amber-600">{stats.warm}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">📊 Engaged</p>
            <p className="text-2xl font-bold text-blue-600">{stats.engaged}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
            <p className="text-2xl font-bold text-violet-600">{stats.avgScore}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by company, city, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="hot">🔥 Hot Leads</SelectItem>
            <SelectItem value="warm">⚡ Warm</SelectItem>
            <SelectItem value="engaged">📊 Engaged</SelectItem>
            <SelectItem value="early">👀 Early Stage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visitor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVisitors.map((visitor) => (
          <Card 
            key={visitor.id}
            className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedVisitor(visitor)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-1">{visitor.sessionId}</p>
                  <Badge className={`text-xs border ${getLeadScoreColor(visitor.scoreData?.tier)}`}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {visitor.leadScore} - {getTierLabel(visitor.scoreData?.tier)}
                  </Badge>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white truncate">{visitor.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{visitor.city}, {visitor.country}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {visitor.pagesViewed} pages
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {visitor.timeOnSite}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  {getDeviceIcon(visitor.device)}
                  {visitor.device}
                </span>
                <span>{visitor.daysAgo === 1 ? 'Yesterday' : `${visitor.daysAgo} days ago`}</span>
              </div>
            </CardContent>
          </Card>
          ))}
          </div>

      {/* Visitor Detail Modal */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVisitor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{selectedVisitor.company}</p>
                    <p className="text-sm text-gray-500 font-normal">{selectedVisitor.sessionId}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Lead Score Section */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                      <span className="font-semibold text-violet-800 dark:text-violet-300">AI Lead Score</span>
                    </div>
                    <Badge className={`text-sm border ${getLeadScoreColor(selectedVisitor.scoreData?.tier)}`}>
                      {selectedVisitor.leadScore} - {getTierLabel(selectedVisitor.scoreData?.tier)}
                    </Badge>
                  </div>
                  <p className="text-sm text-violet-700 dark:text-violet-400 mb-3">
                    💡 {selectedVisitor.scoreData?.recommendation}
                  </p>
                  <div className="space-y-2">
                    {selectedVisitor.scoreData?.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded bg-white dark:bg-gray-800 flex items-center justify-center text-violet-600">
                          {getFactorIcon(factor.icon)}
                        </div>
                        <span className="flex-1 text-gray-700 dark:text-gray-300">{factor.factor}</span>
                        <span className="font-semibold text-emerald-600">{factor.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visitor Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      Company Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Company</span>
                        <span className="font-medium">{selectedVisitor.company}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Industry</span>
                        <span className="font-medium">{selectedVisitor.industry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location</span>
                        <span className="font-medium">{selectedVisitor.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Country</span>
                        <span className="font-medium">{selectedVisitor.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      Session Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Device</span>
                        <span className="font-medium flex items-center gap-1">
                          {getDeviceIcon(selectedVisitor.device)}
                          {selectedVisitor.device}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Browser</span>
                        <span className="font-medium">{selectedVisitor.browser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Referrer</span>
                        <span className="font-medium">{selectedVisitor.referrer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Visits</span>
                        <span className="font-medium">{selectedVisitor.visitCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Journey */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    Session Journey
                  </h4>
                  <div className="space-y-2">
                    {selectedVisitor.journey.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-medium text-violet-600">
                          {idx + 1}
                        </div>
                        <div className="flex-1 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{step.page}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              {step.scrollDepth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button className="flex-1 bg-violet-600 hover:bg-violet-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Create Lead
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}