import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LinkedInIcon, TwitterIcon } from '@/components/icons/BrandIcons';
import {
  TrendingUp,
  Calendar,
  Target,
  ExternalLink,
  Users,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  FileText,
  Loader2,
  Newspaper,
  Sparkles,
  GitCompare,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onScanLeadership,
  isScanningLeadership,
  yourBrandName,
  onUpdateTier,
}) {
  if (!competitor) {
    return null;
  }

  const totalFollowers =
    competitor.social_accounts?.reduce((sum, a) => sum + (a.followers || 0), 0) || 0;
  const avgEngagement =
    competitor.social_accounts?.length > 0
      ? (
          competitor.social_accounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) /
          competitor.social_accounts.length
        ).toFixed(1)
      : 0;

  const tierColors = {
    tier_1:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    tier_2:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    tier_3:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  const tierLabels = {
    tier_1: 'Tier 1',
    tier_2: 'Tier 2',
    tier_3: 'Tier 3',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {competitor.logo_url && (
                <img
                  src={competitor.logo_url}
                  alt={`${competitor.name} logo`}
                  className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-gray-700 p-2 border border-gray-200 dark:border-gray-600"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}
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
              {competitor.tier ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${tierColors[competitor.tier]}`}
                    >
                      <Shield className="w-3 h-3" />
                      {tierLabels[competitor.tier]}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_1');
                      }}
                    >
                      Tier 1 - Direct Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_2');
                      }}
                    >
                      Tier 2 - Indirect Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_3');
                      }}
                    >
                      Tier 3 - Potential Threat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors">
                      <Shield className="w-3 h-3" />
                      Set Tier
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_1');
                      }}
                    >
                      Tier 1 - Direct Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_2');
                      }}
                    >
                      Tier 2 - Indirect Competitor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTier?.(competitor, 'tier_3');
                      }}
                    >
                      Tier 3 - Potential Threat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                {isScanningNews ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Newspaper className="w-3 h-3" />
                )}
                Scan News
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDeepAnalyze}
                disabled={isDeepAnalyzing}
                className="gap-1"
              >
                {isDeepAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Deep Analyze
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="leadership" className="text-xs">
                Leadership
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs">
                Compare
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs">
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leadership" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={onScanLeadership}
                  disabled={isScanningLeadership}
                  className="gap-2"
                >
                  {isScanningLeadership ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" /> Scan Leadership
                    </>
                  )}
                </Button>
              </div>

              {competitor?.company_overview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      {competitor.company_overview.founded && (
                        <div>
                          <p className="text-xs text-gray-500">Founded</p>
                          <p className="text-sm font-medium">
                            {competitor.company_overview.founded}
                          </p>
                        </div>
                      )}
                      {competitor.company_overview.headquarters && (
                        <div>
                          <p className="text-xs text-gray-500">Headquarters</p>
                          <p className="text-sm font-medium">
                            {competitor.company_overview.headquarters}
                          </p>
                        </div>
                      )}
                      {competitor.company_overview.employee_count && (
                        <div>
                          <p className="text-xs text-gray-500">Employees</p>
                          <p className="text-sm font-medium">
                            {competitor.company_overview.employee_count}
                          </p>
                        </div>
                      )}
                      {competitor.company_overview.revenue && (
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="text-sm font-medium">
                            {competitor.company_overview.revenue}
                          </p>
                        </div>
                      )}
                    </div>
                    {competitor.company_overview.funding && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500">Funding</p>
                        <p className="text-sm font-medium">{competitor.company_overview.funding}</p>
                      </div>
                    )}
                    {competitor.company_overview.investors?.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 mb-1">Key Investors</p>
                        <div className="flex flex-wrap gap-1">
                          {competitor.company_overview.investors.map((inv, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {inv}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {competitor.company_overview.business_model && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500">Business Model</p>
                        <p className="text-xs">{competitor.company_overview.business_model}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {competitor?.leadership_team?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Executive Leadership</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {competitor.leadership_team.map((exec, i) => (
                      <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{exec.name}</h4>
                            <p className="text-xs text-gray-600">{exec.role}</p>
                            {exec.tenure && <p className="text-xs text-gray-500">{exec.tenure}</p>}
                          </div>
                          <div className="flex gap-1">
                            {exec.linkedin && (
                              <a
                                href={exec.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${exec.name} LinkedIn`}
                              >
                                <Badge variant="outline" className="cursor-pointer">
                                  <LinkedInIcon className="w-3.5 h-3.5" />
                                </Badge>
                              </a>
                            )}
                            {exec.twitter && (
                              <a
                                href={exec.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${exec.name} X/Twitter`}
                              >
                                <Badge variant="outline" className="cursor-pointer">
                                  <TwitterIcon className="w-3.5 h-3.5" />
                                </Badge>
                              </a>
                            )}
                          </div>
                        </div>

                        {exec.bio && <p className="text-xs text-gray-700 mb-2">{exec.bio}</p>}

                        {exec.key_achievements?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Key Achievements:
                            </p>
                            <ul className="text-xs text-gray-700 list-disc list-inside">
                              {exec.key_achievements.map((ach, j) => (
                                <li key={j}>{ach}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {exec.recent_news?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-2">Recent News:</p>
                            <div className="space-y-2">
                              {exec.recent_news.map((news, j) => (
                                <div key={j} className="bg-gray-50 p-2 rounded text-xs">
                                  <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-violet-600"
                                  >
                                    {news.title}
                                  </a>
                                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                                    <span>{news.source}</span>
                                    <span>•</span>
                                    <span>{news.date}</span>
                                    {news.sentiment && (
                                      <>
                                        <span>•</span>
                                        <Badge
                                          variant={
                                            news.sentiment === 'positive'
                                              ? 'success'
                                              : news.sentiment === 'negative'
                                                ? 'destructive'
                                                : 'secondary'
                                          }
                                          className="text-xs py-0"
                                        >
                                          {news.sentiment}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                  {news.summary && (
                                    <p className="text-gray-600 mt-1">{news.summary}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {competitor?.board_members?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Board of Directors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {competitor.board_members.map((member, i) => (
                        <div key={i} className="border rounded p-2">
                          <h4 className="text-sm font-semibold">{member.name}</h4>
                          <p className="text-xs text-gray-600">{member.title}</p>
                          {member.background && (
                            <p className="text-xs text-gray-700 mt-1">{member.background}</p>
                          )}
                          {member.other_boards?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Other Boards:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.other_boards.map((board, j) => (
                                  <Badge key={j} variant="outline" className="text-xs">
                                    {board}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!competitor?.leadership_team?.length && !competitor?.board_members?.length && (
                <Card className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No leadership data yet.</p>
                  <p className="text-gray-400 text-xs">Click "Scan Leadership" to analyze.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 text-center border-0 bg-violet-50">
                  <Users className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">
                    {totalFollowers >= 1000
                      ? `${(totalFollowers / 1000).toFixed(1)}K`
                      : totalFollowers}
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
                  <p className="text-lg font-bold text-blue-600">
                    {competitor.social_accounts?.length || 0}
                  </p>
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
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <Badge variant="outline" className="text-xs capitalize mb-1">
                              {acc.platform}
                            </Badge>
                            <p className="text-sm font-medium">@{acc.handle}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">
                              {(acc.followers || 0).toLocaleString()}
                            </p>
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
                                <Badge variant="outline" className="text-xs">
                                  {phase.performance}
                                </Badge>
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
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            {campaign.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          Est. reach: {campaign.estimated_reach?.toLocaleString() || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {campaign.key_elements?.map((element, j) => (
                            <Badge key={j} variant="outline" className="text-xs">
                              {element}
                            </Badge>
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
                        <p className="text-2xl font-bold text-blue-600">
                          {competitor.content_frequency.posts_per_week || 0}
                        </p>
                        <p className="text-xs text-gray-500">Posts/Week</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Best Days</p>
                        <div className="flex flex-wrap gap-1">
                          {competitor.content_frequency.best_days?.map((day, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {day}
                            </Badge>
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
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <GitCompare className="w-3 h-3" />
                  )}
                  Generate Comparison
                </Button>
              </div>
              {reports.filter((r) => r.report_type === 'comparative').length > 0 ? (
                reports
                  .filter((r) => r.report_type === 'comparative')
                  .slice(0, 1)
                  .map((report) => (
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
                  <p className="text-sm text-gray-400">
                    Generate a comparison to see how you stack up
                  </p>
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
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  Daily Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateReport('weekly')}
                  disabled={isGenerating}
                  className="gap-1"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
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
                        <Badge
                          className={
                            report.report_type === 'weekly'
                              ? 'bg-violet-100 text-violet-700'
                              : report.report_type === 'comparative'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
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
