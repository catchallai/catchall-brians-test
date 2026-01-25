import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import GlobalSearch from '@/components/search/GlobalSearch';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';

import {
                  LayoutDashboard,
                  Rocket,
                  Users,
                    Building2,
                    Target,
                    Calendar,
                    CalendarDays,
                    Search,
                    Link2,
                    FileSearch,
                    Menu,
                    ChevronDown,
                    ChevronRight,
                    LogOut,
                    Settings,
                    Megaphone,
                    FileBarChart,
                    Mail,
                    Zap,
                    Globe,
                    Share2,
                    HelpCircle,
                    Radio,
                    MapPin,
                    Newspaper,
                    FileText,
                    BarChart3,
                    PenTool,
                    Keyboard,
                    Activity,
                    TrendingUp,
                    Smartphone,
                    Plus,
                    UserCircle,
                    AlertTriangle,
                    Package,
                    DollarSign,
                    Sparkles,
                    Award,
                    Heart,
                    FileSignature,
                    Folder,
                    FolderOpen,
                    Briefcase,
                    MessageSquare,
                  } from "lucide-react";
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import KeyboardShortcutsDialog, { useKeyboardShortcuts } from '@/components/ui/KeyboardShortcuts';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeatures, PAGE_FEATURE_MAP } from '@/components/hooks/useFeatures';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { ToastProvider } from '@/components/ui/toast-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: 'Brand Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'favorites', label: 'Favorites' },
  { name: 'divider', label: 'Business Dev', collapsible: true },
  { name: 'Business Dev Dashboard', icon: BarChart3, page: 'BusinessDevDashboard' },
  { name: 'Aerospace Scanner', icon: Rocket, page: 'AerospaceScanner' },
  { name: 'Competitor Analysis', icon: Users, page: 'CompetitorAnalysis' },
  { name: 'Lead Analysis', icon: UserCircle, page: 'VisitorProfiles' },
  { name: 'Legal Documents', icon: FileSignature, page: 'LegalDocuments' },
  { name: 'Listings & Reviews', icon: MapPin, page: 'Listings' },
  { name: 'Media Outreach', icon: Mail, page: 'MediaOutreach' },
  { name: 'Press Monitoring', icon: Newspaper, page: 'PressMonitoring' },
  { name: 'divider', label: 'CRM', collapsible: true },
  { name: 'CRM Dashboard', icon: BarChart3, page: 'CRMDashboard' },
  { name: 'Marketing Hub', icon: TrendingUp, page: 'MarketingHub' },
  { name: 'Email Marketing', icon: Mail, page: 'EmailMarketing' },
  { name: 'Contacts', icon: Users, page: 'Contacts' },
  { name: 'Companies', icon: Building2, page: 'Companies' },
  { name: 'Opportunities', icon: Target, page: 'Opportunities' },
  { name: 'DocuTrace', icon: FileText, page: 'DocuTrace' },
  { name: 'Data Rooms', icon: Folder, page: 'DataRooms' },
  { name: 'Contact Forms', icon: FileText, page: 'ContactForms' },
  { name: 'Automation', icon: Zap, page: 'Automation' },
  { name: 'Pipeline', icon: Target, page: 'Deals' },
  { name: 'Activities', icon: Calendar, page: 'Activities' },
  { name: 'divider', label: 'Sales', collapsible: true },
  { name: 'Sales Dashboard', icon: BarChart3, page: 'SalesDashboard' },
  { name: 'Sales Hub', icon: Target, page: 'SalesHub' },
  { name: 'Lead Enrichment', icon: Users, page: 'LeadEnrichment' },
  { name: 'Sequences', icon: Zap, page: 'SalesSequences' },
  { name: 'Proposals', icon: FileText, page: 'Proposals' },
  { name: 'Meeting Scheduler', icon: Calendar, page: 'MeetingScheduler' },
  { name: 'Sales Quotas', icon: TrendingUp, page: 'SalesQuotas' },
  { name: 'Reservations', icon: Calendar, page: 'Reservations' },
  { name: 'divider', label: 'Customer Success', collapsible: true },
  { name: 'CS Dashboard', icon: Award, page: 'CustomerSuccessDashboard' },
  { name: 'Customer Success', icon: Heart, page: 'CustomerSuccess' },
  { name: 'divider', label: 'SEO', collapsible: true },
  { name: 'SEO Dashboard', icon: BarChart3, page: 'SEODashboardPage' },
  { name: 'SEO Analytics', icon: Search, page: 'SEODashboard' },
  { name: 'SEO Tools', icon: Globe, page: 'SEOTools' },
  { name: 'SEO Audits', icon: FileSearch, page: 'SEOAudit' },
  { name: 'SEO Keywords', icon: Target, page: 'Keywords' },
  { name: 'SEO Backlinks', icon: Link2, page: 'Backlinks' },
  { name: 'SEO Local', icon: MapPin, page: 'LocalSEO' },
  { name: 'divider', label: 'Social', collapsible: true },
  { name: 'Social Dashboard', icon: BarChart3, page: 'SocialDashboard' },
  { name: 'Social Analytics', icon: Share2, page: 'SocialMedia' },
  { name: 'Social Calendar', icon: CalendarDays, page: 'SocialCalendar' },
  { name: 'Landing Pages', icon: Globe, page: 'LandingPageBuilder' },
  { name: 'Social Listening', icon: Radio, page: 'SocialListening' },
  { name: 'Social Leads', icon: UserCircle, page: 'SocialLeads' },
  { name: 'Social Competitors', icon: Users, page: 'CompetitorAnalysis' },
  { name: 'Hashtag Manager', icon: Target, page: 'HashtagManager' },
  { name: 'divider', label: 'Web', collapsible: true },
  { name: 'Web Dashboard', icon: BarChart3, page: 'WebDashboard' },
  { name: 'Web Analytics', icon: Globe, page: 'TrafficAnalytics' },
  { name: 'Web Audit/Reports', icon: FileSearch, page: 'SEOAudit' },
  { name: 'Web Crawler', icon: Globe, page: 'WebCrawler' },
  { name: 'divider', label: 'Communications', collapsible: true },
  { name: 'ICS', icon: MessageSquare, page: 'ICS' },
  { name: 'divider', label: 'Documentation', collapsible: true },
  { name: 'Spaces', icon: FolderOpen, page: 'Spaces' },
  { name: 'divider', label: 'Payments', collapsible: true },
  { name: 'Payments', icon: DollarSign, page: 'Payments' },
  { name: 'divider', label: 'Reporting' },
  { name: 'Reports', icon: FileBarChart, page: 'Reports' },
  { name: 'TakeDown Requestor', icon: AlertTriangle, page: 'TakeDownRequestor' },
  { name: 'divider', label: 'Project Management', collapsible: true },
  { name: 'Projects', icon: Briefcase, page: 'Projects' },
  { name: 'Project Calendar', icon: CalendarDays, page: 'ProjectCalendar' },
  { name: 'divider', label: 'Assets' },
  { name: 'Media Library', icon: FileText, page: 'MediaLibrary' },
  { name: 'Content Studio', icon: PenTool, page: 'ContentStudio' },
  { name: 'Equipment Inventory', icon: Package, page: 'EquipmentInventory' },
  { name: 'divider', label: 'Finance' },
  { name: 'Accounting Dashboard', icon: DollarSign, page: 'AccountingDashboard' },
  { name: 'divider', label: 'AI Tools' },
  { name: 'AI Dashboard', icon: Sparkles, page: 'AIDashboard' },
  { name: 'divider', label: 'Executive' },
  { name: 'Executive Dashboard', icon: Award, page: 'ExecutiveDashboard' },
  { name: 'divider', label: 'Support' },
  { name: 'Help Center', icon: HelpCircle, page: 'HelpCenter' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
  { name: 'Activity Logs', icon: Activity, page: 'ActivityLogs' },
  ];

