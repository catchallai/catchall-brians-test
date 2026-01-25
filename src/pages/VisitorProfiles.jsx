import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  UserCircle, MapPin, Clock, Eye, MousePointer, Building2, Sparkles, 
  TrendingUp, Target, Zap, Star, Globe, Monitor, Smartphone, Tablet,
  Search, Filter, ChevronRight, ArrowUpRight, ExternalLink, Mail,
  Calendar, Activity, Info, Grid3x3, List, Bell, Settings, Layers, BarChart3
} from "lucide-react";
import NotificationRulesModal from '../components/visitor/NotificationRulesModal';
import SegmentManager from '../components/visitor/SegmentManager';
import SegmentAnalysis from '../components/visitor/SegmentAnalysis';

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

// Seeded random number generator for consistent data
const seededRandom = (seed) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Generate visitors data with consistent results
const generateVisitors = () => {
  const companies = [
    { company: 'Desert Aviation Holdings', industry: 'Private Aviation', city: 'Scottsdale, AZ', country: 'United States', logo: 'https://ui-avatars.com/api/?name=Desert+Aviation&background=0D8ABC&color=fff&size=128' },
    { company: 'Al Futtaim Group', industry: 'Conglomerate', city: 'Dubai', country: 'United Arab Emirates', logo: 'https://ui-avatars.com/api/?name=Al+Futtaim&background=8B5CF6&color=fff&size=128' },
    { company: 'Swiss Private Bank', industry: 'Financial Services', city: 'Geneva', country: 'Switzerland', logo: 'https://ui-avatars.com/api/?name=Swiss+Bank&background=DC2626&color=fff&size=128' },
    { company: 'Gulfstream Aerospace', industry: 'Aviation', city: 'Savannah, GA', country: 'United States', logo: 'https://ui-avatars.com/api/?name=Gulfstream&background=2563EB&color=fff&size=128' },
    { company: 'BMW Group', industry: 'Automotive', city: 'Munich', country: 'Germany', logo: 'https://ui-avatars.com/api/?name=BMW&background=000000&color=fff&size=128' },
    { company: 'Temasek Holdings', industry: 'Investment', city: 'Singapore', country: 'Singapore', logo: 'https://ui-avatars.com/api/?name=Temasek&background=059669&color=fff&size=128' },
    { company: 'Rogers Communications', industry: 'Telecommunications', city: 'Toronto', country: 'Canada', logo: 'https://ui-avatars.com/api/?name=Rogers&background=DC2626&color=fff&size=128' },
    { company: 'Macquarie Group', industry: 'Financial Services', city: 'Sydney', country: 'Australia', logo: 'https://ui-avatars.com/api/?name=Macquarie&background=047857&color=fff&size=128' },
    { company: 'Mitsubishi Corporation', industry: 'Conglomerate', city: 'Tokyo', country: 'Japan', logo: 'https://ui-avatars.com/api/?name=Mitsubishi&background=DC2626&color=fff&size=128' },
    { company: 'Berkshire Partners', industry: 'Private Equity', city: 'Boston, MA', country: 'United States', logo: 'https://ui-avatars.com/api/?name=Berkshire&background=1E40AF&color=fff&size=128' },
    { company: 'LVMH', industry: 'Luxury Goods', city: 'Paris', country: 'France', logo: 'https://ui-avatars.com/api/?name=LVMH&background=A855F7&color=fff&size=128' },
    { company: 'Ambani Group', industry: 'Conglomerate', city: 'Mumbai', country: 'India', logo: 'https://ui-avatars.com/api/?name=Ambani&background=EA580C&color=fff&size=128' },
    { company: 'Samsung C&T', industry: 'Construction', city: 'Seoul', country: 'South Korea', logo: 'https://ui-avatars.com/api/?name=Samsung&background=1E3A8A&color=fff&size=128' },
    { company: 'Aramco', industry: 'Energy', city: 'Riyadh', country: 'Saudi Arabia', logo: 'https://ui-avatars.com/api/?name=Aramco&background=059669&color=fff&size=128' },
    { company: 'Credit Suisse', industry: 'Banking', city: 'Zurich', country: 'Switzerland', logo: 'https://ui-avatars.com/api/?name=Credit+Suisse&background=1E3A8A&color=fff&size=128' },
    { company: 'Blackstone', industry: 'Investment', city: 'New York, NY', country: 'United States', logo: 'https://ui-avatars.com/api/?name=Blackstone&background=000000&color=fff&size=128' },
    { company: 'KKR & Co', industry: 'Private Equity', city: 'San Francisco, CA', country: 'United States', logo: 'https://ui-avatars.com/api/?name=KKR&background=1E40AF&color=fff&size=128' },
    { company: 'Softbank', industry: 'Technology', city: 'Tokyo', country: 'Japan', logo: 'https://ui-avatars.com/api/?name=Softbank&background=FBBF24&color=000&size=128' },
    { company: 'NetJets', industry: 'Aviation', city: 'Columbus, OH', country: 'United States', logo: 'https://ui-avatars.com/api/?name=NetJets&background=DC2626&color=fff&size=128' },
    { company: 'Carlyle Group', industry: 'Private Equity', city: 'Washington, DC', country: 'United States', logo: 'https://ui-avatars.com/api/?name=Carlyle&background=7C3AED&color=fff&size=128' },
  ];
  
  const devices = ['Desktop', 'iPad', 'Mobile'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const referrers = ['google.com', 'linkedin.com', 'Direct', 'bloomberg.com', 'twitter.com', 'ainonline.com'];
  const pages = ['/', '/sj30i', '/performance', '/interior', '/ownership', '/contact', '/gallery', '/specs'];
  
  const visitors = [];
  let sessionNum = 8900;
  let seed = 12345; // Fixed seed for consistent results
  
  for (let i = 0; i < 100; i++) {
    const companyData = companies[i % companies.length];
    const daysAgo = Math.floor(seededRandom(seed++) * 90) + 1;
    const pagesViewed = Math.floor(seededRandom(seed++) * 12) + 2;
    const timeMinutes = Math.floor(seededRandom(seed++) * 20) + 2;
    const timeSeconds = Math.floor(seededRandom(seed++) * 60);
    
    const journey = [];
    const journeyLength = Math.min(pagesViewed, 6);
    for (let j = 0; j < journeyLength; j++) {
      journey.push({
        page: pages[Math.floor(seededRandom(seed++) * pages.length)],
        time: `${Math.floor(seededRandom(seed++) * 5) + 1}m ${Math.floor(seededRandom(seed++) * 60)}s`,
        scrollDepth: Math.floor(seededRandom(seed++) * 40) + 60
      });
    }
    
    const visitorData = {
      id: i + 1,
      sessionId: `SJ-2024-${sessionNum - (i % 1000)}`,
      ...companyData,
      pagesViewed,
      timeOnSite: `${timeMinutes}m ${timeSeconds}s`,
      lastPage: pages[Math.floor(seededRandom(seed++) * pages.length)],
      firstVisit: seededRandom(seed++) > 0.6,
      visitCount: Math.floor(seededRandom(seed++) * 5) + 1,
      device: devices[Math.floor(seededRandom(seed++) * devices.length)],
      browser: browsers[Math.floor(seededRandom(seed++) * browsers.length)],
      referrer: referrers[Math.floor(seededRandom(seed++) * referrers.length)],
      entryPage: pages[Math.floor(seededRandom(seed++) * pages.length)],
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
  const [sortBy, setSortBy] = useState('score');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showNotificationRules, setShowNotificationRules] = useState(false);
  const [showSegments, setShowSegments] = useState(false);
  const [showSegmentAnalysis, setShowSegmentAnalysis] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);
  const [segmentFilters, setSegmentFilters] = useState(null);
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [showScheduleFollowUp, setShowScheduleFollowUp] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [followUpDate, setFollowUpDate] = useState('');

  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });
  
  // Fetch real visitor sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['visitor-sessions'],
    queryFn: () => base44.entities.VisitorSession.list('-session_start', 200),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notification rules
  const { data: notificationRules = [] } = useQuery({
    queryKey: ['visitor-notification-rules'],
    queryFn: () => base44.entities.VisitorNotificationRule.list('-created_date', 50),
  });

  const allVisitors = useMemo(() => {
    // Use demo data for now
    return generateVisitors();
  }, []);

  // Check visitors against notification rules and create notifications
  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VisitorNotificationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-notification-rules'] });
    },
  });

  // Fetch notes for selected visitor
  const { data: visitorNotes = [] } = useQuery({
    queryKey: ['visitor-notes', selectedVisitor?.sessionId],
    queryFn: () => selectedVisitor ? base44.entities.VisitorNote.filter({ 
      visitor_session_id: selectedVisitor.sessionId 
    }) : [],
    enabled: !!selectedVisitor
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowCreateContact(false);
      alert('Lead created successfully!');
    }
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.VisitorNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitor-notes'] });
      setNewNote('');
      setNoteType('general');
    }
  });

  // Handle create lead
  const handleCreateLead = () => {
    if (!selectedVisitor) return;
    
    createContactMutation.mutate({
      company_name: selectedVisitor.company,
      first_name: '',
      last_name: '',
      email: '',
      status: 'lead',
      source: 'website',
      notes: `Lead Score: ${selectedVisitor.leadScore}\nIndustry: ${selectedVisitor.industry}\nPages Viewed: ${selectedVisitor.pagesViewed}\nTime on Site: ${selectedVisitor.timeOnSite}\nDevice: ${selectedVisitor.device}\nReferrer: ${selectedVisitor.referrer}`,
      city: selectedVisitor.city,
      country: selectedVisitor.country
    });
  };

  // Handle schedule follow-up
  const handleScheduleFollowUp = () => {
    if (!selectedVisitor || !followUpDate) return;

    createNoteMutation.mutate({
      visitor_session_id: selectedVisitor.sessionId,
      visitor_company: selectedVisitor.company,
      note: `Follow-up scheduled`,
      note_type: 'follow_up',
      author_name: user?.full_name || user?.email || 'Team Member',
      author_email: user?.email || '',
      follow_up_date: new Date(followUpDate).toISOString()
    });

    setShowScheduleFollowUp(false);
    setFollowUpDate('');
    alert('Follow-up scheduled successfully!');
  };

  // Handle add note
  const handleAddNote = () => {
    if (!selectedVisitor || !newNote.trim()) return;

    createNoteMutation.mutate({
      visitor_session_id: selectedVisitor.sessionId,
      visitor_company: selectedVisitor.company,
      note: newNote,
      note_type: noteType,
      author_name: user?.full_name || user?.email || 'Team Member',
      author_email: user?.email || ''
    });
  };

  // Check for notification triggers
  React.useEffect(() => {
    if (!allVisitors.length || !notificationRules.length) return;

    const activeRules = notificationRules.filter(r => r.is_active);
    
    allVisitors.forEach(visitor => {
      activeRules.forEach(rule => {
        let shouldTrigger = false;
        let message = '';

        switch (rule.trigger_type) {
          case 'hot_lead_detected':
            if (visitor.scoreData?.tier === 'hot') {
              shouldTrigger = true;
              message = `🔥 Hot lead detected: ${visitor.company} (Score: ${visitor.leadScore})`;
            }
            break;

          case 'score_threshold':
            if (rule.conditions?.min_score && visitor.leadScore >= rule.conditions.min_score) {
              shouldTrigger = true;
              message = `🎯 ${visitor.company} reached score threshold of ${rule.conditions.min_score} (Current: ${visitor.leadScore})`;
            }
            break;

          case 'high_engagement':
            const meetsPages = !rule.conditions?.min_pages || visitor.pagesViewed >= rule.conditions.min_pages;
            const timeMinutes = parseInt(visitor.timeOnSite.split('m')[0]);
            const meetsTime = !rule.conditions?.min_time_minutes || timeMinutes >= rule.conditions.min_time_minutes;
            if (meetsPages && meetsTime) {
              shouldTrigger = true;
              message = `👁️ High engagement from ${visitor.company}: ${visitor.pagesViewed} pages, ${visitor.timeOnSite}`;
            }
            break;

          case 'return_visitor':
            if (visitor.visitCount > 1) {
              shouldTrigger = true;
              message = `🔄 Return visitor: ${visitor.company} (Visit #${visitor.visitCount})`;
            }
            break;
        }

        if (shouldTrigger) {
          // Check if we already notified recently (within last hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const recentlyTriggered = rule.last_triggered && rule.last_triggered > oneHourAgo;
          
          if (!recentlyTriggered) {
            createNotificationMutation.mutate({
              title: rule.name,
              message,
              type: 'visitor_alert',
              link: '/VisitorProfiles',
              read: false
            });

            updateRuleMutation.mutate({
              id: rule.id,
              data: {
                last_triggered: new Date().toISOString(),
                trigger_count: (rule.trigger_count || 0) + 1
              }
            });
          }
        }
      });
    });
  }, [allVisitors, notificationRules]);
  
  const filteredVisitors = useMemo(() => {
    let filtered = allVisitors.filter(v => {
      const days = parseInt(dateRange);
      const matchesDate = (v.daysAgo || 0) <= days;
      const matchesSearch = !searchQuery || 
        v.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.industry.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || v.scoreData?.tier === tierFilter;
      
      // Apply segment filters if active
      if (segmentFilters) {
        if (segmentFilters.industries?.length && !segmentFilters.industries.includes(v.industry)) return false;
        if (segmentFilters.tiers?.length && !segmentFilters.tiers.includes(v.scoreData?.tier)) return false;
        if (segmentFilters.countries?.length && !segmentFilters.countries.includes(v.country)) return false;
        if (segmentFilters.devices?.length && !segmentFilters.devices.includes(v.device)) return false;
        if (segmentFilters.min_pages && v.pagesViewed < segmentFilters.min_pages) return false;
        if (segmentFilters.min_score && v.leadScore < segmentFilters.min_score) return false;
        if (segmentFilters.min_time_minutes) {
          const timeMinutes = parseInt(v.timeOnSite.split('m')[0]);
          if (timeMinutes < segmentFilters.min_time_minutes) return false;
        }
        if (segmentFilters.is_return_visitor && v.visitCount <= 1) return false;
        if (segmentFilters.days_ago_max && v.daysAgo > segmentFilters.days_ago_max) return false;
      }
      
      return matchesDate && matchesSearch && matchesTier;
    });

    // Apply sorting
    if (sortBy === 'lastseen') {
      filtered.sort((a, b) => a.daysAgo - b.daysAgo);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.company.localeCompare(b.company));
    } else {
      // Default: sort by score (highest first)
      filtered.sort((a, b) => b.leadScore - a.leadScore);
    }

    return filtered;
  }, [allVisitors, dateRange, searchQuery, tierFilter, sortBy, segmentFilters]);

  const handleApplySegment = (filters) => {
    setSegmentFilters(filters);
  };

  const handleClearSegment = () => {
    setSegmentFilters(null);
    setActiveSegment(null);
  };

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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowSegments(true)}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            Segments
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowNotificationRules(true)}
            className="gap-2"
          >
            <Bell className="w-4 h-4" />
            Rules
            {notificationRules.filter(r => r.is_active).length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white">
                {notificationRules.filter(r => r.is_active).length}
              </Badge>
            )}
          </Button>
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList>
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="60">60 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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

      {/* Active Segment Banner */}
      {segmentFilters && (
        <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" />
                <span className="font-medium text-violet-900 dark:text-violet-200">
                  Segment Active: Filtering {filteredVisitors.length} visitors
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSegmentAnalysis(true)}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analyze
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearSegment}>
                  Clear Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Lead Score</SelectItem>
            <SelectItem value="lastseen">Last Seen</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="alphabetical">A-Z</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Visitor Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
                    <img src={visitor.logo} alt={visitor.company} className="w-6 h-6 rounded object-cover" />
                    <span className="font-medium text-gray-900 dark:text-white truncate">{visitor.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{visitor.city}, {visitor.country}</span>
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
      ) : (
        <div className="space-y-2">
          {filteredVisitors.map((visitor) => (
            <Card 
              key={visitor.id}
              className="bg-white dark:bg-gray-800 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedVisitor(visitor)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Badge className={`text-xs border ${getLeadScoreColor(visitor.scoreData?.tier)} whitespace-nowrap`}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {visitor.leadScore}
                  </Badge>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <img src={visitor.logo} alt={visitor.company} className="w-6 h-6 rounded object-cover shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white truncate">{visitor.company}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{visitor.city}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {visitor.pagesViewed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {visitor.timeOnSite}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        {getDeviceIcon(visitor.device)}
                        {visitor.device}
                      </span>
                      <span className="whitespace-nowrap">{visitor.daysAgo === 1 ? 'Yesterday' : `${visitor.daysAgo}d ago`}</span>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Segment Manager */}
      <SegmentManager
        open={showSegments}
        onClose={() => setShowSegments(false)}
        onApplySegment={handleApplySegment}
        allVisitors={allVisitors}
      />

      {/* Segment Analysis */}
      <SegmentAnalysis
        open={showSegmentAnalysis}
        onClose={() => setShowSegmentAnalysis(false)}
        segment={{ name: 'Active Segment', color: '#8B5CF6' }}
        visitors={filteredVisitors}
      />

      {/* Notification Rules Modal */}
      <NotificationRulesModal
        open={showNotificationRules}
        onClose={() => setShowNotificationRules(false)}
      />

      {/* Visitor Detail Modal */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVisitor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <img 
                    src={selectedVisitor.logo} 
                    alt={selectedVisitor.company} 
                    className="w-12 h-12 rounded-lg object-cover shadow-sm"
                  />
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

                {/* Team Notes Section */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Team Notes & Activity
                  </h4>
                  
                  {/* Add Note Form */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="space-y-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Note</SelectItem>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note about this lead..."
                        className="text-sm"
                        rows={2}
                      />
                      <Button 
                        onClick={handleAddNote}
                        size="sm"
                        disabled={!newNote.trim()}
                        className="w-full"
                      >
                        Add Note
                      </Button>
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {visitorNotes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No notes yet. Add the first note above.</p>
                    ) : (
                      visitorNotes.map((note) => (
                        <div key={note.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {note.note_type}
                              </Badge>
                              <span className="text-xs text-gray-500">{note.author_name}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(note.created_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{note.note}</p>
                          {note.follow_up_date && (
                            <div className="mt-2 text-xs text-violet-600 dark:text-violet-400">
                              📅 Follow-up: {new Date(note.follow_up_date).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    onClick={handleCreateLead}
                    disabled={createContactMutation.isPending}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {createContactMutation.isPending ? 'Creating...' : 'Create Lead'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowScheduleFollowUp(true)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={showScheduleFollowUp} onOpenChange={setShowScheduleFollowUp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Follow-up Date & Time</Label>
              <Input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <p className="text-sm text-gray-500">
              This will create a reminder note for {selectedVisitor?.company}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleFollowUp(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleFollowUp}
              disabled={!followUpDate}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}