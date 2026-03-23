import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, ExternalLink, Users, TrendingUp } from 'lucide-react';

export default function JournalistCard({ journalist, onContact }) {
  return (
    <Card className="glass-card rounded-2xl hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <span className="font-semibold text-violet-600">{journalist.name?.[0]}</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{journalist.name}</h4>
              <p className="text-sm text-gray-500">{journalist.outlet}</p>
            </div>
          </div>
          {journalist.relevance_score && (
            <Badge className="bg-emerald-100 text-emerald-700">
              {journalist.relevance_score}% match
            </Badge>
          )}
        </div>

        {journalist.beat?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {journalist.beat.slice(0, 3).map((b, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {b}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          {journalist.outlet_da && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>DA {journalist.outlet_da}</span>
            </div>
          )}
          {journalist.audience_size && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{(journalist.audience_size / 1000).toFixed(0)}K</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={onContact} className="flex-1 gap-1">
            <Mail className="w-3 h-3" />
            Contact
          </Button>
          {journalist.twitter_handle && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={`https://twitter.com/${journalist.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
