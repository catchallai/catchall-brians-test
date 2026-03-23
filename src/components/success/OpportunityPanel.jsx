import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, DollarSign, Lightbulb, CheckCircle } from 'lucide-react';

const oppTypeColors = {
  upsell: { bg: 'bg-blue-100', text: 'text-blue-700' },
  cross_sell: { bg: 'bg-violet-100', text: 'text-violet-700' },
  expansion: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  renewal: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

export default function OpportunityPanel({ opportunities, contacts }) {
  const identified = opportunities.filter((o) => o.status === 'identified');
  const totalValue = opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-violet-600">{identified.length}</p>
            <p className="text-xs text-gray-500">New Opportunities</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">
              ${(totalValue / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500">Total Potential Value</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-600">
              {opportunities.filter((o) => o.status === 'closed_won').length}
            </p>
            <p className="text-xs text-gray-500">Closed Won</p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {opportunities.map((opp) => {
          const contact = contacts.find((c) => c.id === opp.contact_id);
          const colors = oppTypeColors[opp.opportunity_type] || oppTypeColors.upsell;

          return (
            <Card key={opp.id} className="glass-card hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {contact?.first_name} {contact?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{contact?.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${colors.bg} ${colors.text} border-0`}>
                      {opp.opportunity_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {opp.confidence_score}% confidence
                    </Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {opp.product_service}
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    ${opp.estimated_value?.toLocaleString()}
                  </p>
                </div>

                {opp.reasoning && (
                  <div className="mb-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded">
                    <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Why this opportunity:
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{opp.reasoning}</p>
                  </div>
                )}

                {opp.signals?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Buying Signals:
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {opp.signals.map((signal, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {opp.recommended_approach && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Recommended Approach:
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {opp.recommended_approach}
                    </p>
                  </div>
                )}

                {opp.best_contact_time && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Best time to contact: {opp.best_contact_time}
                  </p>
                )}

                <Badge variant="outline" className="text-xs">
                  Status: {opp.status.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
