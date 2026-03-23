import { Globe, Search, Link2, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

export default function SEOOverviewStats({ websites, keywords, backlinks }) {
  // Normalize SEO scores - handle both 0-1 and 0-100 formats
  const normalizeScore = (score) => {
    if (!score) {
      return 0;
    }
    if (score > 0 && score <= 1) {
      return Math.round(score * 100);
    }
    return Math.round(score);
  };

  const totalTraffic = websites.reduce((sum, w) => sum + (w.organic_traffic || 0), 0);
  const avgDa =
    websites.length > 0
      ? Math.round(
          websites.reduce((sum, w) => sum + (w.domain_authority || 0), 0) / websites.length
        )
      : 0;
  const avgSeoScore =
    websites.length > 0
      ? Math.round(
          websites.reduce((sum, w) => sum + normalizeScore(w.seo_score), 0) / websites.length
        )
      : 0;
  const top10Keywords = keywords.filter(
    (k) => k.current_position && k.current_position <= 10
  ).length;
  const activeBacklinks = backlinks.filter((b) => b.status === 'active').length;

  const formatNumber = (num) => {
    if (!num) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    {
      label: 'Websites',
      value: websites.length,
      subValue: avgDa,
      subLabel: 'Avg DA',
      icon: Globe,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      trend: avgDa > 30 ? 'up' : null,
    },
    {
      label: 'Keywords',
      value: keywords.length,
      subValue: top10Keywords,
      subLabel: 'Top 10',
      icon: Search,
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50 dark:bg-violet-900/20',
      trend: top10Keywords > 0 ? 'up' : null,
    },
    {
      label: 'Backlinks',
      value: backlinks.length,
      subValue: activeBacklinks,
      subLabel: 'Active',
      icon: Link2,
      gradient: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      trend: activeBacklinks > backlinks.length * 0.8 ? 'up' : null,
    },
    {
      label: 'Est. Traffic',
      value: formatNumber(totalTraffic),
      subValue: avgSeoScore,
      subLabel: 'SEO Score',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      trend: avgSeoScore > 60 ? 'up' : avgSeoScore > 0 ? 'down' : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300"
        >
          {/* Gradient accent */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />

          <div className="flex items-start justify-between">
            <div
              className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            {stat.trend && (
              <div
                className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </div>

          <div
            className={`mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${stat.bgLight}`}
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {stat.subValue}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{stat.subLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
