import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, Target } from 'lucide-react';
import { toast } from 'sonner';

const GRADE_COLORS = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-orange-100 text-orange-700 border-orange-200',
  F: 'bg-red-100 text-red-700 border-red-200',
};

export default function LeadScoringPanel({ contacts, leadScores, deals }) {
  const queryClient = useQueryClient();

  const calculateScoreMutation = useMutation({
    mutationFn: async () => {
      for (const contact of contacts) {
        // Calculate demographic score (job title, company size, etc.)
        let demographicScore = 0;
        if (
          contact.job_title?.toLowerCase().includes('director') ||
          contact.job_title?.toLowerCase().includes('manager') ||
          contact.job_title?.toLowerCase().includes('vp') ||
          contact.job_title?.toLowerCase().includes('ceo')
        ) {
          demographicScore += 30;
        }
        if (contact.status === 'customer') {
          demographicScore += 20;
        }
        if (contact.status === 'prospect') {
          demographicScore += 10;
        }

        // Calculate behavioral score (deals, activities)
        let behavioralScore = 0;
        const contactDeals = deals.filter((d) => d.contact_id === contact.id);
        if (contactDeals.length > 0) {
          behavioralScore += 20;
        }
        const hasWonDeal = contactDeals.some((d) => d.stage === 'closed_won');
        if (hasWonDeal) {
          behavioralScore += 30;
        }

        // Calculate engagement score
        let engagementScore = 0;
        if (contact.email) {
          engagementScore += 10;
        }
        if (contact.phone) {
          engagementScore += 10;
        }
        if (contact.source === 'referral') {
          engagementScore += 20;
        }

        const totalScore = demographicScore + behavioralScore + engagementScore;

        let grade = 'F';
        if (totalScore >= 80) {
          grade = 'A';
        } else if (totalScore >= 60) {
          grade = 'B';
        } else if (totalScore >= 40) {
          grade = 'C';
        } else if (totalScore >= 20) {
          grade = 'D';
        }

        // Check if score exists
        const existing = leadScores.find((s) => s.contact_id === contact.id);
        const scoreData = {
          contact_id: contact.id,
          total_score: totalScore,
          demographic_score: demographicScore,
          behavioral_score: behavioralScore,
          engagement_score: engagementScore,
          grade,
          last_calculated: new Date().toISOString(),
          score_breakdown: {
            job_title: contact.job_title,
            status: contact.status,
            deals_count: contactDeals.length,
            source: contact.source,
          },
        };

        if (existing) {
          await base44.entities.LeadScore.update(existing.id, scoreData);
        } else {
          await base44.entities.LeadScore.create(scoreData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scores'] });
      toast.success('Lead scores calculated');
    },
    onError: () => toast.error('Failed to calculate scores'),
  });

  const getContact = (contactId) => contacts.find((c) => c.id === contactId);

  const sortedScores = [...leadScores].sort((a, b) => b.total_score - a.total_score);
  const gradeDistribution = {
    A: leadScores.filter((s) => s.grade === 'A').length,
    B: leadScores.filter((s) => s.grade === 'B').length,
    C: leadScores.filter((s) => s.grade === 'C').length,
    D: leadScores.filter((s) => s.grade === 'D').length,
    F: leadScores.filter((s) => s.grade === 'F').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lead Scoring</h2>
          <p className="text-sm text-gray-500">
            Automatically score leads based on demographics, behavior, and engagement
          </p>
        </div>
        <Button
          onClick={() => calculateScoreMutation.mutate()}
          disabled={calculateScoreMutation.isPending}
          className="gap-2"
        >
          {calculateScoreMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Recalculate All Scores
        </Button>
      </div>

      {/* Grade Distribution */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(gradeDistribution).map(([grade, count]) => (
          <Card key={grade} className={`${GRADE_COLORS[grade]} border`}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{grade}</p>
              <p className="text-sm">{count} leads</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lead List */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Top Scoring Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedScores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No scores calculated yet</p>
              <p className="text-sm">Click "Recalculate All Scores" to start</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedScores.slice(0, 15).map((score) => {
                const contact = getContact(score.contact_id);
                if (!contact) {
                  return null;
                }

                return (
                  <div
                    key={score.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Badge className={`${GRADE_COLORS[score.grade]} text-lg px-3 py-1`}>
                      {score.grade}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    <div className="w-32">
                      <Progress value={score.total_score} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {score.total_score}/100
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 w-24">
                      <p>Demo: {score.demographic_score}</p>
                      <p>Behav: {score.behavioral_score}</p>
                      <p>Engage: {score.engagement_score}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
