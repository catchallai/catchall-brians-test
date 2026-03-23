import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  Mail,
  Share2,
} from 'lucide-react';

export const WIDGET_TYPES = {
  // CRM Widgets
  CONTACTS_COUNT: {
    id: 'contacts_count',
    name: 'Total Contacts',
    category: 'CRM',
    icon: Users,
    description: 'Display total contact count',
    dataSource: 'contacts',
  },
  DEALS_VALUE: {
    id: 'deals_value',
    name: 'Pipeline Value',
    category: 'CRM',
    icon: DollarSign,
    description: 'Total value in pipeline',
    dataSource: 'deals',
  },
  CONVERSION_RATE: {
    id: 'conversion_rate',
    name: 'Conversion Rate',
    category: 'CRM',
    icon: TrendingUp,
    description: 'Lead to customer conversion',
    dataSource: 'contacts',
  },
  ACTIVITIES_TODAY: {
    id: 'activities_today',
    name: "Today's Activities",
    category: 'CRM',
    icon: Calendar,
    description: 'Activities scheduled for today',
    dataSource: 'activities',
  },

  // Sales Widgets
  REVENUE_CHART: {
    id: 'revenue_chart',
    name: 'Revenue Chart',
    category: 'Sales',
    icon: LineChart,
    description: 'Revenue over time',
    dataSource: 'deals',
  },
  DEALS_BY_STAGE: {
    id: 'deals_by_stage',
    name: 'Deals by Stage',
    category: 'Sales',
    icon: PieChart,
    description: 'Distribution of deals',
    dataSource: 'deals',
  },
  WON_DEALS: {
    id: 'won_deals',
    name: 'Won Deals',
    category: 'Sales',
    icon: Target,
    description: 'Closed won deals',
    dataSource: 'deals',
  },

  // SEO Widgets
  KEYWORD_RANKINGS: {
    id: 'keyword_rankings',
    name: 'Keyword Rankings',
    category: 'SEO',
    icon: BarChart3,
    description: 'Top ranking keywords',
    dataSource: 'keywords',
  },
  BACKLINKS_COUNT: {
    id: 'backlinks_count',
    name: 'Backlinks',
    category: 'SEO',
    icon: Activity,
    description: 'Total active backlinks',
    dataSource: 'backlinks',
  },
  SEO_SCORE: {
    id: 'seo_score',
    name: 'SEO Score',
    category: 'SEO',
    icon: TrendingUp,
    description: 'Average SEO score',
    dataSource: 'websites',
  },

  // Social Widgets
  SOCIAL_ENGAGEMENT: {
    id: 'social_engagement',
    name: 'Social Engagement',
    category: 'Social',
    icon: Share2,
    description: 'Total engagement metrics',
    dataSource: 'socialAccounts',
  },
  SCHEDULED_POSTS: {
    id: 'scheduled_posts',
    name: 'Scheduled Posts',
    category: 'Social',
    icon: Calendar,
    description: 'Upcoming social posts',
    dataSource: 'scheduledPosts',
  },

  // Marketing Widgets
  CAMPAIGN_PERFORMANCE: {
    id: 'campaign_performance',
    name: 'Campaign Performance',
    category: 'Marketing',
    icon: BarChart3,
    description: 'Active campaigns',
    dataSource: 'campaigns',
  },
  EMAIL_STATS: {
    id: 'email_stats',
    name: 'Email Statistics',
    category: 'Marketing',
    icon: Mail,
    description: 'Email campaign metrics',
    dataSource: 'emailCampaigns',
  },
};

export const getWidgetsByCategory = (category) => {
  return Object.values(WIDGET_TYPES).filter((w) => w.category === category);
};

export const getAllCategories = () => {
  return [...new Set(Object.values(WIDGET_TYPES).map((w) => w.category))];
};
