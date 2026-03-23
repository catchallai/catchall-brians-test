import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Maximize2,
  Type,
  MousePointer,
  Zap,
  Eye,
} from 'lucide-react';

const statusStyles = {
  pass: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
};

export default function MobileFriendlinessCard({ data }) {
  const mobileData = data || {
    overallScore: 85,
    status: 'pass',
    viewport: { status: 'pass', message: 'Viewport meta tag configured correctly' },
    fontSizes: { status: 'pass', message: 'Text is readable without zooming', smallText: 0 },
    tapTargets: { status: 'warning', message: '3 tap targets are too close together', issues: 3 },
    contentWidth: { status: 'pass', message: 'Content fits within viewport' },
    mobileSpeed: {
      status: 'warning',
      score: 72,
      lcp: 3.2,
      fid: 120,
      cls: 0.15,
    },
    responsiveImages: {
      status: 'pass',
      message: 'Images are properly sized',
      optimized: 45,
      total: 48,
    },
    touchFriendly: { status: 'pass', message: 'Forms and inputs are mobile-friendly' },
  };

  const checks = [
    {
      id: 'viewport',
      label: 'Viewport Configuration',
      icon: Maximize2,
      status: mobileData.viewport.status,
      message: mobileData.viewport.message,
    },
    {
      id: 'fonts',
      label: 'Font Sizes',
      icon: Type,
      status: mobileData.fontSizes.status,
      message: mobileData.fontSizes.message,
      detail:
        mobileData.fontSizes.smallText > 0
          ? `${mobileData.fontSizes.smallText} elements too small`
          : null,
    },
    {
      id: 'tap',
      label: 'Tap Targets',
      icon: MousePointer,
      status: mobileData.tapTargets.status,
      message: mobileData.tapTargets.message,
      detail:
        mobileData.tapTargets.issues > 0 ? `${mobileData.tapTargets.issues} issues found` : null,
    },
    {
      id: 'content',
      label: 'Content Width',
      icon: Eye,
      status: mobileData.contentWidth.status,
      message: mobileData.contentWidth.message,
    },
    {
      id: 'images',
      label: 'Responsive Images',
      icon: Eye,
      status: mobileData.responsiveImages.status,
      message: mobileData.responsiveImages.message,
      detail: `${mobileData.responsiveImages.optimized}/${mobileData.responsiveImages.total} optimized`,
    },
  ];

  const getScoreColor = (score) => {
    if (score >= 90) {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    if (score >= 70) {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          Mobile-Friendliness Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${mobileData.overallScore * 2.51} 251`}
                className={getScoreColor(mobileData.overallScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(mobileData.overallScore)}`}>
                {mobileData.overallScore}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {mobileData.overallScore >= 90
                ? 'Excellent Mobile Experience'
                : mobileData.overallScore >= 70
                  ? 'Good Mobile Experience'
                  : 'Needs Improvement'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your site is{' '}
              {mobileData.overallScore >= 70
                ? 'mobile-friendly'
                : 'not optimized for mobile devices'}
              .{mobileData.overallScore < 90 && ' Some improvements can enhance user experience.'}
            </p>
            <Badge
              className={`mt-2 ${statusStyles[mobileData.status].bg} ${statusStyles[mobileData.status].color.replace('text-', 'text-')}`}
            >
              {mobileData.status === 'pass' ? 'Mobile-Friendly' : 'Issues Found'}
            </Badge>
          </div>
        </div>

        {/* Mobile Speed */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-gray-900 dark:text-white">Mobile Page Speed</span>
            </div>
            <span className={`font-bold ${getScoreColor(mobileData.mobileSpeed.score)}`}>
              {mobileData.mobileSpeed.score}/100
            </span>
          </div>
          <Progress value={mobileData.mobileSpeed.score} className="h-2 mb-3" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {mobileData.mobileSpeed.lcp}s
              </p>
              <p className="text-xs text-gray-500">LCP</p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {mobileData.mobileSpeed.fid}ms
              </p>
              <p className="text-xs text-gray-500">FID</p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {mobileData.mobileSpeed.cls}
              </p>
              <p className="text-xs text-gray-500">CLS</p>
            </div>
          </div>
        </div>

        {/* Individual Checks */}
        <div className="space-y-2">
          {checks.map((check) => {
            const StatusIcon = statusStyles[check.status].icon;
            return (
              <div
                key={check.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className={`p-1.5 rounded-lg ${statusStyles[check.status].bg}`}>
                  <check.icon className={`w-4 h-4 ${statusStyles[check.status].color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {check.label}
                    </span>
                    <StatusIcon className={`w-4 h-4 ${statusStyles[check.status].color}`} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{check.message}</p>
                  {check.detail && (
                    <Badge variant="outline" className="text-xs mt-1 dark:border-gray-600">
                      {check.detail}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
