import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Target, Search, Mail, Calendar, FileText, Sparkles, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actions = [
  {
    label: 'Add Contact',
    icon: UserPlus,
    page: 'Contacts',
    color:
      'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50',
  },
  {
    label: 'Create Deal',
    icon: Target,
    page: 'Deals',
    color:
      'text-violet-600 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30 dark:hover:bg-violet-900/50',
  },
  {
    label: 'Run SEO Audit',
    icon: Search,
    page: 'SEOAudit',
    color:
      'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50',
  },
  {
    label: 'Send Email',
    icon: Mail,
    page: 'EmailMarketing',
    color:
      'text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:hover:bg-amber-900/50',
  },
  {
    label: 'Schedule Post',
    icon: Calendar,
    page: 'SocialCalendar',
    color:
      'text-pink-600 bg-pink-50 hover:bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30 dark:hover:bg-pink-900/50',
  },
  {
    label: 'View Reports',
    icon: FileText,
    page: 'Reports',
    color:
      'text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50',
  },
  {
    label: 'Social Listening',
    icon: Radio,
    page: 'SocialListening',
    color:
      'text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50',
  },
  {
    label: 'AI Analysis',
    icon: Sparkles,
    page: 'SEODashboard',
    color:
      'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50',
  },
];

export default function QuickActions() {
  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <Link key={action.label} to={createPageUrl(action.page)}>
              <Button
                variant="ghost"
                className={`w-full h-auto py-3 flex flex-col gap-1.5 ${action.color} transition-colors`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
