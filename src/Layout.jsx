import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
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
} from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'divider', label: 'CRM' },
  { name: 'Contacts', icon: Users, page: 'Contacts' },
  { name: 'Companies', icon: Building2, page: 'Companies' },
  { name: 'Deals', icon: Target, page: 'Deals' },
  { name: 'Activities', icon: Calendar, page: 'Activities' },
  { name: 'Social Leads', icon: Share2, page: 'SocialLeads' },
  { name: 'Automation', icon: Zap, page: 'Automation' },
  { name: 'divider', label: 'Marketing' },
  { name: 'Campaigns', icon: Megaphone, page: 'Campaigns' },
  { name: 'Email Marketing', icon: Mail, page: 'EmailMarketing' },
  { name: 'Reports', icon: FileBarChart, page: 'Reports' },
  { name: 'divider', label: 'SEO' },
  { name: 'SEO Dashboard', icon: Search, page: 'SEODashboard' },
  { name: 'SEO Tools', icon: Globe, page: 'SEOTools' },
  { name: 'Keywords', icon: Target, page: 'Keywords' },
  { name: 'Backlinks', icon: Link2, page: 'Backlinks' },
  { name: 'SEO Audit', icon: FileSearch, page: 'SEOAudit' },
  { name: 'divider', label: 'Social' },
  { name: 'Social Media', icon: Share2, page: 'SocialMedia' },
  { name: 'Social Listening', icon: Radio, page: 'SocialListening' },
  { name: 'Social Calendar', icon: CalendarDays, page: 'SocialCalendar' },
  { name: 'divider', label: 'Support' },
  { name: 'Help Center', icon: HelpCircle, page: 'HelpCenter' },
];

function SidebarContent({ currentPage, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg" 
            alt="CatchAll" 
            className="h-8 object-contain"
          />
          <div>
            <h1 className="font-bold text-gray-900 text-lg">CatchAll</h1>
            <p className="text-xs text-gray-400">Business Suite</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-1">
          {navigation.map((item, idx) => {
            if (item.name === 'divider') {
              return (
                <div key={idx} className="pt-6 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              );
            }
            
            const isActive = currentPage === item.page;
            
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                {item.name}
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent currentPage={currentPageName} onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg" 
            alt="CatchAll" 
            className="h-6 object-contain"
          />
          <span className="font-semibold text-gray-900">CatchAll</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-violet-100 text-violet-600 text-sm">
                  {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-100 z-30">
        <SidebarContent currentPage={currentPageName} />
        
        {/* User Section */}
        <div className="p-4 border-t border-gray-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-violet-100 text-violet-600 text-sm font-medium">
                    {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
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
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onClose={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}