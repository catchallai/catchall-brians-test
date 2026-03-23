import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Video,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Calendar,
  Pencil,
  TrendingUp,
} from 'lucide-react';

const typeIcons = {
  check_in: MessageSquare,
  training: Video,
  support: AlertTriangle,
  qbr: Calendar,
  escalation: AlertTriangle,
  feedback: MessageSquare,
  renewal: Calendar,
  expansion: TrendingUp,
};

const sentimentConfig = {
  positive: { icon: ThumbsUp, bg: 'bg-emerald-100', text: 'text-emerald-700' },
  neutral: { icon: Minus, bg: 'bg-gray-100', text: 'text-gray-700' },
  negative: { icon: ThumbsDown, bg: 'bg-red-100', text: 'text-red-700' },
};

export default function InteractionTimeline({ interactions, contacts, onEdit }) {
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.interaction_date) - new Date(a.interaction_date)
  );

  return (
    <div className="space-y-3">
      {sortedInteractions.map((interaction) => {
        const contact = contacts.find((c) => c.id === interaction.contact_id);
        const TypeIcon = typeIcons[interaction.interaction_type] || MessageSquare;
        const sentiment = sentimentConfig[interaction.sentiment] || sentimentConfig.neutral;
        const SentimentIcon = sentiment.icon;

        return (
          <Card key={interaction.id} className="glass-card hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <TypeIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">
                        {contact?.first_name} {contact?.last_name}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {interaction.interaction_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${sentiment.bg} ${sentiment.text} border-0 text-xs`}>
                        <SentimentIcon className="w-3 h-3 mr-1" />
                        {interaction.sentiment}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(interaction.interaction_date).toLocaleString()}
                      {interaction.duration_minutes && ` • ${interaction.duration_minutes} min`}
                      {interaction.csm_name && ` • ${interaction.csm_name}`}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onEdit(interaction)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>

              {interaction.summary && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 ml-14">
                  {interaction.summary}
                </p>
              )}

              {interaction.topics_discussed?.length > 0 && (
                <div className="flex gap-1 flex-wrap ml-14 mb-2">
                  {interaction.topics_discussed.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}

              {interaction.action_items?.length > 0 && (
                <div className="ml-14 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Action Items:</p>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    {interaction.action_items.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {interaction.next_touchpoint && (
                <div className="ml-14 mt-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Next touchpoint: {new Date(interaction.next_touchpoint).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
