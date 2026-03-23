import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

export default function FeedbackForm({ contact = null, onSuccess = null }) {
  const [feedbackType, setFeedbackType] = useState('general');
  const [npsScore, setNpsScore] = useState(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const feedback = await base44.entities.CustomerFeedback.create({
        contact_id: contact?.id,
        contact_name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
        company_name: contact?.company_name || 'Unknown',
        feedback_type: feedbackType,
        nps_score: feedbackType === 'nps' ? npsScore : null,
        message,
        sentiment: 'neutral',
      });

      // Analyze feedback
      await base44.functions.invoke('analyzeFeedback', { feedback_id: feedback.id });

      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setMessage('');
      setNpsScore(null);
      setFeedbackType('general');
      onSuccess?.();
    },
  });

  const canSubmit = message.trim().length > 0 && (feedbackType !== 'nps' || npsScore !== null);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Share Your Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Feedback Type
          </label>
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="general">General Feedback</option>
            <option value="nps">NPS Survey</option>
            <option value="feature_request">Feature Request</option>
            <option value="bug_report">Bug Report</option>
            <option value="complaint">Complaint</option>
          </select>
        </div>

        {feedbackType === 'nps' && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How likely are you to recommend us? (0-10)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 11 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setNpsScore(i)}
                  className={`p-2 rounded text-sm font-semibold transition-all ${
                    npsScore === i
                      ? 'bg-violet-600 text-white scale-110'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            {npsScore !== null && (
              <p className="text-xs text-gray-500 mt-2">
                {npsScore >= 9 ? '🎉 Promoter' : npsScore >= 7 ? '👍 Passive' : '😔 Detractor'}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you think..."
            className="w-full mt-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-24 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !canSubmit}
          className="w-full gap-2"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Submit Feedback
            </>
          )}
        </Button>

        {submitMutation.isSuccess && (
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Thank you for your feedback!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
