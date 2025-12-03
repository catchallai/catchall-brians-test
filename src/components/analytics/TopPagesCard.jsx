import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Eye } from "lucide-react";

export default function TopPagesCard({ data }) {
  const topPages = data || [
    { path: '/', title: 'Homepage', views: 12450, avgTime: 145, bounceRate: 32 },
    { path: '/products', title: 'Products', views: 8230, avgTime: 210, bounceRate: 28 },
    { path: '/blog', title: 'Blog', views: 6120, avgTime: 320, bounceRate: 45 },
    { path: '/pricing', title: 'Pricing', views: 5890, avgTime: 180, bounceRate: 35 },
    { path: '/about', title: 'About Us', views: 3450, avgTime: 95, bounceRate: 52 },
    { path: '/contact', title: 'Contact', views: 2890, avgTime: 120, bounceRate: 25 },
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const maxViews = Math.max(...topPages.map(p => p.views));

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Top Pages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPages.map((page, index) => (
            <div key={page.path} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </span>
                      <div>
                        <a 
                          href={page.url || page.path} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          {page.title}
                        </a>
                        <p className="text-xs text-gray-400">{page.path}</p>
                      </div>
                    </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {page.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(page.avgTime)}
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all group-hover:from-blue-600 group-hover:to-cyan-600"
                  style={{ width: `${(page.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}