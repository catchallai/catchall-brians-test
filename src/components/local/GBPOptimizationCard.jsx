import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Star,
  MapPin,
  Image,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';

export default function GBPOptimizationCard({ profile, onEdit }) {
  const score = profile.optimization_score || 0;
  const issues = profile.optimization_issues || [];

  const getScoreColor = (score) => {
    if (score >= 80) {
      return 'text-emerald-600';
    }
    if (score >= 60) {
      return 'text-amber-600';
    }
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) {
      return 'bg-emerald-100';
    }
    if (score >= 60) {
      return 'bg-amber-100';
    }
    return 'bg-red-100';
  };

  return (
    <Card className="glass-card rounded-2xl hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {profile.business_name}
              </h3>
              <p className="text-sm text-gray-500">{profile.category}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div
            className={`w-16 h-16 rounded-full ${getScoreBg(score)} flex items-center justify-center`}
          >
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Optimization Score
            </p>
            <Progress value={score} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {profile.rating || 0} ({profile.review_count || 0} reviews)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400 truncate">
              {profile.city}, {profile.state}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {profile.photos_count || 0} photos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {profile.posts_count || 0} posts
            </span>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Issues to Fix:</p>
            <div className="flex flex-wrap gap-1">
              {issues.slice(0, 3).map((issue, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {issue}
                </Badge>
              ))}
              {issues.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{issues.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {issues.length === 0 && score >= 80 && (
          <div className="border-t pt-3 flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Profile fully optimized!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
