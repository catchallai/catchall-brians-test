import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LinkedInIcon } from '@/components/icons/BrandIcons';
import { Sparkles, Loader2, TrendingUp, Mail, Phone, Globe, MessageSquare } from 'lucide-react';

const scoreColors = (score) => {
  if (score >= 80) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' };
  }
  if (score >= 60) {
    return { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' };
  }
  if (score >= 40) {
    return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' };
  }
  return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' };
};

const sourceIcons = {
  linkedin: LinkedInIcon,
  email: Mail,
  call: Phone,
  website: Globe,
  engagement: MessageSquare,
};

export default function LeadScoringPanel({ contacts, leadScores, onScore, isScoring }) {
  const [expandedId, setExpandedId] = useState(null);

  const contactsWithScores = contacts
    .map((contact) => {
      const score = leadScores.find((s) => s.contact_id === contact.id);
      return { ...contact, score };
    })
    .sort((a, b) => (b.score?.total_score || 0) - (a.score?.total_score || 0));

  const avgScore =
    leadScores.length > 0
      ? Math.round(leadScores.reduce((sum, s) => sum + (s.total_score || 0), 0) / leadScores.length)
      : 0;

  const hotLeads = leadScores.filter((s) => s.total_score >= 80).length;
  const warmLeads = leadScores.filter((s) => s.total_score >= 60 && s.total_score < 80).length;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          AI Lead Scoring
        </CardTitle>
        <Button
          onClick={onScore}
          disabled={isScoring || contacts.length === 0}
          size="sm"
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          {isScoring ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Scoring...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Score All Leads
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-emerald-600">{hotLeads}</p>
            <p className="text-xs text-gray-600">Hot Leads (80+)</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{warmLeads}</p>
            <p className="text-xs text-gray-600">Warm Leads (60-79)</p>
          </div>
          <div className="p-3 bg-violet-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-violet-600">{avgScore}</p>
            <p className="text-xs text-gray-600">Avg Score</p>
          </div>
        </div>

        {contactsWithScores.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No contacts to score</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contactsWithScores.slice(0, 10).map((contact) => {
              const score = contact.score;
              const colors = scoreColors(score?.total_score || 0);
              const isExpanded = expandedId === contact.id;

              return (
                <div key={contact.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {contact.company || 'No company'} • {contact.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {score && (
                        <Badge className={`${colors.bg} ${colors.text} border-0 font-semibold`}>
                          {score.total_score}/100
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                      >
                        {isExpanded ? '−' : '+'}
                      </Button>
                    </div>
                  </div>

                  {score && (
                    <>
                      <Progress value={score.total_score} className="h-2 mb-2" />

                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t pt-3">
                          {/* Score Breakdown */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-blue-50 rounded">
                              <p className="text-gray-600 mb-1">Demographic</p>
                              <p className="font-semibold text-blue-700">
                                {score.demographic_score}/100
                              </p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded">
                              <p className="text-gray-600 mb-1">Behavioral</p>
                              <p className="font-semibold text-emerald-700">
                                {score.behavioral_score}/100
                              </p>
                            </div>
                            <div className="p-2 bg-violet-50 rounded">
                              <p className="text-gray-600 mb-1">Engagement</p>
                              <p className="font-semibold text-violet-700">
                                {score.engagement_score}/100
                              </p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded">
                              <p className="text-gray-600 mb-1">Grade</p>
                              <p className="font-semibold text-amber-700 text-lg">{score.grade}</p>
                            </div>
                          </div>

                          {/* Scoring Factors */}
                          {score.score_breakdown && (
                            <div className="space-y-2">
                              <p className="font-medium text-xs text-gray-700">Scoring Factors:</p>
                              {Object.entries(score.score_breakdown).map(([key, value]) => {
                                const IconComponent = sourceIcons[key] || MessageSquare;
                                return (
                                  <div key={key} className="flex items-center gap-2 text-xs">
                                    <IconComponent className="w-3 h-3 text-gray-500" />
                                    <span className="text-gray-600 capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    <span className="font-medium">
                                      {typeof value === 'number' ? `+${value}` : value}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* AI Reasoning */}
                          {score.reasoning && (
                            <div className="p-2 bg-violet-50 rounded">
                              <p className="text-xs font-medium text-violet-700 mb-1">
                                Why this score?
                              </p>
                              <p className="text-xs text-gray-700">{score.reasoning}</p>
                            </div>
                          )}

                          {/* Recommended Actions */}
                          {score.recommended_actions?.length > 0 && (
                            <div className="p-2 bg-blue-50 rounded">
                              <p className="text-xs font-medium text-blue-700 mb-1">
                                Recommended Actions:
                              </p>
                              <ul className="text-xs text-gray-700 space-y-1">
                                {score.recommended_actions.map((action, i) => (
                                  <li key={i}>• {action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
