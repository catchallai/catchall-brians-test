import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigationGuard } from '@/lib/NavigationGuardContext';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import GlobalSearch from '@/components/search/GlobalSearch';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import NotificationBell from '@/components/notifications/NotificationBell';
import SessionReplayTracker from '@/components/analytics/SessionReplayTracker';
import WhitelabelHeader from '@/components/whitelabel/WhitelabelHeader';

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
  Activity,
  TrendingUp,
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
  Key,
  ShieldCheck,
  Tags,
  ChartBarStacked,
  BookOpen,
  GraduationCap,
  UserCheck,
  Scale,
  Network,
} from 'lucide-react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import KeyboardShortcutsDialog, { useKeyboardShortcuts } from '@/components/ui/KeyboardShortcuts';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFeatures, PAGE_FEATURE_MAP } from '@/components/hooks/useFeatures';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import ChatBubble from '@/components/chat/ChatBubble';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Create a client
const queryClient = new QueryClient();

const formatSocialMediaRole = (role) => {
  return role.replace(/_/g, ' ');
};

function SocialMediaRoleDropdownSection({ user }) {
  const role = user?.social_media_role || user?.role;

  if (!role) {
    return null;
  }

  return (
    <>
      <DropdownMenuLabel>
        <Badge variant="outline" className="text-xs">
          {formatSocialMediaRole(role)}
        </Badge>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
    </>
  );
}

