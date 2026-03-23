import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, Archive } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'product_quality',
  'feature_gap',
  'pricing',
  'support',
  'onboarding',
  'performance',
  'usability',
  'other',
];

export default function FeedbackReviewPanel() {
  const [expandedId, setExpandedId] = useState(null);
  const [filterSentiment, setFilterSentiment] = useState('all');
  const queryClient = useQueryClient();

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.CustomerFeedback.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerFeedback.update(data.id, data.updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback'] }),
  });

  const filteredFeedback = feedback.filter((f) => {
    if (filterSentiment === 'all') {
      return true;
    }
    if (filterSentiment === 'negative') {
      return f.sentiment === 'negative';
    }
    if (filterSentiment === 'unreviewed') {
      return f.status === 'new';
    }
    return f.sentiment === filterSentiment;
  });

  const sentimentColor = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    negative: 'bg-red-100 text-red-800',
  };

  const npsColor = (score) => {
    if (score >= 9) {
      return 'bg-green-100 text-green-800';
    }
    if (score >= 7) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feedback Review</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterSentiment('all')}
              className={`px-3 py-1 rounded text-xs font-medium ${filterSentiment === 'all' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSentiment('negative')}
              className={`px-3 py-1 rounded text-xs font-medium ${filterSentiment === 'negative' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              Negative
            </button>
            <button
              onClick={() => setFilterSentiment('unreviewed')}
              className={`px-3 py-1 rounded text-xs font-medium ${filterSentiment === 'unreviewed' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              Unreviewed
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredFeedback.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No feedback to review</p>
          ) : (
            filteredFeedback.map((fb) => (
              <div
                key={fb.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {fb.contact_name}
                      </p>
                      <Badge className={sentimentColor[fb.sentiment]}>{fb.sentiment}</Badge>
                      {fb.nps_score !== null && (
                        <Badge className={npsColor(fb.nps_score)}>NPS: {fb.nps_score}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {fb.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{fb.company_name}</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedId === fb.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {expandedId === fb.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{fb.message}</p>

                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <select
                        value={fb.category || ''}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: fb.id,
                            updates: { category: e.target.value },
                          })
                        }
                        className="w-full mt-1 p-2 rounded text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        <option value="">Select category...</option>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Internal Notes
                      </label>
                      <textarea
                        value={fb.internal_notes || ''}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: fb.id,
                            updates: { internal_notes: e.target.value },
                          })
                        }
                        placeholder="Add notes..."
                        className="w-full mt-1 p-2 rounded text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 h-16 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() =>
                          updateMutation.mutate({
                            id: fb.id,
                            updates: {
                              status: 'reviewed',
                              reviewed_by: 'current-user',
                              reviewed_at: new Date().toISOString(),
                            },
                          })
                        }
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                      >
                        <Check className="w-3 h-3" /> Mark Reviewed
                      </Button>
                      <Button
                        onClick={() =>
                          updateMutation.mutate({
                            id: fb.id,
                            updates: { status: 'archived' },
                          })
                        }
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs"
                      >
                        <Archive className="w-3 h-3" /> Archive
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