const SIDEBAR_ICONS = {
              Dashboard: LayoutDashboard,
              ExecutiveDashboard: Award,
              BusinessManagement: Building2,
              BusinessDevDashboard: BarChart3,
              CRMDashboard: BarChart3,
              SalesDashboard: BarChart3,
              SEODashboardPage: BarChart3,
              SocialDashboard: BarChart3,
              WebDashboard: BarChart3,
              AerospaceScanner: Rocket,
              VisitorProfiles: UserCircle,
              LegalDocuments: FileSignature,
              Opportunities: Target,
              LandingPageBuilder: Globe,
  PitchDeckCreator: PenTool,
  PitchDeckAnalyzer: FileSearch,
  TakeDownRequestor: AlertTriangle,
  EquipmentInventory: Package,
  AccountingDashboard: DollarSign,
  AIDashboard: Sparkles,
  Contacts: Users,
  Companies: Building2,
  DocuTrace: FileText,
  DataRooms: Folder,
  Deals: Target,
  Activities: Calendar,
  SalesHub: Target,
  SalesSequences: Zap,
  Proposals: FileText,
  MeetingScheduler: Calendar,
  SalesQuotas: TrendingUp,
  LeadEnrichment: Users,
  Reservations: Calendar,
  SEODashboard: Search,
  SEOTools: Globe,
  Keywords: Target,
  Backlinks: Link2,
  SEOAudit: FileSearch,
  ContentStrategy: FileText,
  TrafficAnalytics: BarChart3,
  SocialMedia: Share2,
  SocialListening: Radio,
  SocialCalendar: CalendarDays,
  CompetitorAnalysis: Users,
  Campaigns: Megaphone,
  EmailMarketing: Mail,
  Reports: FileBarChart,
  MarketingHub: TrendingUp,
  ContentStudio: PenTool,
  LocalSEO: MapPin,
  Projects: Briefcase,
  ProjectCalendar: CalendarDays,
  MediaOutreach: Mail,
  Automation: Zap,
  SocialLeads: UserCircle,
  Listings: MapPin,
  PressMonitoring: Newspaper,
  WebCrawler: Globe,
  HashtagManager: Target,
  Collaboration: Users,
  MediaLibrary: FileText,
  ContactForms: FileText,
  ICS: MessageSquare,
  Spaces: FolderOpen,
  Payments: DollarSign,
  Settings: Settings,
  HelpCenter: HelpCircle,
  ActivityLogs: Activity,
  };

