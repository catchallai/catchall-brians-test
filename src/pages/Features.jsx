import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Building2,
  Target,
  Calendar,
  Mail,
  Zap,
  Search,
  Link2,
  FileSearch,
  Globe,
  Share2,
  Radio,
  MapPin,
  Newspaper,
  FileText,
  BarChart3,
  PenTool,
  TrendingUp,
  UserPlus,
  Loader2,
  Sparkles,
  Rocket,
  Crown,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  DollarSign,
  Heart,
  BookOpen,
  Award,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import TourGuide from '@/components/tour/TourGuide';

// Feature definitions organized by tier and category
const FEATURES = {
  // ===== STARTER TIER =====
  // Business Development
  aerospaceScanner: {
    name: 'Aerospace Scanner',
    icon: Rocket,
    tier: 'starter',
    category: 'Business Dev',
    default: true,
  },
  competitorAnalysis: {
    name: 'Competitor Analysis',
    icon: Users,
    tier: 'starter',
    category: 'Business Dev',
    default: true,
  },
  visitorProfiles: {
    name: 'Lead Analysis',
    icon: Users,
    tier: 'starter',
    category: 'Business Dev',
    default: true,
  },
  listings: {
    name: 'Listings & Reviews',
    icon: MapPin,
    tier: 'starter',
    category: 'Business Dev',
    default: true,
  },
  mediaOutreach: {
    name: 'Media Outreach',
    icon: Mail,
    tier: 'starter',
    category: 'Business Dev',
    default: true,
  },
  pressMonitoring: {
    name: 'Press Monitoring',
    icon: Newspaper,
    tier: 'starter',
    category: 'Business Dev',
    default: true,
  },

  // CRM & Marketing
  contacts: { name: 'Contacts', icon: Users, tier: 'starter', category: 'CRM', default: true },
  companies: {
    name: 'Companies',
    icon: Building2,
    tier: 'starter',
    category: 'CRM',
    default: true,
  },
  opportunities: {
    name: 'Opportunities',
    icon: Target,
    tier: 'starter',
    category: 'CRM',
    default: true,
  },
  deals: { name: 'Pipeline', icon: Target, tier: 'starter', category: 'CRM', default: true },
  activities: {
    name: 'Activities',
    icon: Calendar,
    tier: 'starter',
    category: 'CRM',
    default: true,
  },
  emailMarketing: {
    name: 'Email Marketing',
    icon: Mail,
    tier: 'starter',
    category: 'CRM',
    default: true,
  },
  marketingHub: {
    name: 'Marketing Hub',
    icon: TrendingUp,
    tier: 'starter',
    category: 'CRM',
    default: true,
  },
  automation: { name: 'Automation', icon: Zap, tier: 'starter', category: 'CRM', default: true },

  // Document Management
  docuTrace: { name: 'DocuTrace', icon: FileText, tier: 'starter', category: 'Documents', default: true },
  dataRooms: {
    name: 'Data Rooms',
    icon: FileText,
    tier: 'starter',
    category: 'Documents',
    default: true,
  },
  legalDocuments: {
    name: 'Legal Documents',
    icon: FileText,
    tier: 'starter',
    category: 'Documents',
    default: true,
  },

  // SEO & Analytics
  seoDashboard: {
    name: 'SEO Analytics',
    icon: Search,
    tier: 'starter',
    category: 'SEO',
    default: true,
  },
  seoTools: { name: 'SEO Tools', icon: Globe, tier: 'starter', category: 'SEO', default: true },
  seoAudit: {
    name: 'SEO Audits',
    icon: FileSearch,
    tier: 'starter',
    category: 'SEO',
    default: true,
  },
  keywords: { name: 'Keywords', icon: Target, tier: 'starter', category: 'SEO', default: true },
  backlinks: { name: 'Backlinks', icon: Link2, tier: 'starter', category: 'SEO', default: true },
  localSEO: { name: 'Local SEO', icon: MapPin, tier: 'starter', category: 'SEO', default: true },

  // Reports
  reports: {
    name: 'Reports',
    icon: BarChart3,
    tier: 'starter',
    category: 'Analytics',
    default: true,
  },

  // ===== GROWTH TIER =====
  // Sales
  salesHub: { name: 'Sales Hub', icon: Target, tier: 'growth', category: 'Sales', default: false },
  leadEnrichment: {
    name: 'Lead Enrichment',
    icon: Users,
    tier: 'growth',
    category: 'Sales',
    default: false,
  },
  sequences: { name: 'Sequences', icon: Zap, tier: 'growth', category: 'Sales', default: false },
  proposals: {
    name: 'Proposals',
    icon: FileText,
    tier: 'growth',
    category: 'Sales',
    default: false,
  },
  meetingScheduler: {
    name: 'Meeting Scheduler',
    icon: Calendar,
    tier: 'growth',
    category: 'Sales',
    default: false,
  },
  salesQuotas: {
    name: 'Sales Quotas',
    icon: TrendingUp,
    tier: 'growth',
    category: 'Sales',
    default: false,
  },
  reservations: {
    name: 'Reservations',
    icon: Calendar,
    tier: 'growth',
    category: 'Sales',
    default: false,
  },

  // Social Media & Content
  socialMedia: {
    name: 'Social Analytics',
    icon: Share2,
    tier: 'growth',
    category: 'Social Media',
    default: false,
  },
  socialCalendar: {
    name: 'Social Calendar',
    icon: Calendar,
    tier: 'growth',
    category: 'Social Media',
    default: false,
  },
  socialListening: {
    name: 'Social Listening',
    icon: Radio,
    tier: 'growth',
    category: 'Social Media',
    default: false,
  },
  socialLeads: {
    name: 'Social Leads',
    icon: UserPlus,
    tier: 'growth',
    category: 'Social Media',
    default: false,
  },
  hashtagManager: {
    name: 'Hashtag Manager',
    icon: Target,
    tier: 'growth',
    category: 'Social Media',
    default: false,
  },
  landingPages: {
    name: 'Landing Pages',
    icon: Globe,
    tier: 'growth',
    category: 'Social Media',
    default: false,
  },

  // Web & Performance
  trafficAnalytics: {
    name: 'Web Analytics',
    icon: BarChart3,
    tier: 'growth',
    category: 'Web',
    default: false,
  },
  webCrawler: { name: 'Web Crawler', icon: Globe, tier: 'growth', category: 'Web', default: false },
  contactForms: {
    name: 'Contact Forms',
    icon: FileText,
    tier: 'growth',
    category: 'Web',
    default: false,
  },

  // ===== ENTERPRISE TIER =====
  // Collaboration & Project Management
  projects: {
    name: 'Projects',
    icon: Briefcase,
    tier: 'enterprise',
    category: 'Collaboration',
    default: false,
  },
  spaces: {
    name: 'Spaces',
    icon: FileText,
    tier: 'enterprise',
    category: 'Collaboration',
    default: false,
  },
  ics: { name: 'ICS', icon: Mail, tier: 'enterprise', category: 'Collaboration', default: false },

  // Customer Success
  customerSuccess: {
    name: 'Customer Success',
    icon: Users,
    tier: 'enterprise',
    category: 'Customer Success',
    default: false,
  },

  // Legal & Compliance
  legalDashboard: { name: 'Legal Dashboard', icon: Scale, tier: 'enterprise', category: 'Legal', default: false },
  legalMatters: { name: 'Matters', icon: Briefcase, tier: 'enterprise', category: 'Legal', default: false },
  legalLitigation: { name: 'Litigation', icon: Scale, tier: 'enterprise', category: 'Legal', default: false },
  legalObligations: { name: 'Obligations', icon: AlertTriangle, tier: 'enterprise', category: 'Legal', default: false },
  legalIP: { name: 'Intellectual Property', icon: ShieldCheck, tier: 'enterprise', category: 'Legal', default: false },
  legalCounsel: { name: 'Counsel', icon: Users, tier: 'enterprise', category: 'Legal', default: false },
  legalEntities: { name: 'Legal Entities', icon: Building2, tier: 'enterprise', category: 'Legal', default: false },

  complianceDashboard: { name: 'Compliance Dashboard', icon: ShieldCheck, tier: 'enterprise', category: 'Compliance', default: false },
  compliancePolicies: { name: 'Policies', icon: FileText, tier: 'enterprise', category: 'Compliance', default: false },
  complianceTraining: { name: 'Compliance Training', icon: GraduationCap, tier: 'enterprise', category: 'Compliance', default: false },
  complianceIncidents: { name: 'Incidents', icon: AlertTriangle, tier: 'enterprise', category: 'Compliance', default: false },
  complianceAudits: { name: 'Audits', icon: Search, tier: 'enterprise', category: 'Compliance', default: false },
  complianceRisk: { name: 'Risk Register', icon: TrendingUp, tier: 'enterprise', category: 'Compliance', default: false },
  exportControl: { name: 'Export Control', icon: ShieldCheck, tier: 'enterprise', category: 'Compliance', default: false },
  complianceExecutiveSummary: { name: 'Executive Summary', icon: BarChart3, tier: 'enterprise', category: 'Compliance', default: false },

  // Human Resources
  hrisDashboard: { name: 'HRIS Dashboard', icon: BarChart3, tier: 'enterprise', category: 'HRIS', default: false },
  hrisEmployees: { name: 'Employees', icon: Users, tier: 'enterprise', category: 'HRIS', default: false },
  hrisDepartments: { name: 'Departments', icon: Building2, tier: 'enterprise', category: 'HRIS', default: false },
  hrisOnboarding: { name: 'Onboarding', icon: UserPlus, tier: 'enterprise', category: 'HRIS', default: false },
  hrisOffboarding: { name: 'Offboarding', icon: Users, tier: 'enterprise', category: 'HRIS', default: false },
  hrisTimeOff: { name: 'Time Off', icon: Calendar, tier: 'enterprise', category: 'HRIS', default: false },
  hrisPayroll: { name: 'Payroll', icon: DollarSign, tier: 'enterprise', category: 'HRIS', default: false },
  hrisBenefits: { name: 'Benefits', icon: Heart, tier: 'enterprise', category: 'HRIS', default: false },
  hrisContracts: { name: 'Contracts', icon: FileText, tier: 'enterprise', category: 'HRIS', default: false },
  hrisDocuments: { name: 'HR Documents', icon: FileText, tier: 'enterprise', category: 'HRIS', default: false },
  hrisEmailTemplates: { name: 'Email Templates', icon: Mail, tier: 'enterprise', category: 'HRIS', default: false },
  hrisAnnouncements: { name: 'Announcements', icon: Newspaper, tier: 'enterprise', category: 'HRIS', default: false },
  hrisRecognition: { name: 'Recognition', icon: Award, tier: 'enterprise', category: 'HRIS', default: false },
  hrisAnalytics: { name: 'HR Analytics', icon: BarChart3, tier: 'enterprise', category: 'HRIS', default: false },
  hrisAIAssistant: { name: 'HR AI Assistant', icon: Sparkles, tier: 'enterprise', category: 'HRIS', default: false },
  hrisTeamCalendar: { name: 'Team Calendar', icon: Calendar, tier: 'enterprise', category: 'HRIS', default: false },
  hrisPerformance: { name: 'Performance', icon: Target, tier: 'enterprise', category: 'HRIS', default: false },
  hrisHiring: { name: 'Hiring', icon: Briefcase, tier: 'enterprise', category: 'HRIS', default: false },

  talentTraining: { name: 'Training', icon: BookOpen, tier: 'enterprise', category: 'Talent', default: false },
  talentCareerPaths: { name: 'Career Paths', icon: TrendingUp, tier: 'enterprise', category: 'Talent', default: false },
  talentMentorships: { name: 'Mentorships', icon: Users, tier: 'enterprise', category: 'Talent', default: false },
  talentInternships: { name: 'Internships', icon: GraduationCap, tier: 'enterprise', category: 'Talent', default: false },
  talentSkills: { name: 'Skills', icon: Zap, tier: 'enterprise', category: 'Talent', default: false },
  talentSurveys: { name: 'Surveys', icon: BarChart3, tier: 'enterprise', category: 'Talent', default: false },

  // Finance & Assets
  payments: {
    name: 'Payments',
    icon: DollarSign,
    tier: 'enterprise',
    category: 'Finance',
    default: false,
  },
  equity: { name: 'Equity', icon: TrendingUp, tier: 'enterprise', category: 'Finance', default: false },
  accountingDashboard: { name: 'Accounting Dashboard', icon: DollarSign, tier: 'enterprise', category: 'Finance', default: false },

  mediaLibrary: {
    name: 'Media Library',
    icon: FileText,
    tier: 'enterprise',
    category: 'Assets',
    default: false,
  },
  contentStudio: {
    name: 'Content Studio',
    icon: PenTool,
    tier: 'enterprise',
    category: 'Assets',
    default: false,
  },
  equipmentInventory: {
    name: 'Equipment Inventory',
    icon: Package,
    tier: 'enterprise',
    category: 'Assets',
    default: false,
  },
};

