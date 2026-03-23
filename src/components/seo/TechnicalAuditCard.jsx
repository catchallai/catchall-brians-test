import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileSearch,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link2,
  Smartphone,
  Clock,
  FileText,
  Bot,
  ChevronDown,
  ChevronUp,
  Wrench,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const issueCategories = {
  broken_links: { icon: Link2, label: 'Broken Links', color: 'text-red-500' },
  page_speed: { icon: Clock, label: 'Page Speed', color: 'text-amber-500' },
  mobile: { icon: Smartphone, label: 'Mobile-Friendliness', color: 'text-blue-500' },
  sitemap: { icon: FileText, label: 'Sitemap', color: 'text-purple-500' },
  robots: { icon: Bot, label: 'Robots.txt', color: 'text-gray-500' },
  meta: { icon: FileSearch, label: 'Meta Tags', color: 'text-emerald-500' },
  security: { icon: Wrench, label: 'Security', color: 'text-pink-500' },
};

const severityConfig = {
  critical: { color: 'bg-red-100 text-red-700', label: 'Critical' },
  warning: { color: 'bg-amber-100 text-amber-700', label: 'Warning' },
  info: { color: 'bg-blue-100 text-blue-700', label: 'Info' },
  passed: { color: 'bg-emerald-100 text-emerald-700', label: 'Passed' },
};

