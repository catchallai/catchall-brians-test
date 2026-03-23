import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Minus, Star } from 'lucide-react';

const npsColors = {
  promoter: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: ThumbsUp },
  passive: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Minus },
  detractor: { bg: 'bg-red-100', text: 'text-red-700', icon: ThumbsDown },
};

export default function SurveyPanel({ surveys, contacts }) {
  const completedSurveys = surveys.filter((s) => s.status === 'completed');
  const npsSurveys = completedSurveys.filter((s) => s.survey_type === 'nps' && s.score !== null);

  const avgNPS =
    npsSurveys.length > 0
      ? Math.round(npsSurveys.reduce((sum, s) => sum + s.score, 0) / npsSurveys.length)
      : 0;

  const promoters = completedSurveys.filter((s) => s.nps_category === 'promoter').length;
  const passives = completedSurveys.filter((s) => s.nps_category === 'passive').length;
  const detractors = completedSurveys.filter((s) => s.nps_category === 'detractor').length;

  return (
    <div className="space-y-4">
      {/* NPS Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-violet-600">{avgNPS}</p>
            <p className="text-xs text-gray-500">Average NPS</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <ThumbsUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-emerald-600">{promoters}</p>
            <p className="text-xs text-gray-500">Promoters</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Minus className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-amber-600">{passives}</p>
            <p className="text-xs text-gray-500">Passives</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <ThumbsDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-600">{detractors}</p>
            <p className="text-xs text-gray-500">Detractors</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Surveys */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedSurveys.slice(0, 10).map((survey) => {
            const contact = contacts.find((c) => c.id === survey.contact_id);
            const npsConfig = npsColors[survey.nps_category] || npsColors.passive;
            const Icon = npsConfig.icon;

            return (
              <div key={survey.id} className="border-b pb-3 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">
                      {contact?.first_name} {contact?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(survey.completed_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${npsConfig.bg} ${npsConfig.text} border-0`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {survey.score}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {survey.survey_type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {survey.feedback && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "{survey.feedback}"
                  </p>
                )}
                {survey.follow_up_required && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-red-600">
                      Follow-up Required
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
