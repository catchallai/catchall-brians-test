import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  FileSearch,
  Lock,
  Server,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

const statusIcon = {
  pass: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  fail: <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
};

const statusBadge = {
  pass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  fail: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function TechnicalSEOCard({ data }) {
  const checks = data || {
    crawlability: {
      status: 'pass',
      robotsTxt: { exists: true, valid: true },
      sitemapXml: { exists: true, urls: 245, lastMod: '2025-01-10' },
      blockedResources: 3,
      crawlErrors: 2,
    },
    indexability: {
      status: 'warning',
      indexedPages: 189,
      totalPages: 245,
      noindexPages: 12,
      canonicalIssues: 5,
      duplicateContent: 8,
    },
    siteSpeed: {
      status: 'warning',
      lcp: { value: 2.8, unit: 's', status: 'warning' },
      fid: { value: 45, unit: 'ms', status: 'pass' },
      cls: { value: 0.12, unit: '', status: 'warning' },
      ttfb: { value: 0.6, unit: 's', status: 'pass' },
      overallScore: 72,
    },
    security: {
      status: 'pass',
      https: true,
      mixedContent: false,
      securityHeaders: { score: 85, missing: ['Content-Security-Policy'] },
    },
    serverHealth: {
      status: 'pass',
      uptime: 99.9,
      responseTime: 245,
      gzipEnabled: true,
      http2Enabled: true,
    },
  };

  const sections = [
    {
      id: 'crawlability',
      title: 'Crawlability',
      icon: Bot,
      data: checks.crawlability,
      details: [
        {
          label: 'robots.txt',
          value: checks.crawlability.robotsTxt.exists ? 'Valid' : 'Missing',
          status: checks.crawlability.robotsTxt.exists ? 'pass' : 'fail',
        },
        {
          label: 'Sitemap',
          value: `${checks.crawlability.sitemapXml.urls} URLs`,
          status: checks.crawlability.sitemapXml.exists ? 'pass' : 'fail',
        },
        {
          label: 'Blocked Resources',
          value: checks.crawlability.blockedResources,
          status: checks.crawlability.blockedResources > 5 ? 'warning' : 'pass',
        },
        {
          label: 'Crawl Errors',
          value: checks.crawlability.crawlErrors,
          status: checks.crawlability.crawlErrors > 0 ? 'warning' : 'pass',
        },
      ],
    },
    {
      id: 'indexability',
      title: 'Indexability',
      icon: FileSearch,
      data: checks.indexability,
      details: [
        {
          label: 'Indexed Pages',
          value: `${checks.indexability.indexedPages}/${checks.indexability.totalPages}`,
          status:
            checks.indexability.indexedPages < checks.indexability.totalPages * 0.8
              ? 'warning'
              : 'pass',
        },
        {
          label: 'Noindex Pages',
          value: checks.indexability.noindexPages,
          status: checks.indexability.noindexPages > 10 ? 'warning' : 'pass',
        },
        {
          label: 'Canonical Issues',
          value: checks.indexability.canonicalIssues,
          status: checks.indexability.canonicalIssues > 0 ? 'warning' : 'pass',
        },
        {
          label: 'Duplicate Content',
          value: checks.indexability.duplicateContent,
          status: checks.indexability.duplicateContent > 5 ? 'warning' : 'pass',
        },
      ],
    },
    {
      id: 'speed',
      title: 'Site Speed (Core Web Vitals)',
      icon: Zap,
      data: checks.siteSpeed,
      details: [
        {
          label: 'LCP',
          value: `${checks.siteSpeed.lcp.value}${checks.siteSpeed.lcp.unit}`,
          status: checks.siteSpeed.lcp.status,
          hint: 'Largest Contentful Paint',
        },
        {
          label: 'FID',
          value: `${checks.siteSpeed.fid.value}${checks.siteSpeed.fid.unit}`,
          status: checks.siteSpeed.fid.status,
          hint: 'First Input Delay',
        },
        {
          label: 'CLS',
          value: checks.siteSpeed.cls.value,
          status: checks.siteSpeed.cls.status,
          hint: 'Cumulative Layout Shift',
        },
        {
          label: 'TTFB',
          value: `${checks.siteSpeed.ttfb.value}${checks.siteSpeed.ttfb.unit}`,
          status: checks.siteSpeed.ttfb.status,
          hint: 'Time to First Byte',
        },
      ],
      score: checks.siteSpeed.overallScore,
    },
    {
      id: 'security',
      title: 'Security',
      icon: Lock,
      data: checks.security,
      details: [
        {
          label: 'HTTPS',
          value: checks.security.https ? 'Enabled' : 'Disabled',
          status: checks.security.https ? 'pass' : 'fail',
        },
        {
          label: 'Mixed Content',
          value: checks.security.mixedContent ? 'Found' : 'None',
          status: checks.security.mixedContent ? 'fail' : 'pass',
        },
        {
          label: 'Security Headers',
          value: `${checks.security.securityHeaders.score}%`,
          status: checks.security.securityHeaders.score >= 80 ? 'pass' : 'warning',
        },
      ],
    },
    {
      id: 'server',
      title: 'Server Health',
      icon: Server,
      data: checks.serverHealth,
      details: [
        {
          label: 'Uptime',
          value: `${checks.serverHealth.uptime}%`,
          status: checks.serverHealth.uptime >= 99.5 ? 'pass' : 'warning',
        },
        {
          label: 'Response Time',
          value: `${checks.serverHealth.responseTime}ms`,
          status: checks.serverHealth.responseTime < 500 ? 'pass' : 'warning',
        },
        {
          label: 'GZIP',
          value: checks.serverHealth.gzipEnabled ? 'Enabled' : 'Disabled',
          status: checks.serverHealth.gzipEnabled ? 'pass' : 'warning',
        },
        {
          label: 'HTTP/2',
          value: checks.serverHealth.http2Enabled ? 'Enabled' : 'Disabled',
          status: checks.serverHealth.http2Enabled ? 'pass' : 'warning',
        },
      ],
    },
  ];

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          Technical SEO Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
              </div>
              <Badge className={statusBadge[section.data.status]}>
                {section.data.status === 'pass'
                  ? 'Passed'
                  : section.data.status === 'fail'
                    ? 'Failed'
                    : 'Needs Attention'}
              </Badge>
            </div>

            {section.score !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Performance Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {section.score}/100
                  </span>
                </div>
                <Progress value={section.score} className="h-2" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {section.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon[detail.status]}
                    <span className="text-sm text-gray-600 dark:text-gray-300" title={detail.hint}>
                      {detail.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