export default function TechnicalAuditCard({ website, onAuditComplete, onAuditSaved }) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState(website.technical_audit_data || null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const runAudit = async () => {
    setIsAuditing(true);

    const results = await base44.integrations.Core.InvokeLLM({
      prompt: `Perform a comprehensive technical SEO audit for this website: ${website.url}
      Website name: ${website.name}

      Analyze the following aspects and provide detailed findings:

      1. BROKEN LINKS: Check for any broken internal/external links
      2. PAGE SPEED: Analyze load time, render-blocking resources, image optimization
      3. MOBILE-FRIENDLINESS: Responsive design, touch targets, viewport settings
      4. SITEMAP: Check if sitemap.xml exists and is valid
      5. ROBOTS.TXT: Verify robots.txt configuration
      6. META TAGS: Title tags, meta descriptions, Open Graph tags
      7. SECURITY: HTTPS, mixed content, security headers

      For each issue found, provide:
      - The specific issue
      - Why it matters for SEO
      - How to fix it (actionable recommendation)
      - Severity (critical, warning, info)

      Also provide an overall technical SEO score (0-100).`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          summary: { type: 'string' },
          categories: {
            type: 'object',
            properties: {
              broken_links: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
              page_speed: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  metrics: {
                    type: 'object',
                    properties: {
                      estimated_load_time: { type: 'string' },
                      first_contentful_paint: { type: 'string' },
                      largest_contentful_paint: { type: 'string' },
                    },
                  },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
              mobile: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
              sitemap: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  sitemap_url: { type: 'string' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
              robots: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
              security: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  score: { type: 'number' },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue: { type: 'string' },
                        impact: { type: 'string' },
                        recommendation: { type: 'string' },
                        severity: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          priority_fixes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                issue: { type: 'string' },
                recommendation: { type: 'string' },
                estimated_impact: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setAuditResults(results);
    setIsAuditing(false);

    // Save audit results to database
    await base44.entities.Website.update(website.id, {
      technical_audit_data: results,
      technical_audit_score: results.overall_score,
      last_audit_date: new Date().toISOString(),
    });

    if (onAuditSaved) {
      onAuditSaved();
    }

    if (onAuditComplete) {
      onAuditComplete(results);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) {
      return 'text-emerald-500';
    }
    if (score >= 60) {
      return 'text-amber-500';
    }
    return 'text-red-500';
  };

  const getStatusIcon = (status) => {
    if (status === 'passed' || status === 'good') {
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
    if (status === 'warning' || status === 'needs_improvement') {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const countIssues = (severity) => {
    if (!auditResults?.categories) {
      return 0;
    }
    let count = 0;
    Object.values(auditResults.categories).forEach((cat) => {
      if (cat.issues) {
        count += cat.issues.filter((i) => i.severity === severity).length;
      }
    });
    return count;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-violet-500" />
            <CardTitle className="text-base">Technical SEO Audit</CardTitle>
          </div>
          <Button
            onClick={runAudit}
            disabled={isAuditing}
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                Run Audit
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">{website.url}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!auditResults && !isAuditing && (
          <div className="text-center py-8 text-gray-500">
            <FileSearch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Click "Run Audit" to analyze technical SEO</p>
            <p className="text-xs mt-1">Checks broken links, speed, mobile, sitemap & more</p>
          </div>
        )}

        {isAuditing && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-violet-500 mb-3" />
            <p className="text-gray-600">Analyzing {website.name}...</p>
            <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
          </div>
        )}

        {auditResults && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`text-4xl font-bold ${getScoreColor(auditResults.overall_score)}`}>
                {auditResults.overall_score}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Technical SEO Score</p>
                <Progress value={auditResults.overall_score} className="h-2 mt-1" />
              </div>
            </div>

            {/* Issue Summary */}
            <div className="flex gap-3">
              <Badge className="bg-red-100 text-red-700 gap-1">
                <XCircle className="w-3 h-3" />
                {countIssues('critical')} Critical
              </Badge>
              <Badge className="bg-amber-100 text-amber-700 gap-1">
                <AlertTriangle className="w-3 h-3" />
                {countIssues('warning')} Warnings
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 gap-1">{countIssues('info')} Info</Badge>
            </div>

            {/* Summary */}
            {auditResults.summary && (
              <p className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                {auditResults.summary}
              </p>
            )}

            {/* Categories */}
            <div className="space-y-2">
              {Object.entries(auditResults.categories || {}).map(([key, category]) => {
                const config = issueCategories[key];
                if (!config) {
                  return null;
                }
                const Icon = config.icon;
                const isExpanded = expandedCategories[key];
                const hasIssues = category.issues?.length > 0;

                return (
                  <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleCategory(key)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="font-medium text-gray-900">{config.label}</span>
                          {getStatusIcon(category.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasIssues && (
                            <Badge variant="outline" className="text-xs">
                              {category.issues.length} issues
                            </Badge>
                          )}
                          <span className={`font-semibold ${getScoreColor(category.score)}`}>
                            {category.score}/100
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2 pl-4">
                        {category.metrics && (
                          <div className="p-2 bg-gray-50 rounded text-sm grid grid-cols-3 gap-2">
                            {Object.entries(category.metrics).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-gray-500 text-xs">
                                  {k.replace(/_/g, ' ')}
                                </span>
                                <p className="font-medium">{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {category.issues?.map((issue, idx) => (
                          <div key={idx} className="p-3 bg-white border rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-gray-900 text-sm">{issue.issue}</p>
                              <Badge
                                className={severityConfig[issue.severity]?.color || 'bg-gray-100'}
                              >
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{issue.impact}</p>
                            <div className="mt-2 p-2 bg-emerald-50 rounded text-sm">
                              <span className="font-medium text-emerald-700">Fix: </span>
                              <span className="text-emerald-600">{issue.recommendation}</span>
                            </div>
                          </div>
                        ))}
                        {(!category.issues || category.issues.length === 0) && (
                          <p className="text-sm text-emerald-600 p-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            No issues found
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            {/* Priority Fixes */}
            {auditResults.priority_fixes?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  Priority Fixes
                </h4>
                <div className="space-y-2">
                  {auditResults.priority_fixes.slice(0, 5).map((fix, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-amber-700 uppercase">
                          {fix.category}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {fix.estimated_impact}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{fix.issue}</p>
                      <p className="text-sm text-gray-600 mt-1">{fix.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
