import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, Zap } from 'lucide-react';

export default function SEOOpportunities() {
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const queryClient = useQueryClient();

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['keyword-opportunities', selectedWebsite?.id],
    queryFn: () =>
      selectedWebsite
        ? base44.entities.KeywordOpportunity.filter(
            { website_id: selectedWebsite.id },
            '-opportunity_score',
            100
          )
        : [],
    enabled: !!selectedWebsite?.id,
  });

  const { data: actionItems = [] } = useQuery({
    queryKey: ['seo-actions', selectedWebsite?.id],
    queryFn: () =>
      selectedWebsite
        ? base44.entities.SEOActionItem.filter({ website_id: selectedWebsite.id }, '-priority', 50)
        : [],
    enabled: !!selectedWebsite?.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('analyzeSEOOpportunities', {
        website_id: selectedWebsite.id,
      });
      await base44.functions.invoke('generateSEORecommendations', {
        website_id: selectedWebsite.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['seo-actions'] });
    },
  });

  if (!selectedWebsite) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Opportunities</h1>
          <p className="text-gray-500 mt-1">Keyword gaps, backlink opportunities & action items</p>
        </div>

        {websites.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <p className="text-gray-500">No websites tracked yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websites.map((site) => (
              <Card
                key={site.id}
                className="glass-card cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedWebsite(site)}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{site.name}</h3>
                  <p className="text-sm text-gray-500">{site.url}</p>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline">{site.seo_score}/100</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const pendingActions = actionItems.filter((a) => a.status === 'pending');
  const totalOpportunitiesValue = opportunities.reduce(
    (sum, o) => sum + (o.estimated_traffic || 0),
    0
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" onClick={() => setSelectedWebsite(null)}>
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedWebsite.name}
            </h1>
          </div>
          <p className="text-gray-500">{selectedWebsite.url}</p>
        </div>
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" /> Analyze Now
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Keyword Opportunities</p>
            <p className="text-3xl font-bold text-violet-600">{opportunities.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              +{totalOpportunitiesValue.toLocaleString()} est. traffic
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Action Items</p>
            <p className="text-3xl font-bold text-emerald-600">{pendingActions.length}</p>
            <p className="text-xs text-gray-400 mt-1">Pending execution</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Top Opportunity</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {opportunities[0]?.keyword || 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Score: {opportunities[0]?.opportunity_score || 0}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.slice(0, 5).map((action) => (
              <div
                key={action.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
                  <Badge
                    className={`${
                      action.priority === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : action.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {action.description}
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="text-emerald-600">Impact: {action.estimated_impact}</span>
                  <span className="text-gray-500">Effort: {action.estimated_effort}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Keyword Opportunities */}
      {opportunities.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" /> Keyword Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3">Keyword</th>
                    <th className="text-right py-2 px-3">Search Vol</th>
                    <th className="text-right py-2 px-3">Difficulty</th>
                    <th className="text-right py-2 px-3">Opportunity</th>
                    <th className="text-right py-2 px-3">Est. Traffic</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.slice(0, 10).map((opp) => (
                    <tr key={opp.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3">{opp.keyword}</td>
                      <td className="text-right py-2 px-3">
                        {opp.search_volume?.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-3">{opp.difficulty}</td>
                      <td className="text-right py-2 px-3">
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {opp.opportunity_score}
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-3 text-emerald-600 font-medium">
                        +{opp.estimated_traffic?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