const navigation = [
  { name: 'Brand Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'favorites', label: 'Favorites' },
  { name: 'divider', label: 'Business Dev', collapsible: true },
  { name: 'Business Dev Dashboard', icon: BarChart3, page: 'BusinessDevDashboard' },
  { name: 'Aerospace Scanner', icon: Rocket, page: 'AerospaceScanner' },
  { name: 'Competitor Analysis', icon: Users, page: 'CompetitorAnalysis' },
  { name: 'Lead Analysis', icon: UserCircle, page: 'VisitorProfiles' },
  { name: 'Slide Deck Management', icon: PenTool, page: 'SlideDeckManagement' },
  { name: 'Brand Guidelines', icon: Briefcase, page: 'BrandGuidelineManagement' },
  { name: 'Data Rooms', icon: Folder, page: 'DataRooms' },
  { name: 'DocuTrace', icon: FileText, page: 'DocuTrace' },
  { name: 'Listings & Reviews', icon: MapPin, page: 'Listings' },
  { name: 'divider', label: 'CRM', collapsible: true },
  { name: 'CRM Dashboard', icon: BarChart3, page: 'CRMDashboard' },
  { name: 'Marketing Dashboard', icon: BarChart3, page: 'MarketingDashboard' },
  { name: 'Marketing Hub', icon: TrendingUp, page: 'MarketingHub' },
  { name: 'Email Marketing', icon: Mail, page: 'EmailMarketing' },
  { name: 'Contacts', icon: Users, page: 'Contacts' },
  { name: 'Opportunities', icon: Target, page: 'Opportunities' },
  { name: 'Automation', icon: Zap, page: 'Automation' },
  { name: 'Pipeline', icon: Target, page: 'Deals' },
  { name: 'Activities', icon: Calendar, page: 'Activities' },
  { name: 'Workflows', icon: Zap, page: 'WorkflowBuilder' },
  { name: 'divider', label: 'Sales', collapsible: true },
  { name: 'Sales Dashboard', icon: BarChart3, page: 'SalesDashboard' },
  { name: 'Sales Inbox', icon: Mail, page: 'SalesInbox' },
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
  { name: 'Customer Feedback', icon: MessageSquare, page: 'FeedbackManagement' },
  { name: 'divider', label: 'HRIS', collapsible: true },
  { name: 'HRIS Dashboard', icon: LayoutDashboard, page: 'HRISDashboard' },
  { name: 'Employees', icon: Users, page: 'HRISEmployees' },
  { name: 'Org Chart', icon: Network, page: 'HRISOrgChart' },
  { name: 'Departments', icon: Building2, page: 'HRISDepartments' },
  { name: 'Team Calendar', icon: CalendarDays, page: 'HRISTeamCalendar' },
  { name: 'HR Analytics', icon: BarChart3, page: 'HRISAnalytics' },
  { name: 'HR AI Assistant', icon: Sparkles, page: 'HRISAIAssistant' },
  { name: 'divider', label: 'People Ops', collapsible: true },
  { name: 'Onboarding', icon: UserCheck, page: 'HRISOnboarding' },
  { name: 'Offboarding', icon: LogOut, page: 'HRISOffboarding' },
  { name: 'Time Off', icon: Calendar, page: 'HRISTimeOff' },
  { name: 'Payroll', icon: DollarSign, page: 'HRISPayroll' },
  { name: 'Benefits', icon: Heart, page: 'HRISBenefits' },
  { name: 'Contracts', icon: FileSignature, page: 'HRISContracts' },
  { name: 'HR Documents', icon: FileText, page: 'HRISDocuments' },
  { name: 'Email Templates', icon: Mail, page: 'HRISEmailTemplates' },
  { name: 'divider', label: 'Culture', collapsible: true },
  { name: 'Announcements', icon: Megaphone, page: 'HRISAnnouncements' },
  { name: 'Recognition', icon: Award, page: 'HRISRecognition' },
  { name: 'divider', label: 'Talent', collapsible: true },
  { name: 'Hiring', icon: Briefcase, page: 'HRISHiring' },
  { name: 'Performance', icon: Target, page: 'HRISPerformance' },
  { name: 'Training', icon: BookOpen, page: 'TalentTraining' },
  { name: 'Career Paths', icon: TrendingUp, page: 'TalentCareerPaths' },
  { name: 'Mentorships', icon: Users, page: 'TalentMentorships' },
  { name: 'Internships', icon: GraduationCap, page: 'TalentInternships' },
  { name: 'Skills', icon: Zap, page: 'TalentSkills' },
  { name: 'Surveys', icon: BarChart3, page: 'TalentSurveys' },
  { name: 'divider', label: 'Legal', collapsible: true },
  { name: 'Legal Dashboard', icon: Scale, page: 'LegalDashboard' },
  { name: 'Matters', icon: Briefcase, page: 'LegalMatters' },
  { name: 'Legal Documents', icon: FileSignature, page: 'LegalDocuments' },
  { name: 'Litigation', icon: Scale, page: 'LegalLitigation' },
  { name: 'Obligations', icon: AlertTriangle, page: 'LegalObligations' },
  { name: 'Intellectual Property', icon: ShieldCheck, page: 'LegalIP' },
  { name: 'Counsel', icon: Users, page: 'LegalCounsel' },
  { name: 'Legal Entities', icon: Building2, page: 'LegalEntities' },
  { name: 'Media Outreach', icon: Mail, page: 'MediaOutreach' },
  { name: 'Press Monitoring', icon: Newspaper, page: 'PressMonitoring' },
  { name: 'divider', label: 'Compliance', collapsible: true },
  { name: 'Compliance Dashboard', icon: ShieldCheck, page: 'ComplianceDashboard' },
  { name: 'Executive Summary', icon: Activity, page: 'ComplianceExecutiveSummary' },
  { name: 'Policies', icon: FileText, page: 'CompliancePolicies' },
  { name: 'Compliance Training', icon: GraduationCap, page: 'ComplianceTraining' },
  { name: 'Incidents', icon: AlertTriangle, page: 'ComplianceIncidents' },
  { name: 'Audits', icon: Search, page: 'ComplianceAudits' },
  { name: 'Risk Register', icon: TrendingUp, page: 'ComplianceRisk' },
  { name: 'Export Control', icon: ShieldCheck, page: 'ExportControl' },
  { name: 'divider', label: 'Finance', collapsible: true },
  { name: 'Finance Dashboard', icon: LayoutDashboard, page: 'FinanceDashboard' },
  { name: 'P&L Statement', icon: TrendingUp, page: 'FinancePL' },
  { name: 'Budgets', icon: BarChart3, page: 'FinanceBudgets' },
  { name: 'Transactions', icon: DollarSign, page: 'FinanceTransactions' },
  { name: 'Payroll Costs', icon: Users, page: 'FinancePayroll' },
  { name: 'Forecasts', icon: Target, page: 'FinanceForecast' },
  { name: 'Vendor Space', icon: Building2, page: 'VendorSpace' },
  { name: 'Equity', icon: TrendingUp, page: 'Equity' },
  { name: 'Accounting Legacy', icon: DollarSign, page: 'AccountingDashboard' },
  { name: 'divider', label: 'SEO', collapsible: true },
  { name: 'SEO Dashboard', icon: BarChart3, page: 'SEODashboardPage' },
  { name: 'SEO Analytics', icon: Search, page: 'SEODashboard' },
  { name: 'SEO Tools', icon: Globe, page: 'SEOTools' },
  { name: 'SEO Audits', icon: FileSearch, page: 'SEOAudit' },
  { name: 'SEO Keywords', icon: Target, page: 'Keywords' },
  { name: 'SEO Backlinks', icon: Link2, page: 'Backlinks' },
  { name: 'SEO Opportunities', icon: Target, page: 'SEOOpportunities' },
  { name: 'SEO Local', icon: MapPin, page: 'LocalSEO' },
  { name: 'divider', label: 'Web', collapsible: true },
  { name: 'Web Dashboard', icon: BarChart3, page: 'WebDashboard' },
  { name: 'Web Analytics', icon: Globe, page: 'TrafficAnalytics' },
  { name: 'Advanced Analytics', icon: Activity, page: 'WebAnalyticsAdvanced' },
  { name: 'Landing Pages', icon: Globe, page: 'LandingPageBuilder' },
  { name: 'Web Audit/Reports', icon: FileSearch, page: 'SEOAudit' },
  { name: 'Web Crawler', icon: Globe, page: 'WebCrawler' },
  { name: 'Contact Forms', icon: FileText, page: 'ContactForms' },
  { name: 'divider', label: 'Social', collapsible: true },
  { name: 'Social Dashboard', icon: BarChart3, page: 'SocialDashboard' },
  { name: 'Social Calendar', icon: CalendarDays, page: 'SocialCalendar' },
  { name: 'Social Analytics', icon: Share2, page: 'SocialMedia' },
  { name: 'Social Performance', icon: TrendingUp, page: 'SocialPerformance' },
  { name: 'All Channels', icon: Share2, page: 'AllChannels' },
  { name: 'Social Accounts', icon: Key, page: 'SocialAccounts' },
  { name: 'Social Listening', icon: Radio, page: 'SocialListening' },
  { name: 'Social Leads', icon: UserCircle, page: 'SocialLeads' },
  { name: 'Social Competitors', icon: Users, page: 'CompetitorAnalysis' },
  { name: 'Hashtag Manager', icon: Target, page: 'HashtagManager' },
  { name: 'Tag Manager', icon: Tags, page: 'SocialTags' },
  { name: 'divider', label: 'Team Collaboration', collapsible: true },
  { name: 'Team Hub', icon: Users, page: 'TeamCollaboration' },
  { name: 'Social Approvals', icon: ShieldCheck, page: 'SocialApprovals' },
  { name: 'Inbox', icon: MessageSquare, page: 'Inbox' },
  { name: 'Projects Dashboard', icon: BarChart3, page: 'ProjectsDashboard' },
  { name: 'Projects', icon: Briefcase, page: 'Projects' },
  { name: 'Project Calendar', icon: CalendarDays, page: 'ProjectCalendar' },
  { name: 'divider', label: 'Documentation', collapsible: true },
  { name: 'Spaces', icon: FolderOpen, page: 'Spaces' },
  { name: 'divider', label: 'Communications', collapsible: true },
  { name: 'ICS', icon: MessageSquare, page: 'ICS' },
  { name: 'divider', label: 'Payments', collapsible: true },
  { name: 'Payments', icon: DollarSign, page: 'Payments' },
  { name: 'divider', label: 'Assets', collapsible: true },
  { name: 'Media Library', icon: FileText, page: 'MediaLibrary' },
  { name: 'Content Studio', icon: PenTool, page: 'ContentStudio' },
  { name: 'Equipment Inventory', icon: Package, page: 'EquipmentInventory' },
  { name: 'divider', label: 'AI Tools', collapsible: true },
  { name: 'AI Dashboard', icon: Sparkles, page: 'AIDashboard' },
  { name: 'divider', label: 'Executive', collapsible: true },
  { name: 'Executive Dashboard', icon: Award, page: 'ExecutiveDashboard' },
  { name: 'divider', label: 'Support', collapsible: true },
  { name: 'Help Center', icon: HelpCircle, page: 'HelpCenter' },
  { name: 'Documentation', icon: FileText, page: 'Documentation' },
  { name: 'Platform Map', icon: Network, page: 'PlatformWorkflowMap' },
  { name: 'Settings', icon: Settings, page: 'Settings' },
  { name: 'Company Settings', icon: Building2, page: 'CompanySettings' },
  { name: 'Activity Logs', icon: Activity, page: 'ActivityLogs' },
];

/**
 * Lookup of page name → collapsible section label(s) the page lives under.
 *
 * Built by walking `navigation` in order: each `divider` with `collapsible: true`
 * opens a new section, and every subsequent page entry is recorded as belonging
 * to it until the next divider. A page can map to multiple sections because some
 * (e.g. `CompetitorAnalysis`, `SEOAudit`) are listed under more than one section
 * — in that case all of its sections get expanded so the active item is visible
 * wherever it appears.
 *
 * Pages above the first divider (e.g. `Dashboard`) and pages under non-
 * collapsible dividers are intentionally excluded — they have no section to
 * expand.
 */
const PAGE_TO_SECTIONS = (() => {
  /** @type {Record<string, string[]>} */
  const map = {};
  let currentSection = null;
  for (const item of navigation) {
    if (item.name === 'divider') {
      currentSection = item.collapsible ? item.label : null;
    } else if (item.page && currentSection) {
      if (!map[item.page]) {
        map[item.page] = [];
      }
      if (!map[item.page].includes(currentSection)) {
        map[item.page].push(currentSection);
      }
    }
  }
  return map;
})();

// Color coding for navigation sections - Rainbow gradient from blue to red
const SECTION_COLORS = {
  'Business Dev': {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
    hoverIcon: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
  },
  CRM: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-l-indigo-500',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    hoverText: 'hover:text-indigo-600 dark:hover:text-indigo-400',
    hoverIcon: 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400',
  },
  Sales: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-l-violet-500',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
    hoverText: 'hover:text-violet-600 dark:hover:text-violet-400',
    hoverIcon: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
  },
  'Customer Success': {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    hoverText: 'hover:text-purple-600 dark:hover:text-purple-400',
    hoverIcon: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
  },
  HRIS: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-l-fuchsia-500',
    hoverBg: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20',
    hoverText: 'hover:text-fuchsia-600 dark:hover:text-fuchsia-400',
    hoverIcon: 'group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400',
  },
  'People Ops': {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-l-pink-500',
    hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
    hoverText: 'hover:text-pink-600 dark:hover:text-pink-400',
    hoverIcon: 'group-hover:text-pink-500 dark:group-hover:text-pink-400',
  },
  Culture: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-l-rose-500',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-900/20',
    hoverText: 'hover:text-rose-600 dark:hover:text-rose-400',
    hoverIcon: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
  },
  Talent: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-l-red-500',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    hoverText: 'hover:text-red-600 dark:hover:text-red-400',
    hoverIcon: 'group-hover:text-red-500 dark:group-hover:text-red-400',
  },
  Legal: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    hoverText: 'hover:text-orange-600 dark:hover:text-orange-400',
    hoverIcon: 'group-hover:text-orange-500 dark:group-hover:text-orange-400',
  },
  Compliance: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    hoverText: 'hover:text-amber-600 dark:hover:text-amber-400',
    hoverIcon: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
  },
  Finance: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-l-yellow-500',
    hoverBg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
    hoverText: 'hover:text-yellow-600 dark:hover:text-yellow-400',
    hoverIcon: 'group-hover:text-yellow-500 dark:group-hover:text-yellow-400',
  },
  SEO: {
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    text: 'text-lime-600 dark:text-lime-400',
    border: 'border-l-lime-500',
    hoverBg: 'hover:bg-lime-50 dark:hover:bg-lime-900/20',
    hoverText: 'hover:text-lime-600 dark:hover:text-lime-400',
    hoverIcon: 'group-hover:text-lime-500 dark:group-hover:text-lime-400',
  },
  Web: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
    hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
    hoverText: 'hover:text-green-600 dark:hover:text-green-400',
    hoverIcon: 'group-hover:text-green-500 dark:group-hover:text-green-400',
  },
  Social: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-l-emerald-500',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    hoverText: 'hover:text-emerald-600 dark:hover:text-emerald-400',
    hoverIcon: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
  },
  'Team Collaboration': {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-l-teal-500',
    hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
    hoverText: 'hover:text-teal-600 dark:hover:text-teal-400',
    hoverIcon: 'group-hover:text-teal-500 dark:group-hover:text-teal-400',
  },
  Documentation: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-l-cyan-500',
    hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
    hoverText: 'hover:text-cyan-600 dark:hover:text-cyan-400',
    hoverIcon: 'group-hover:text-cyan-500 dark:group-hover:text-cyan-400',
  },
  Communications: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-l-sky-500',
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-900/20',
    hoverText: 'hover:text-sky-600 dark:hover:text-sky-400',
    hoverIcon: 'group-hover:text-sky-500 dark:group-hover:text-sky-400',
  },
  Payments: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
    hoverIcon: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
  },
  Assets: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-l-violet-500',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
    hoverText: 'hover:text-violet-600 dark:hover:text-violet-400',
    hoverIcon: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
  },
  'AI Tools': {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    hoverText: 'hover:text-purple-600 dark:hover:text-purple-400',
    hoverIcon: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
  },
  Executive: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-l-indigo-500',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    hoverText: 'hover:text-indigo-600 dark:hover:text-indigo-400',
    hoverIcon: 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400',
  },
  Support: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-l-red-500',
    hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    hoverText: 'hover:text-red-600 dark:hover:text-red-400',
    hoverIcon: 'group-hover:text-red-500 dark:group-hover:text-red-400',
  },
  'Project Management': {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    hoverText: 'hover:text-amber-600 dark:hover:text-amber-400',
    hoverIcon: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
  },
  Reporting: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    hoverText: 'hover:text-orange-600 dark:hover:text-orange-400',
    hoverIcon: 'group-hover:text-orange-500 dark:group-hover:text-orange-400',
  },
};

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  ExecutiveDashboard: Award,
  TeamCollaboration: Users,
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
  FinanceDashboard: LayoutDashboard,
  FinancePL: TrendingUp,
  FinanceBudgets: BarChart3,
  FinanceTransactions: DollarSign,
  FinancePayroll: Users,
  FinanceForecast: Target,
  VendorSpace: Building2,
  AccountingDashboard: DollarSign,
  Equity: TrendingUp,
  ComplianceDashboard: ShieldCheck,
  ComplianceExecutiveSummary: Activity,
  CompliancePolicies: FileText,
  ComplianceTraining: GraduationCap,
  ComplianceIncidents: AlertTriangle,
  ComplianceAudits: Search,
  ComplianceRisk: TrendingUp,
  ExportControl: ShieldCheck,
  LegalDashboard: Scale,
  LegalMatters: Briefcase,
  LegalLitigation: Scale,
  LegalObligations: AlertTriangle,
  LegalIP: ShieldCheck,
  LegalCounsel: Users,
  LegalEntities: Building2,
  AIDashboard: Sparkles,
  Contacts: Users,
  Companies: Building2,
  DocuTrace: FileText,
  DataRooms: Folder,
  Deals: Target,
  Activities: Calendar,
  SalesHub: Target,
  SalesInbox: Mail,
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
  AllChannels: Share2,
  SocialAccounts: Key,
  CompetitorAnalysis: Users,
  Campaigns: Megaphone,
  EmailMarketing: Mail,
  ReportsDashboardPage: BarChart3,
  Reports: FileBarChart,
  MarketingHub: TrendingUp,
  ContentStudio: PenTool,
  LocalSEO: MapPin,
  Projects: Briefcase,
  ProjectsDashboard: BarChart3,
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
  HRISOrgChart: Network,
  HRISDashboard: LayoutDashboard,
  HRISOnboarding: UserCheck,
  HRISEmployees: Users,
  HRISTimeOff: Calendar,
  HRISPayroll: DollarSign,
  HRISBenefits: Heart,
  HRISPerformance: Target,
  HRISDocuments: FileText,
  HRISDepartments: Building2,
  HRISHiring: Briefcase,
  HRISEmailTemplates: Mail,
  HRISOffboarding: LogOut,
  HRISTeamCalendar: CalendarDays,
  HRISContracts: FileSignature,
  HRISAnnouncements: Megaphone,
  HRISRecognition: Award,
  HRISAnalytics: BarChart3,
  HRISAIAssistant: Sparkles,
  TalentTraining: BookOpen,
  TalentCareerPaths: TrendingUp,
  TalentMentorships: Users,
  TalentInternships: GraduationCap,
  TalentSkills: Zap,
  TalentSurveys: BarChart3,
  WorkflowBuilder: Zap,
  Settings: Settings,
  HelpCenter: HelpCircle,
  PlatformWorkflowMap: Network,
  CompanySettings: Building2,
  ActivityLogs: Activity,
  };