const TIER_ICONS = {
  starter: Sparkles,
  growth: Rocket,
  enterprise: Crown,
};

const TIER_COLORS = {
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  growth: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const TIER_DESCRIPTIONS = {
  starter: 'Core CRM, email marketing, SEO tools, and document management. Perfect for getting started.',
  growth: 'Add sales acceleration, social media management, and advanced web analytics to grow faster.',
  enterprise: 'Complete suite with legal compliance, HRIS, project management, and advanced reporting.',
};

export default function Features() {
  const queryClient = useQueryClient();

  const { data: featureSettings = [], isLoading } = useQuery({
    queryKey: ['feature-settings'],
    queryFn: () => base44.entities.FeatureSettings.list(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ featureKey, enabled }) => {
      const existing = featureSettings.find((f) => f.feature_key === featureKey);
      if (existing) {
        return base44.entities.FeatureSettings.update(existing.id, { enabled });
      } else {
        return base44.entities.FeatureSettings.create({
          feature_key: featureKey,
          enabled,
          tier: FEATURES[featureKey]?.tier || 'starter',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-settings'] });
    },
  });

  const applyPresetMutation = useMutation({
    mutationFn: async (tier) => {
      const updates = Object.entries(FEATURES).map(([key, feature]) => {
        const shouldEnable =
          tier === 'enterprise'
            ? true
            : tier === 'growth'
              ? feature.tier === 'starter' || feature.tier === 'growth'
              : feature.tier === 'starter';
        return { featureKey: key, enabled: shouldEnable };
      });

      for (const update of updates) {
        const existing = featureSettings.find((f) => f.feature_key === update.featureKey);
        if (existing) {
          await base44.entities.FeatureSettings.update(existing.id, { enabled: update.enabled });
        } else {
          await base44.entities.FeatureSettings.create({
            feature_key: update.featureKey,
            enabled: update.enabled,
            tier: FEATURES[update.featureKey]?.tier || 'starter',
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-settings'] });
      toast.success('Preset applied successfully');
    },
  });

  const isFeatureEnabled = (featureKey) => {
    const setting = featureSettings.find((f) => f.feature_key === featureKey);
    if (setting) {
      return setting.enabled;
    }
    return FEATURES[featureKey]?.default || false;
  };

  const toggleFeature = (featureKey) => {
    const currentlyEnabled = isFeatureEnabled(featureKey);
    updateMutation.mutate({ featureKey, enabled: !currentlyEnabled });
  };

  const categories = [...new Set(Object.values(FEATURES).map((f) => f.category))];
  const enabledCount = Object.keys(FEATURES).filter((k) => isFeatureEnabled(k)).length;
  const totalCount = Object.keys(FEATURES).length;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen max-w-7xl mx-auto">
      {/* Header */}
      <div data-tour="features-header" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feature Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {enabledCount} of {totalCount} features enabled
        </p>
        </div>
        <TourGuide tourName="features" />
      </div>

      {/* Quick Presets */}
      <div data-tour="features-tiers" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['starter', 'growth', 'enterprise'].map((tier) => {
          const TierIcon = TIER_ICONS[tier];
          return (
            <button
              key={tier}
              onClick={() => applyPresetMutation.mutate(tier)}
              disabled={applyPresetMutation.isPending}
              className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                tier === 'starter'
                  ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-400'
                  : tier === 'growth'
                    ? 'border-violet-200 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-400'
                    : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <TierIcon className={`w-5 h-5 ${
                  tier === 'starter'
                    ? 'text-blue-600'
                    : tier === 'growth'
                      ? 'text-violet-600'
                      : 'text-amber-600'
                }`} />
                <span className={`font-semibold capitalize ${
                  tier === 'starter'
                    ? 'text-blue-700'
                    : tier === 'growth'
                      ? 'text-violet-700'
                      : 'text-amber-700'
                }`}>
                  {tier}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{TIER_DESCRIPTIONS[tier]}</p>
            </button>
          );
        })}
      </div>

      {/* Features by Category */}
      <Tabs defaultValue={categories[0]} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent border-b border-gray-200 dark:border-gray-700 p-0">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat}
              value={cat}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent"
            >
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(FEATURES)
                    .filter(([_, f]) => f.category === category)
                    .map(([key, feature]) => {
                      const Icon = feature.icon;
                      const TierIcon = TIER_ICONS[feature.tier];
                      const enabled = isFeatureEnabled(key);

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            enabled
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                enabled
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${enabled ? 'text-emerald-600' : 'text-gray-400'}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`font-medium text-sm truncate ${
                                  enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                }`}
                              >
                                {feature.name}
                              </p>
                              <Badge className={`${TIER_COLORS[feature.tier]} text-xs mt-1`}>
                                <TierIcon className="w-3 h-3 mr-1" />
                                {feature.tier}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            data-tour="features-toggle"
                            checked={enabled}
                            onCheckedChange={() => toggleFeature(key)}
                            disabled={updateMutation.isPending}
                            className="shrink-0"
                          />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}