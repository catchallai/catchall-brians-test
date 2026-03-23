import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Link2, Settings, FileText, MapPin, Globe, ArrowRight } from 'lucide-react';

const actions = [
  {
    page: 'Keywords',
    icon: Search,
    label: 'Keywords',
    description: 'Track rankings',
    gradient: 'from-violet-500 to-purple-600',
    bgHover: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
  },
  {
    page: 'Backlinks',
    icon: Link2,
    label: 'Backlinks',
    description: 'Monitor links',
    gradient: 'from-emerald-500 to-teal-600',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  {
    page: 'SEOAudit',
    icon: Settings,
    label: 'SEO Audit',
    description: 'Run analysis',
    gradient: 'from-amber-500 to-orange-600',
    bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
  {
    page: 'ContentStrategy',
    icon: FileText,
    label: 'Content',
    description: 'Plan strategy',
    gradient: 'from-blue-500 to-cyan-600',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  {
    page: 'Listings',
    icon: MapPin,
    label: 'Listings',
    description: 'Local SEO',
    gradient: 'from-pink-500 to-rose-600',
    bgHover: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
  },
  {
    page: 'SEOTools',
    icon: Globe,
    label: 'Tools',
    description: 'Advanced',
    gradient: 'from-indigo-500 to-blue-600',
    bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  },
];

export default function QuickActionsGrid({ keywords, backlinks }) {
  const getCount = (page) => {
    switch (page) {
      case 'Keywords':
        return keywords?.length || 0;
      case 'Backlinks':
        return backlinks?.length || 0;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {actions.map((action) => {
        const count = getCount(action.page);
        return (
          <Link key={action.page} to={createPageUrl(action.page)}>
            <div
              className={`group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 transition-all duration-300 ${action.bgHover} hover:shadow-md hover:border-transparent cursor-pointer`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {action.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {count !== null ? `${count} tracked` : action.description}
                  </p>
                </div>
              </div>

              {/* Hover arrow indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
