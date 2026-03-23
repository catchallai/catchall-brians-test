import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PlagiarismChecker({ content, onScoreUpdate }) {
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(null);

  const checkPlagiarism = async () => {
    setChecking(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this content for originality and potential plagiarism issues. Provide an originality score (0-100, where 100 is completely original) and highlight any concerning phrases that might be too similar to common content.

Content:
${content.substring(0, 5000)}

Return JSON with:
- originality_score: number (0-100)
- concerning_phrases: array of strings (max 5)
- recommendation: string`,
        response_json_schema: {
          type: 'object',
          properties: {
            originality_score: { type: 'number' },
            concerning_phrases: { type: 'array', items: { type: 'string' } },
            recommendation: { type: 'string' },
          },
        },
      });

      setScore(result);
      onScoreUpdate?.(result.originality_score);
    } catch (error) {
      console.error('Plagiarism check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) {
      return 'text-green-600';
    }
    if (score >= 70) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold">Plagiarism Check</h4>
          </div>
          <Button
            onClick={checkPlagiarism}
            disabled={checking || !content}
            size="sm"
            variant="outline"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Now'}
          </Button>
        </div>

        {score && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Originality Score</span>
                <span className={`text-lg font-bold ${getScoreColor(score.originality_score)}`}>
                  {score.originality_score}%
                </span>
              </div>
              <Progress value={score.originality_score} className="h-2" />
            </div>

            {score.originality_score >= 90 ? (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                <CheckCircle className="w-4 h-4" />
                Excellent originality
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">{score.recommendation}</p>
                  {score.concerning_phrases?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Concerning phrases:</p>
                      {score.concerning_phrases.map((phrase, idx) => (
                        <p key={idx} className="text-xs italic">
                          • {phrase}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
