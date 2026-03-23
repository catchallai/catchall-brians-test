import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Users,
  Zap,
  Target as TargetIcon,
  TrendingUp,
  PenTool,
  Search,
  BarChart3,
  Radio,
  Users2,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIDashboard() {
  const aiFeatures = [
    {
      title: 'AI Lead Generator',
      description: 'Discover and enrich leads automatically with AI-powered prospecting',
      icon: Users,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600',
      features: ['Lead Discovery', 'Data Enrichment', 'Lead Scoring', 'CRM Integration'],
      page: 'VisitorProfiles',
    },
    {
      title: 'Content Writer',
      description: 'Generate SEO-optimized content, blogs, and social posts',
      icon: PenTool,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
      features: ['Blog Generation', 'SEO Content', 'Social Posts', 'Ad Copy'],
      page: 'ContentStudio',
    },
    {
      title: 'Competitor Analysis',
      description: 'Deep competitor insights with AI-powered market intelligence',
      icon: Users2,
      color: 'violet',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20',
      iconColor: 'text-violet-600',
      features: ['Market Analysis', 'Strategy Insights', 'Trend Prediction', 'News Monitoring'],
      page: 'CompetitorAnalysis',
    },
    {
      title: 'SEO Optimizer',
      description: 'AI-powered SEO audits, gap analysis, and recommendations',
      icon: Search,
      color: 'indigo',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600',
      features: ['Technical Audits', 'Keyword Research', 'Gap Analysis', 'Backlink Discovery'],
      page: 'SEOTools',
    },
    {
      title: 'Content Optimizer',
      description: 'Optimize content for better engagement and conversions',
      icon: Zap,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600',
      features: ['A/B Testing', 'Performance Analysis', 'Content Scoring', 'Recommendations'],
      page: 'ContentStudio',
    },
    {
      title: 'Web Creator',
      description: 'Generate complete responsive websites with AI',
      icon: Globe,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      features: ['Website Generation', 'Responsive Design', 'SEO Ready', 'Code Export'],
      page: 'SEOTools',
    },
    {
      title: 'Social Listening',
      description: 'Monitor brand mentions and sentiment across social media',
      icon: Radio,
      color: 'pink',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      iconColor: 'text-pink-600',
      features: ['Mention Tracking', 'Sentiment Analysis', 'Trend Detection', 'Alerts'],
      page: 'SocialListening',
    },
    {
      title: 'Analytics & Reports',
      description: 'AI-generated insights and automated reporting',
      icon: BarChart3,
      color: 'cyan',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      iconColor: 'text-cyan-600',
      features: ['Auto Reports', 'Data Insights', 'Trend Analysis', 'Predictions'],
      page: 'Reports',
    },
  ];

  const stats = [
    { label: 'AI Features', value: '25+', icon: Sparkles },
    { label: 'Automations', value: '100+', icon: Zap },
    { label: 'Integrations', value: '50+', icon: TargetIcon },
    { label: 'ROI Increase', value: '247%', icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-10 h-10 text-violet-600" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI-Powered Tools</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Supercharge your business with cutting-edge AI features designed to automate, optimize,
          and scale your operations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="text-center">
              <CardContent className="pt-6">
                <Icon className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Why Choose AI-Powered Tools */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Why Choose AI-Powered Tools?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">10x Faster</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete tasks in minutes that used to take hours
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                <TargetIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Higher Accuracy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-driven insights eliminate guesswork and boost ROI
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Always Learning</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI continuously improves and adapts to your needs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiFeatures.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <Badge className="bg-violet-100 text-violet-700 text-xs">AI</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {feature.features.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                      {item}
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl(feature.page)}>
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    Launch Feature →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