function SidebarContent({ currentPage, onNavigate, isEnabled, user, onAddFavorite, onRemoveFavorite, dragOverFavorites, setDragOverFavorites, isCollapsed }) {
  const [collapsedSections, setCollapsedSections] = React.useState({});

  const toggleSection = (sectionLabel) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel]
    }));
  };

  // Filter navigation based on enabled features
  const filteredNavigation = navigation.filter((item) => {
    if (item.name === 'divider') return true;
    // Always show Dashboard, Settings, Activity Logs, Help Center
    if (['Dashboard', 'Settings', 'ActivityLogs', 'HelpCenter', 'SEOTools'].includes(item.page)) return true;
    // Check if feature is enabled
    const featureKey = PAGE_FEATURE_MAP[item.page];
    if (!featureKey) return true; // If no feature mapping, show it
    return isEnabled(featureKey);
  });

  // Remove consecutive dividers and trailing dividers
  const cleanedNavigation = filteredNavigation.filter((item, idx, arr) => {
    if (item.name !== 'divider' && item.name !== 'favorites') return true;
    if (item.name === 'favorites') return true;
    const nextItem = arr[idx + 1];
    if (!nextItem || nextItem.name === 'divider') return false;
    return true;
  });

  // Get user's favorite links (max 3)
  const favoriteLinks = (user?.favorite_links || []).slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg" 
            alt="CatchAll" 
            className={`h-8 object-contain transition-all ${isCollapsed ? 'mx-auto' : ''}`}
          />
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg">CatchAll</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Business Suite</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {cleanedNavigation.map((item, idx) => {
                            if (item.name === 'divider') {
                              const isSectionCollapsed = collapsedSections[item.label];
                              const isCollapsible = item.collapsible;

                              // Hide dividers when sidebar is collapsed
                              if (isCollapsed) return null;

                              return (
                                <div key={idx} className="pt-6 pb-2">
                                  <button
                                    onClick={() => isCollapsible && toggleSection(item.label)}
                                    className={`w-full px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2 ${
                                      isCollapsible ? 'hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer' : ''
                                    }`}
                                  >
                                    {isCollapsible && (
                                      isSectionCollapsed ? 
                                        <ChevronRight className="w-3 h-3" /> : 
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                    {item.label}
                                  </button>
                                </div>
                              );
                            }

                            // Check if item should be hidden due to collapsed section
                            const sectionIdx = cleanedNavigation.slice(0, idx).reverse().findIndex(i => i.name === 'divider');
                            if (sectionIdx !== -1) {
                              const sectionItem = cleanedNavigation[idx - sectionIdx - 1];
                              if (sectionItem.collapsible && collapsedSections[sectionItem.label]) {
                                return null;
                              }
                            }

                            if (item.name === 'favorites') {
                                                // Hide favorites section when sidebar is collapsed
                                                if (isCollapsed) return null;
                                                
                                                return (
                                                  <div 
                                                    key={idx} 
                                                    className={`space-y-1 pl-4 border-l-2 ml-3 mt-1 transition-all duration-200 ${
                                                      dragOverFavorites 
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 rounded-r-lg' 
                                                        : 'border-violet-200 dark:border-violet-800'
                                                    }`}
                                                    onDragOver={(e) => {
                                                      if (favoriteLinks.length < 3) {
                                                        e.preventDefault();
                                                        setDragOverFavorites(true);
                                                      }
                                                    }}
                                                    onDragLeave={() => setDragOverFavorites(false)}
                                                    onDrop={(e) => {
                                                      e.preventDefault();
                                                      setDragOverFavorites(false);
                                                      const data = e.dataTransfer.getData('text/plain');
                                                      if (data) {
                                                        try {
                                                          const navItem = JSON.parse(data);
                                                          onAddFavorite(navItem);
                                                        } catch (err) {}
                                                      }
                                                    }}
                                                  >
                                                    {favoriteLinks.map((fav, fidx) => {
                                                      const FavIcon = SIDEBAR_ICONS[fav.page] || LayoutDashboard;
                                                      const isActive = currentPage === fav.page;
                                                      return (
                                                        <div
                                                          key={fidx}
                                                          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                            isActive
                                                              ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                                                          }`}
                                                        >
                                                          <Link
                                                            to={createPageUrl(fav.page)}
                                                            onClick={onNavigate}
                                                            className="flex items-center gap-2 flex-1"
                                                          >
                                                            <FavIcon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-500' : 'text-gray-400'}`} />
                                                            {fav.label}
                                                          </Link>
                                                          <button
                                                            onClick={(e) => {
                                                              e.preventDefault();
                                                              e.stopPropagation();
                                                              onRemoveFavorite(fav.page);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                                          >
                                                            <svg className="w-3 h-3 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                          </button>
                                                        </div>
                                                      );
                                                    })}
                                                    {favoriteLinks.length < 3 && (
                                                      <div
                                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                          dragOverFavorites 
                                                            ? 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-800/30 border-2 border-dashed border-violet-400' 
                                                            : 'text-gray-400 dark:text-gray-500'
                                                        }`}
                                                      >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        {dragOverFavorites ? 'Drop here' : 'Drag nav item here'}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              }

                            const isActive = currentPage === item.page;

                            return (
                              <Link
                                key={item.name}
                                to={createPageUrl(item.page)}
                                onClick={onNavigate}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({ page: item.page, label: item.name }));
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                title={isCollapsed ? item.name : ''}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                  isActive
                                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                              >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                {!isCollapsed && item.name}
                              </Link>
                            );
                          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dragOverFavorites, setDragOverFavorites] = useState(false);
  const queryClient = useQueryClient();
  const { isEnabled } = useFeatures();

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onHelp: () => setShowShortcuts(true),
    onEscape: () => setShowShortcuts(false),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: onboardingStatus } = useQuery({
    queryKey: ['user-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const records = await base44.entities.UserOnboarding.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user?.id,
  });

  // Show onboarding for new users
  React.useEffect(() => {
    if (user?.id && onboardingStatus === null) {
      // New user - create onboarding record and show modal
      base44.entities.UserOnboarding.create({
        user_id: user.id,
        started_at: new Date().toISOString()
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['user-onboarding'] });
        setShowOnboarding(true);
      });
    } else if (onboardingStatus && !onboardingStatus.is_complete && !onboardingStatus.skipped) {
      setShowOnboarding(true);
    }
  }, [user?.id, onboardingStatus]);

  const handleOnboardingComplete = async () => {
    if (onboardingStatus) {
      await base44.entities.UserOnboarding.update(onboardingStatus.id, {
        is_complete: true,
        completed_at: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['user-onboarding'] });
    }
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = async () => {
    if (onboardingStatus) {
      await base44.entities.UserOnboarding.update(onboardingStatus.id, {
        skipped: true
      });
      queryClient.invalidateQueries({ queryKey: ['user-onboarding'] });
    }
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleAddFavorite = useCallback(async (navItem) => {
    if (!user) return;
    const currentFavorites = user.favorite_links || [];
    if (currentFavorites.length >= 3) return;
    if (currentFavorites.some(f => f.page === navItem.page)) return;
    
    const newFavorites = [...currentFavorites, { page: navItem.page, label: navItem.label }];
    await base44.auth.updateMe({ favorite_links: newFavorites });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
  }, [user, queryClient]);

  const handleRemoveFavorite = useCallback(async (page) => {
    if (!user) return;
    const currentFavorites = user.favorite_links || [];
    const newFavorites = currentFavorites.filter(f => f.page !== page);
    await base44.auth.updateMe({ favorite_links: newFavorites });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
  }, [user, queryClient]);

  return (
    <ThemeProvider>
    <ToastProvider>
    {/* Google Analytics */}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-15KW7LZW87"></script>
    <script dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-15KW7LZW87');
      `
    }} />
    <div className="min-h-screen gradient-bg transition-colors duration-300">
      {/* Mobile Header */}
      <div className="lg:hidden top-0 left-0 right-0 h-16 glass-topbar z-40 flex items-center gap-3 px-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 dark:bg-gray-900 dark:border-gray-800">
                            <SidebarContent currentPage={currentPageName} onNavigate={() => setSidebarOpen(false)} isEnabled={isEnabled} user={user} onAddFavorite={handleAddFavorite} onRemoveFavorite={handleRemoveFavorite} dragOverFavorites={dragOverFavorites} setDragOverFavorites={setDragOverFavorites} isCollapsed={false} />
                          </SheetContent>
        </Sheet>

        <div className="flex-1 min-w-0">
          <GlobalSearch />
        </div>

        <NotificationBell />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm">
                  {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('UserProfile')} className="cursor-pointer">
                <UserCircle className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Top Bar with Search */}
      <div className={`hidden lg:flex top-0 right-0 h-14 glass-topbar z-30 items-center justify-end px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}>
        <div className="flex items-center gap-4 ml-auto">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                    {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.full_name || 'User'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('UserProfile')} className="cursor-pointer">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Sidebar */}
              <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col glass-sidebar z-30 transition-all duration-300 ${
                sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
              }`}>
                                    <SidebarContent currentPage={currentPageName} isEnabled={isEnabled} user={user} onAddFavorite={handleAddFavorite} onRemoveFavorite={handleRemoveFavorite} dragOverFavorites={dragOverFavorites} setDragOverFavorites={setDragOverFavorites} isCollapsed={sidebarCollapsed} />

                                    {/* Toggle Button */}
                                    <button
                                    onClick={toggleSidebar}
                                    className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-50"
                                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                    >
                                    <ChevronRight className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
                                    </button>
        
        {/* User Section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                    {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
              <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
                <div className="min-h-screen gradient-bg">
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </div>
              </main>

              {/* Keyboard Shortcuts Dialog */}
              <KeyboardShortcutsDialog 
                open={showShortcuts} 
                onClose={() => setShowShortcuts(false)} 
              />

      {/* Onboarding Modal */}
              <OnboardingModal
                open={showOnboarding}
                onClose={handleOnboardingSkip}
                onComplete={handleOnboardingComplete}
              />
            </div>
          </ToastProvider>
          </ThemeProvider>
          );
        }