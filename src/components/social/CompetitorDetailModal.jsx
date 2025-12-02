import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, Calendar, Target, ExternalLink, Users, 
  CheckCircle, AlertTriangle, BarChart3, Clock, FileText, Loader2
} from "lucide-react";

export default function CompetitorDetailModal({ 
  open, 
  onClose, 
  competitor, 
  reports = [],
  onGenerateReport,
  isGenerating,
  onViewReport
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
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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

          {/* Recent Reports */}
          {reports.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports.slice(0, 3).map((report) => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => onViewReport(report)}
                    >
                      <div>
                        <Badge className={report.report_type === 'weekly' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'} variant="outline">
                          {report.report_type}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-600">
                          {report.period_start} - {report.period_end}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}