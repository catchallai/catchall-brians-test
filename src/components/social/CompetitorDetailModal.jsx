import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Calendar, Target, ExternalLink, Users, 
  CheckCircle, AlertTriangle, BarChart3, Clock, FileText, Loader2,
  Newspaper, Sparkles, GitCompare
} from "lucide-react";
import CompetitorInsightsPanel from './CompetitorInsightsPanel';
import ComparativeReportCard from './ComparativeReportCard';

export default function CompetitorDetailModal({ 
  open, 
  onClose, 
  competitor, 
  reports = [],
  onGenerateReport,
  isGenerating,
  onViewReport,
  onScanNews,
  isScanningNews,
  onDeepAnalyze,
  isDeepAnalyzing,
  yourBrandName
}) {
  if (!competitor) return null;

  const totalFollowers = competitor.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
  const avgEngagement = competitor.social_accounts?.length > 0
    ? (competitor.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / competitor.social_accounts.length).toFixed(1)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="text-xl">{competitor.name}</span>
              {competitor.website && (
                <a 
                  href={competitor.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-sm text-gray-400 hover:text-violet-600 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onScanNews}
                disabled={isScanningNews}
                className="gap-1"
              >
                {isScanningNews ? <Loader2 className="w-3 h-3 animate-spin" /> : <Newspaper className="w-3 h-3" />}
                Scan News
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDeepAnalyze}
                disabled={isDeepAnalyzing}
                className="gap-1"
              >
                {isDeepAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Deep Analyze
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center border-0 bg-violet-50">
              <Users className="w-5 h-5 text-violet-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">
                {totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(1)}K` : totalFollowers}
              </p>
              <p className="text-xs text-gray-500">Total Followers</p>
            </Card>
            <Card className="p-3 text-center border-0 bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-600">{avgEngagement}%</p>
              <p className="text-xs text-gray-500">Avg Engagement</p>
            </Card>
            <Card className="p-3 text-center border-0 bg-blue-50">
              <BarChart3 className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{competitor.social_accounts?.length || 0}</p>
              <p className="text-xs text-gray-500">Platforms</p>
            </Card>
          </div>

          {/* Social Accounts */}
          {competitor.social_accounts?.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Social Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {competitor.social_accounts.map((acc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <Badge variant="outline" className="text-xs capitalize mb-1">{acc.platform}</Badge>
                        <p className="text-sm font-medium">@{acc.handle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{(acc.followers || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{acc.engagement_rate || 0}% eng</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            {competitor.strengths?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {competitor.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {competitor.weaknesses?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {competitor.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Strategy Evolution */}
          {competitor.strategy_evolution?.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  Strategy Evolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-3">
                    {competitor.strategy_evolution.map((phase, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute left-0 w-4 h-4 rounded-full bg-violet-100 border-2 border-violet-500" />
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{phase.period}</span>
                            <Badge variant="outline" className="text-xs">{phase.performance}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{phase.focus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Successful Campaigns */}
          {competitor.successful_campaigns?.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Successful Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {competitor.successful_campaigns.map((campaign, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{campaign.name}</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">{campaign.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Est. reach: {campaign.estimated_reach?.toLocaleString() || 'N/A'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {campaign.key_elements?.map((element, j) => (
                        <Badge key={j} variant="outline" className="text-xs">{element}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Content Frequency */}
          {competitor.content_frequency && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Posting Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{competitor.content_frequency.posts_per_week || 0}</p>
                    <p className="text-xs text-gray-500">Posts/Week</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Best Days</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.content_frequency.best_days?.map((day, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{day}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <CompetitorInsightsPanel competitor={competitor} />
            </TabsContent>

            <TabsContent value="compare" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  onClick={() => onGenerateReport('comparative')}
                  disabled={isGenerating}
                  className="gap-1 bg-violet-600 hover:bg-violet-700"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitCompare className="w-3 h-3" />}
                  Generate Comparison
                </Button>
              </div>
              {reports.filter(r => r.report_type === 'comparative').length > 0 ? (
                reports.filter(r => r.report_type === 'comparative').slice(0, 1).map((report) => (
                  <ComparativeReportCard 
                    key={report.id}
                    report={report} 
                    yourBrandName={yourBrandName}
                    competitorName={competitor?.name}
                  />
                ))
              ) : (
                <Card className="p-8 text-center border border-gray-200 dark:border-gray-700">
                  <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No comparison reports yet</p>
                  <p className="text-sm text-gray-400">Generate a comparison to see how you stack up</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateReport('daily')}
                  disabled={isGenerating}
                  className="gap-1"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                  Daily Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateReport('weekly')}
                  disabled={isGenerating}
                  className="gap-1"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  Weekly Report
                </Button>
              </div>
              {reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => onViewReport(report)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={
                          report.report_type === 'weekly' ? 'bg-violet-100 text-violet-700' : 
                          report.report_type === 'comparative' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {report.report_type}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {report.period_start} - {report.period_end}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border border-gray-200 dark:border-gray-700">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reports generated yet</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}