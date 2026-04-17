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
} from 'lucide-react';
import { toast } from 'sonner';

// Feature definitions with tiers
const FEATURES = {
  // Business Development - Starter
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
  legalDocuments: {
    name: 'Legal Documents',
    icon: FileText,
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

  // CRM - Starter
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
  docuTrace: { name: 'DocuTrace', icon: FileText, tier: 'starter', category: 'CRM', default: true },
  dataRooms: {
    name: 'Data Rooms',
    icon: FileText,
    tier: 'starter',
    category: 'CRM',
    default: true,
  },
  automation: { name: 'Automation', icon: Zap, tier: 'starter', category: 'CRM', default: true },
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

  // Sales - Growth
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

  // Customer Success - Enterprise
  customerSuccess: {
    name: 'Customer Success',
    icon: Users,
    tier: 'enterprise',
    category: 'Customer Success',
    default: false,
  },

  // SEO - Starter
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

  // Social - Growth
  socialMedia: {
    name: 'Social Analytics',
    icon: Share2,
    tier: 'growth',
    category: 'Social',
    default: false,
  },
  socialCalendar: {
    name: 'Social Calendar',
    icon: Calendar,
    tier: 'growth',
    category: 'Social',
    default: false,
  },
  landingPages: {
    name: 'Landing Pages',
    icon: Globe,
    tier: 'growth',
    category: 'Social',
    default: false,
  },
  socialListening: {
    name: 'Social Listening',
    icon: Radio,
    tier: 'growth',
    category: 'Social',
    default: false,
  },
  socialLeads: {
    name: 'Social Leads',
    icon: UserPlus,
    tier: 'growth',
    category: 'Social',
    default: false,
  },
  hashtagManager: {
    name: 'Hashtag Manager',
    icon: Target,
    tier: 'growth',
    category: 'Social',
    default: false,
  },

  // Web - Growth
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

  // Documentation - Enterprise
  spaces: {
    name: 'Spaces',
    icon: FileText,
    tier: 'enterprise',
    category: 'Documentation',
    default: false,
  },

  // Payments - Enterprise
  payments: {
    name: 'Payments',
    icon: TrendingUp,
    tier: 'enterprise',
    category: 'Payments',
    default: false,
  },

  // Reporting - Starter
  reports: {
    name: 'Reports',
    icon: BarChart3,
    tier: 'starter',
    category: 'Reporting',
    default: true,
  },

  // Project Management - Enterprise
  projects: {
    name: 'Projects',
    icon: Users,
    tier: 'enterprise',
    category: 'Projects',
    default: false,
  },

  // Communications - Enterprise
  ics: { name: 'ICS', icon: Mail, tier: 'enterprise', category: 'Communications', default: false },

  // Assets - Enterprise
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
    icon: Users,
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
  starter: 'bg-blue-100 text-blue-700',
  growth: 'bg-violet-100 text-violet-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function FeatureManager() {
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Feature Management
          </h2>
          <p className="text-sm text-gray-500">
            {enabledCount} of {totalCount} features enabled
          </p>
        </div>
      </div>

      {/* Quick Presets */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Quick Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => applyPresetMutation.mutate('starter')}
              disabled={applyPresetMutation.isPending}
              className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-400 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-700">Starter</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Core CRM, basic marketing & SEO tools. Perfect for getting started.
              </p>
            </button>

            <button
              onClick={() => applyPresetMutation.mutate('growth')}
              disabled={applyPresetMutation.isPending}
              className="p-4 rounded-xl border-2 border-violet-200 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-400 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-violet-600" />
                <span className="font-semibold text-violet-700">Growth</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                + Social media, automation, advanced SEO. For scaling businesses.
              </p>
            </button>

            <button
              onClick={() => applyPresetMutation.mutate('enterprise')}
              disabled={applyPresetMutation.isPending}
              className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-400 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-700">Enterprise</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                All features enabled. Full marketing suite for large teams.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Features by Category */}
      <Tabs defaultValue={categories[0]}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {Object.entries(FEATURES)
                    .filter(([_, f]) => f.category === category)
                    .map(([key, feature]) => {
                      const Icon = feature.icon;
                      const TierIcon = TIER_ICONS[feature.tier];
                      const enabled = isFeatureEnabled(key);

                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            enabled
                              ? 'bg-emerald-50 dark:bg-emerald-900/20'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                enabled
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${enabled ? 'text-emerald-600' : 'text-gray-400'}`}
                              />
                            </div>
                            <div>
                              <p
                                className={`font-medium ${enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}
                              >
                                {feature.name}
                              </p>
                              <Badge className={`${TIER_COLORS[feature.tier]} text-xs`}>
                                <TierIcon className="w-3 h-3 mr-1" />
                                {feature.tier}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => toggleFeature(key)}
                            disabled={updateMutation.isPending}
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
