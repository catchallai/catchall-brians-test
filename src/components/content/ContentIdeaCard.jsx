import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Target, TrendingUp, FileText, ArrowRight } from 'lucide-react';

const contentTypeColors = {
  blog: 'bg-blue-100 text-blue-700',
  guide: 'bg-violet-100 text-violet-700',
  listicle: 'bg-amber-100 text-amber-700',
  'how-to': 'bg-emerald-100 text-emerald-700',
  comparison: 'bg-pink-100 text-pink-700',
  review: 'bg-orange-100 text-orange-700',
};

export default function ContentIdeaCard({ idea, onCreateBrief, isHighlight }) {
  const opportunityScore = idea.opportunity_score || 0;

  return (
    <Card
      className={`glass-card rounded-2xl hover:shadow-lg transition-all ${isHighlight ? 'ring-2 ring-emerald-500' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            {idea.content_type && (
              <Badge
                className={contentTypeColors[idea.content_type] || 'bg-gray-100 text-gray-700'}
              >
                {idea.content_type}
              </Badge>
            )}
          </div>
          {opportunityScore >= 70 && (
            <Badge className="bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-3 h-3 mr-1" />
              Hot
            </Badge>
          )}
        </div>

        <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {idea.title}
        </h3>

        {idea.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{idea.description}</p>
        )}

        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{idea.target_keyword}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {idea.keyword_difficulty || '-'}
            </p>
            <p className="text-xs text-gray-500">Difficulty</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {idea.search_volume?.toLocaleString() || '-'}
            </p>
            <p className="text-xs text-gray-500">Volume</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-sm font-semibold text-emerald-600">{opportunityScore}</p>
            <p className="text-xs text-gray-500">Opportunity</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Opportunity Score</span>
            <span>{opportunityScore}/100</span>
          </div>
          <Progress value={opportunityScore} className="h-1.5" />
        </div>

        <Button onClick={onCreateBrief} variant="outline" size="sm" className="w-full gap-1">
          <FileText className="w-3 h-3" />
          Create Brief
          <ArrowRight className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
