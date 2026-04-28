import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Target,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';

export default function ContentOptimizationCard({ data }) {
  const [expandedPage, setExpandedPage] = useState(null);

  const pages = data?.pages || [
    {
      url: '/blog/seo-guide-2025',
      title: 'Complete SEO Guide 2025',
      score: 78,
      targetKeyword: 'seo guide',
      keywordDensity: 1.8,
      wordCount: 2450,
      readability: 'Good',
      issues: [
        { type: 'warning', message: 'Meta description too short (120 chars, recommended 150-160)' },
        { type: 'info', message: 'Consider adding more internal links (currently 3)' },
      ],
      suggestions: [
        'Add target keyword to H2 headings',
        'Include more LSI keywords: "search engine optimization", "ranking factors"',
        'Add an FAQ section for featured snippet opportunity',
      ],
    },
    {
      url: '/features',
      title: 'Features - Our Platform',
      score: 65,
      targetKeyword: 'marketing platform',
      keywordDensity: 0.8,
      wordCount: 890,
      readability: 'Easy',
      issues: [
        { type: 'critical', message: 'Missing H1 tag' },
        { type: 'warning', message: 'Low keyword density (0.8%, recommended 1-2%)' },
        { type: 'warning', message: 'No alt text on 4 images' },
      ],
      suggestions: [
        'Add a compelling H1 with target keyword',
        'Expand content to 1500+ words',
        'Add descriptive alt text to all images',
        'Include customer testimonials or case studies',
      ],
    },
    {
      url: '/pricing',
      title: 'Pricing Plans',
      score: 82,
      targetKeyword: 'pricing',
      keywordDensity: 2.1,
      wordCount: 1200,
      readability: 'Very Easy',
      issues: [{ type: 'info', message: 'Consider adding FAQ schema for pricing questions' }],
      suggestions: ['Add comparison table with competitors', 'Include pricing calculator widget'],
    },
  ];

  const overallStats = {
    avgScore: Math.round(pages.reduce((sum, p) => sum + p.score, 0) / pages.length),
    totalIssues: pages.reduce((sum, p) => sum + p.issues.length, 0),
    optimizedPages: pages.filter((p) => p.score >= 80).length,
    needsWork: pages.filter((p) => p.score < 60).length,
  };

  const getScoreColor = (score) => {
    if (score >= 80) {
      return 'text-emerald-600 dark:text-emerald-400';
    }
    if (score >= 60) {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) {
      return 'bg-emerald-100 dark:bg-emerald-900/30';
    }
    if (score >= 60) {
      return 'bg-amber-100 dark:bg-amber-900/30';
    }
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Content Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {overallStats.avgScore}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {overallStats.totalIssues}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Issues</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {overallStats.optimizedPages}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Optimized</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overallStats.needsWork}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Needs Work</p>
          </div>
        </div>

        {/* Pages List */}
        <div className="space-y-2">
          {pages.map((page, idx) => (
            <div
              key={idx}
              className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedPage(expandedPage === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-lg ${getScoreBg(page.score)} flex items-center justify-center`}
                  >
                    <span className={`text-lg font-bold ${getScoreColor(page.score)}`}>
                      {page.score}
                    </span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {page.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{page.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge variant="outline" className="text-xs dark:border-gray-600">
                      <Target className="w-3 h-3 mr-1" />
                      {page.targetKeyword}
                    </Badge>
                    <Badge variant="outline" className="text-xs dark:border-gray-600">
                      {page.wordCount} words
                    </Badge>
                  </div>
                  {page.issues.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {page.issues.length} issues
                    </Badge>
                  )}
                  {expandedPage === idx ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {expandedPage === idx && (
                <div className="p-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {page.keywordDensity}%
                      </p>
                      <p className="text-xs text-gray-500">Keyword Density</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {page.wordCount}
                      </p>
                      <p className="text-xs text-gray-500">Word Count</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {page.readability}
                      </p>
                      <p className="text-xs text-gray-500">Readability</p>
                    </div>
                  </div>

                  {/* Issues */}
                  {page.issues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Issues
                      </p>
                      <div className="space-y-1">
                        {page.issues.map((issue, iIdx) => (
                          <div key={iIdx} className="flex items-start gap-2 text-sm">
                            <AlertCircle
                              className={`w-4 h-4 mt-0.5 ${
                                issue.type === 'critical'
                                  ? 'text-red-500'
                                  : issue.type === 'warning'
                                    ? 'text-amber-500'
                                    : 'text-blue-500'
                              }`}
                            />
                            <span className="text-gray-600 dark:text-gray-400">
                              {issue.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Optimization Suggestions
                    </p>
                    <div className="space-y-1">
                      {page.suggestions.map((suggestion, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500" />
                          <span className="text-gray-600 dark:text-gray-400">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
