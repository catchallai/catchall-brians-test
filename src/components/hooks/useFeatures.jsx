import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Default enabled features (Starter tier)
const DEFAULT_FEATURES = {
  contacts: true,
  companies: true,
  deals: true,
  activities: true,
  campaigns: true,
  emailMarketing: true,
  reports: true,
  seoDashboard: true,
  keywords: true,
  pitchDeckCreator: true,
  pitchDeckAnalyzer: true,
  takeDownRequestor: true,
  accountingDashboard: false,
  landingPageBuilder: true,
};

export function useFeatures() {
  const { data: featureSettings = [], isLoading } = useQuery({
    queryKey: ['feature-settings'],
    queryFn: () => base44.entities.FeatureSettings.list(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isEnabled = (featureKey) => {
    const setting = featureSettings.find((f) => f.feature_key === featureKey);
    if (setting) {
      return setting.enabled;
    }
    return DEFAULT_FEATURES[featureKey] || false;
  };

  const enabledFeatures = featureSettings.filter((f) => f.enabled).map((f) => f.feature_key);

  return {
    isEnabled,
    enabledFeatures,
    isLoading,
    featureSettings,
  };
}

// Map feature keys to page names for navigation filtering
export const FEATURE_PAGE_MAP = {
  pitchDeckCreator: 'PitchDeckCreator',
  pitchDeckAnalyzer: 'PitchDeckAnalyzer',
  takeDownRequestor: 'TakeDownRequestor',
  contacts: 'Contacts',
  companies: 'Companies',
  deals: 'Deals',
  activities: 'Activities',
  campaigns: 'Campaigns',
  emailMarketing: 'EmailMarketing',
  reports: 'Reports',
  seoDashboard: 'SEODashboard',
  keywords: 'Keywords',
  socialMedia: 'SocialMedia',
  socialListening: 'SocialListening',
  socialCalendar: 'SocialCalendar',
  hashtagManager: 'HashtagManager',
  competitorAnalysis: 'CompetitorAnalysis',
  socialLeads: 'SocialLeads',
  contactForms: 'ContactForms',
  automation: 'Automation',
  backlinks: 'Backlinks',
  seoAudit: 'SEOAudit',
  contentStrategy: 'ContentStrategy',
  marketingHub: 'MarketingHub',
  listings: 'Listings',
  pressMonitoring: 'PressMonitoring',
  webCrawler: 'WebCrawler',
  trafficAnalytics: 'TrafficAnalytics',
  visitorProfiles: 'VisitorProfiles',
  userJourneyMapping: 'TrafficAnalytics',
  localSEO: 'LocalSEO',
  contentStudio: 'ContentStudio',
  mediaOutreach: 'MediaOutreach',
  collaboration: 'Collaboration',
  mediaLibrary: 'MediaLibrary',
  accountingDashboard: 'AccountingDashboard',
  landingPageBuilder: 'LandingPageBuilder',
};

export const PAGE_FEATURE_MAP = Object.fromEntries(
  Object.entries(FEATURE_PAGE_MAP).map(([k, v]) => [v, k])
);
