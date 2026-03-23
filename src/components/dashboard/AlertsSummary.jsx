import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, TrendingDown, AlertTriangle, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AlertsSummary({ alerts = [], keywords = [], mentions = [] }) {
  // Generate alerts from data
  const generateAlerts = () => {
    const items = [];

    // Keyword ranking drops
    keywords.forEach((k) => {
      if (
        k.previous_position &&
        k.current_position &&
        k.current_position > k.previous_position + 5
      ) {
        items.push({
          type: 'ranking_drop',
          severity: 'high',
          title: `Ranking dropped for "${k.keyword}"`,
          description: `Position ${k.previous_position} → ${k.current_position}`,
          link: 'Keywords',
        });
      }
    });

    // Negative sentiment mentions
    const negativeMentions = mentions.filter((m) => m.sentiment === 'negative');
    if (negativeMentions.length > 0) {
      items.push({
        type: 'negative_sentiment',
        severity: 'medium',
        title: `${negativeMentions.length} negative mentions detected`,
        description: 'Review and respond to negative feedback',
        link: 'SocialListening',
      });
    }

    // Influencer mentions
    const influencerMentions = mentions.filter((m) => m.is_influencer);
    if (influencerMentions.length > 0) {
      items.push({
        type: 'influencer',
        severity: 'low',
        title: `${influencerMentions.length} influencer mentions`,
        description: 'Opportunity to engage with influencers',
        link: 'SocialListening',
      });
    }

    // Add real alerts
    alerts
      .filter((a) => !a.is_dismissed)
      .forEach((a) => {
        items.push({
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          link: 'SocialListening',
        });
      });

    return items.slice(0, 5);
  };

  const alertItems = generateAlerts();

  const severityColors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const severityIcons = {
    critical: AlertTriangle,
    high: TrendingDown,
    medium: Bell,
    low: Users,
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Alerts</CardTitle>
          {alertItems.length > 0 && (
            <Badge className="bg-red-100 text-red-700">{alertItems.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alertItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No alerts - all clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertItems.map((alert, idx) => {
              const Icon = severityIcons[alert.severity] || Bell;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${severityColors[alert.severity] || severityColors.low}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs opacity-80">{alert.description}</p>
                    </div>
                    {alert.link && (
                      <Link to={createPageUrl(alert.link)}>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