function SidebarContent({
  currentPage,
  onNavigate,
  isEnabled,
  user,
  onAddFavorite,
  onRemoveFavorite,
  dragOverFavorites,
  setDragOverFavorites,
  isCollapsed,
}) {
  const navGuard = useNavigationGuard();
  const handleLinkClick = (e, url) => {
    // Don't guard modified clicks (new tab/window) — user isn't leaving the page.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      onNavigate?.(e);
      return;
    }
    if (navGuard.guardedNavigate(url)) {
      // Guard is blocking — prevent the Link's default navigation;
      // the context renders the confirm dialog and navigates on confirm.
      e.preventDefault();
      return;
    }
    // Not blocked — let the Link navigate via its `to` prop.
    onNavigate?.(e);
  };
  const [collapsedSections, setCollapsedSections] = useState(() => {
    /** @type {Record<string, boolean>} */
    const initial = {
      'Business Dev': true,
      CRM: true,
      Sales: true,
      'Customer Success': true,
      SEO: true,
       Social: false,
       Web: true,
      'Team Collaboration': true,
      Documentation: true,
      Communications: true,
      Payments: true,
      Assets: true,
      Reporting: true,
      Compliance: true,
      Legal: true,
      Finance: true,
      'AI Tools': true,
      Executive: true,
      Support: true,
      HRIS: true,
      'People Ops': true,
      Culture: true,
      Talent: true,
    };
    for (const section of PAGE_TO_SECTIONS[currentPage] || []) {
      if (section in initial) {
        initial[section] = false;
      }
    }
    return initial;
  });

  useEffect(() => {
    const activeSections = PAGE_TO_SECTIONS[currentPage] || [];
    if (activeSections.length === 0) {
      return;
    }
    setCollapsedSections((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const section of activeSections) {
        if (next[section]) {
          next[section] = false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [currentPage]);

  const toggleSection = (sectionLabel) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel],
    }));
  };

  // Filter navigation based on enabled features
  const filteredNavigation = navigation.filter((item) => {
    if (item.name === 'divider') {
      return true;
    }
    // Always show Dashboard, Settings, Activity Logs, Help Center
    if (['Dashboard', 'Settings', 'ActivityLogs', 'HelpCenter', 'SEOTools'].includes(item.page)) {
      return true;
    }
    // Check if feature is enabled
    const featureKey = PAGE_FEATURE_MAP[item.page];
    if (!featureKey) {
      return true;
    } // If no feature mapping, show it
    return isEnabled(featureKey);
  });

  // Remove consecutive dividers and trailing dividers
  const cleanedNavigation = filteredNavigation.filter((item, idx, arr) => {
    if (item.name !== 'divider' && item.name !== 'favorites') {
      return true;
    }
    if (item.name === 'favorites') {
      return true;
    }
    const nextItem = arr[idx + 1];
    if (!nextItem || nextItem.name === 'divider') {
      return false;
    }
    return true;
  });

  // Get user's favorite links (max 3)
  const favoriteLinks = (user?.favorite_links || []).slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
          {!isCollapsed && <WhitelabelHeader />}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className={`space-y-0.5 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {cleanedNavigation.map((item, idx) => {
            if (item.name === 'divider') {
              const isSectionCollapsed = collapsedSections[item.label];
              const isCollapsible = item.collapsible;
              const sectionColor = SECTION_COLORS[item.label] || {
                bg: '',
                text: 'text-gray-400 dark:text-gray-500',
                border: 'border-l-gray-400',
              };

              // Hide dividers when sidebar is collapsed
              if (isCollapsed) {
                return null;
              }

              return (
                <div key={idx} className="pt-4 pb-1">
                  <button
                    onClick={() => isCollapsible && toggleSection(item.label)}
                    className={`w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-lg ${
                      sectionColor.bg
                    } ${sectionColor.text} border-l-4 ${sectionColor.border} ${
                      isCollapsible ? 'hover:opacity-80 cursor-pointer' : ''
                    }`}
                  >
                    {isCollapsible &&
                      (isSectionCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      ))}
                    {item.label}
                  </button>
                </div>
              );
            }

            // Find the section this item belongs to
            const prevDividerIdx = cleanedNavigation
              .slice(0, idx)
              .reverse()
              .findIndex((i) => i.name === 'divider');
            const sectionItem =
              prevDividerIdx !== -1 ? cleanedNavigation[idx - prevDividerIdx - 1] : null;
            const defaultSC = {
              bg: 'bg-gray-50 dark:bg-gray-800',
              text: 'text-gray-600 dark:text-gray-400',
              border: 'border-l-gray-400',
              hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-800',
              hoverText: 'hover:text-gray-700 dark:hover:text-gray-200',
              hoverIcon: 'group-hover:text-gray-500 dark:group-hover:text-gray-300',
            };
            const itemSectionColor = sectionItem
              ? SECTION_COLORS[sectionItem.label] || defaultSC
              : defaultSC;

            // Check if item should be hidden due to collapsed section
            const sectionIdx = prevDividerIdx;
            if (sectionIdx !== -1) {
              const sectionDivider = cleanedNavigation[idx - sectionIdx - 1];
              if (sectionDivider.collapsible && collapsedSections[sectionDivider.label]) {
                return null;
              }
            }

            if (item.name === 'favorites') {
              // Hide favorites section when sidebar is collapsed
              if (isCollapsed) {
                return null;
              }

              return (
                <div
                  key={idx}
                  className={`space-y-0.5 pl-4 border-l-2 ml-3 mb-2 transition-all duration-200 ${
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
                      } catch {}
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
                          onClick={(e) => handleLinkClick(e, createPageUrl(fav.page))}
                          className="flex items-center gap-2 flex-1"
                        >
                          <FavIcon
                            className={`w-3.5 h-3.5 ${isActive ? 'text-violet-500' : 'text-gray-400'}`}
                          />
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
                          <svg
                            className="w-3 h-3 text-gray-400 hover:text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
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
            const sc = itemSectionColor;

            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                onClick={(e) => handleLinkClick(e, createPageUrl(item.page))}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'text/plain',
                    JSON.stringify({ page: item.page, label: item.name })
                  );
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                title={isCollapsed ? item.name : ''}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  isActive
                    ? `${sc.bg} ${sc.text}`
                    : `text-gray-900 dark:text-gray-100 ${sc.hoverBg} ${sc.hoverText}`
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${isActive ? sc.text : `text-gray-400 dark:text-gray-500 ${sc.hoverIcon}`}`}
                />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dragOverFavorites, setDragOverFavorites] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const qClient = useQueryClient();
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
      if (!user?.id) {
        return null;
      }
      const records = await base44.entities.UserOnboarding.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user?.id,
  });

  // Show onboarding for new users or users without full_name
  useEffect(() => {
    if (user?.id) {
      const emailPrefix = user.email?.split('@')[0] || 'User';
      const autoGeneratedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

      // Check if user name is auto-generated (needs to set proper name)
      if (user.full_name === autoGeneratedName) {
        setPendingName(user.full_name);
        setShowNamePrompt(true);
      }

      // Check onboarding status
      if (onboardingStatus === null) {
        // New user - create onboarding record and show modal
        base44.entities.UserOnboarding.create({
          user_id: user.id,
          started_at: new Date().toISOString(),
        }).then(() => {
          qClient.invalidateQueries({ queryKey: ['user-onboarding'] });
          setShowOnboarding(true);
        });
      } else if (onboardingStatus && !onboardingStatus.is_complete && !onboardingStatus.skipped) {
        setShowOnboarding(true);
      }
    }
  }, [user?.id, onboardingStatus, qClient]);

  const handleOnboardingComplete = async () => {
    if (onboardingStatus) {
      await base44.entities.UserOnboarding.update(onboardingStatus.id, {
        is_complete: true,
        completed_at: new Date().toISOString(),
      });
      qClient.invalidateQueries({ queryKey: ['user-onboarding'] });
    }
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = async () => {
    if (onboardingStatus) {
      await base44.entities.UserOnboarding.update(onboardingStatus.id, {
        skipped: true,
      });
      qClient.invalidateQueries({ queryKey: ['user-onboarding'] });
    }
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleAddFavorite = useCallback(
    async (navItem) => {
      if (!user) {
        return;
      }
      const currentFavorites = user.favorite_links || [];
      if (currentFavorites.length >= 3) {
        return;
      }
      if (currentFavorites.some((f) => f.page === navItem.page)) {
        return;
      }

      const newFavorites = [...currentFavorites, { page: navItem.page, label: navItem.label }];
      await base44.auth.updateMe({ favorite_links: newFavorites });
      qClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    [user, qClient]
  );

  const handleRemoveFavorite = useCallback(
    async (page) => {
      if (!user) {
        return;
      }
      const currentFavorites = user.favorite_links || [];
      const newFavorites = currentFavorites.filter((f) => f.page !== page);
      await base44.auth.updateMe({ favorite_links: newFavorites });
      qClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    [user, qClient]
  );

  return (
    <ThemeProvider>
      <SessionReplayTracker />
      {/* Google Analytics */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-15KW7LZW87"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-15KW7LZW87');
      `,
        }}
      />
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
              <SidebarContent
                currentPage={currentPageName}
                onNavigate={() => setSidebarOpen(false)}
                isEnabled={isEnabled}
                user={user}
                onAddFavorite={handleAddFavorite}
                onRemoveFavorite={handleRemoveFavorite}
                dragOverFavorites={dragOverFavorites}
                setDragOverFavorites={setDragOverFavorites}
                isCollapsed={false}
              />
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
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm">
                      {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <SocialMediaRoleDropdownSection user={user} />
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
        <div
          className={`hidden lg:flex top-0 right-0 h-14 glass-topbar z-30 items-center justify-end px-6 transition-all duration-300 ${
            sidebarCollapsed ? 'left-16' : 'left-64'
          }`}
        >
          <div className="flex items-center gap-4 ml-auto">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter user={user} />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors">
                  <Avatar className="w-8 h-8">
                    {user?.avatar_url && (
                      <AvatarImage src={user.avatar_url} alt={user?.full_name || 'User'} />
                    )}
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                      {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.full_name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <SocialMediaRoleDropdownSection user={user} />
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
        <aside
          className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col glass-sidebar z-30 transition-all duration-300 ${
            sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
          }`}
        >
          <SidebarContent
            currentPage={currentPageName}
            isEnabled={isEnabled}
            user={user}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
            dragOverFavorites={dragOverFavorites}
            setDragOverFavorites={setDragOverFavorites}
            isCollapsed={sidebarCollapsed}
          />

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-50"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRight
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`}
            />
          </button>

          {/* User Section */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Avatar className="w-9 h-9">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                        {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    )}
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
                <SocialMediaRoleDropdownSection user={user} />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}
        >
          <div className="min-h-screen gradient-bg">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>

        {/* Chat Bubble */}
        <ChatBubble />

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />

        {/* Name Setup Prompt */}
        {showNamePrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Let's get your actual name on file
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowNamePrompt(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={() => {
                      if (pendingName.trim()) {
                        base44.auth.updateMe({ full_name: pendingName });
                        qClient.invalidateQueries({ queryKey: ['current-user'] });
                        setShowNamePrompt(false);
                      }
                    }}
                    disabled={!pendingName.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white transition-colors font-medium"
                  >
                    Save Name
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Modal */}
        <OnboardingModal
          open={showOnboarding}
          onClose={handleOnboardingSkip}
          onComplete={handleOnboardingComplete}
        />
      </div>
    </ThemeProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LayoutContent currentPageName={currentPageName}>{children}</LayoutContent>
    </QueryClientProvider>
  );
}