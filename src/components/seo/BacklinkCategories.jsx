import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  FileText,
  FolderOpen,
  MessageSquare,
  Newspaper,
  Users,
  Building2,
  Share2,
  BookOpen,
  Globe,
} from 'lucide-react';

const CATEGORY_PATTERNS = {
  blog: {
    patterns: ['blog', 'article', 'post', 'news', 'stories', 'insights', 'journal'],
    icon: FileText,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    bgColor: 'bg-blue-500',
  },
  directory: {
    patterns: ['directory', 'listing', 'yellowpages', 'yelp', 'bbb', 'manta', 'clutch', 'g2'],
    icon: FolderOpen,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    bgColor: 'bg-amber-500',
  },
  forum: {
    patterns: ['forum', 'community', 'discuss', 'reddit', 'quora', 'stackexchange', 'answers'],
    icon: MessageSquare,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    bgColor: 'bg-violet-500',
  },
  news: {
    patterns: ['news', 'press', 'media', 'times', 'post', 'herald', 'tribune', 'gazette'],
    icon: Newspaper,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    bgColor: 'bg-red-500',
  },
  social: {
    patterns: ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'pinterest', 'tiktok'],
    icon: Share2,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    bgColor: 'bg-pink-500',
  },
  partner: {
    patterns: ['partner', 'affiliate', 'sponsor', 'client', 'customer', 'testimonial'],
    icon: Users,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    bgColor: 'bg-emerald-500',
  },
  edu: {
    patterns: ['.edu', 'university', 'college', 'school', 'academy', 'institute', 'research'],
    icon: BookOpen,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    bgColor: 'bg-indigo-500',
  },
  gov: {
    patterns: ['.gov', 'government', 'federal', 'state.', 'city.', 'county.'],
    icon: Building2,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    bgColor: 'bg-slate-500',
  },
};

export default function BacklinkCategories({ backlinks, onFilterCategory }) {
  const categorizedBacklinks = useMemo(() => {
    const categories = {};

    backlinks.forEach((bl) => {
      const url = (bl.source_url || '').toLowerCase();
      const domain = (bl.source_domain || '').toLowerCase();
      let assigned = false;

      for (const [catName, catConfig] of Object.entries(CATEGORY_PATTERNS)) {
        if (catConfig.patterns.some((p) => url.includes(p) || domain.includes(p))) {
          if (!categories[catName]) {
            categories[catName] = { count: 0, backlinks: [], ...catConfig, name: catName };
          }
          categories[catName].count++;
          categories[catName].backlinks.push(bl);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        if (!categories['other']) {
          categories['other'] = {
            count: 0,
            backlinks: [],
            icon: Globe,
            color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
            bgColor: 'bg-gray-500',
            name: 'other',
          };
        }
        categories['other'].count++;
        categories['other'].backlinks.push(bl);
      }
    });

    return Object.entries(categories)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({ ...data, label: name.charAt(0).toUpperCase() + name.slice(1) }));
  }, [backlinks]);

  const total = backlinks.length;

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          Backlink Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categorizedBacklinks.map((cat, i) => {
            const Icon = cat.icon;
            const percentage = ((cat.count / total) * 100).toFixed(1);

            return (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => onFilterCategory && onFilterCategory(cat.name)}
              >
                <div className={`p-2 rounded-lg ${cat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{percentage}%</span>
                      <Badge variant="outline" className="text-xs">
                        {cat.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.bgColor} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
