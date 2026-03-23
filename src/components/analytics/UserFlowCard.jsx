import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, LogIn, LogOut } from 'lucide-react';

export default function UserFlowCard({ data }) {
  // SyberJet user flow data
  const entryPages = data?.entry || [
    { path: '/', percentage: 42 },
    { path: '/sj30i', percentage: 28 },
    { path: '/performance', percentage: 18 },
    { path: '/interior', percentage: 12 },
  ];

  const exitPages = data?.exit || [
    { path: '/contact', percentage: 35 },
    { path: '/ownership', percentage: 25 },
    { path: '/sj30i', percentage: 22 },
    { path: '/performance', percentage: 18 },
  ];

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-emerald-500" />
          User Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Entry Pages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogIn className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entry Pages
              </span>
            </div>
            <div className="space-y-2">
              {entryPages.map((page) => (
                <div key={page.path} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                    {page.path}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${page.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">
                      {page.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exit Pages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LogOut className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Exit Pages
              </span>
            </div>
            <div className="space-y-2">
              {exitPages.map((page) => (
                <div key={page.path} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                    {page.path}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${page.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">
                      {page.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
