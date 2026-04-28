import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  MessageSquare,
  Sparkles,
  Send,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const sentimentConfig = {
  positive: { color: 'bg-emerald-100 text-emerald-700', icon: ThumbsUp },
  neutral: { color: 'bg-gray-100 text-gray-700', icon: MessageSquare },
  negative: { color: 'bg-red-100 text-red-700', icon: ThumbsDown },
};

const platformColors = {
  google: 'bg-blue-100 text-blue-700',
  yelp: 'bg-red-100 text-red-700',
  facebook: 'bg-indigo-100 text-indigo-700',
  tripadvisor: 'bg-emerald-100 text-emerald-700',
};

export default function ReviewManagement({ reviews }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [generatingResponse, setGeneratingResponse] = useState(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Review.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const generateResponse = async (review) => {
    setGeneratingResponse(review.id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, friendly response to this ${review.sentiment} ${review.rating}-star review:

"${review.content}"

The response should:
- Thank the customer
- Address any specific points mentioned
- Be empathetic if negative
- Invite them back
- Keep it under 100 words`,
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string' },
          },
        },
      });

      await base44.entities.Review.update(review.id, {
        ai_suggested_response: result.response,
      });
      setResponseText(result.response);
      setRespondingTo(review.id);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (error) {
      console.error('Failed to generate response:', error);
    }
    setGeneratingResponse(null);
  };

  const submitResponse = async (reviewId) => {
    await updateMutation.mutateAsync({
      id: reviewId,
      data: {
        response: responseText,
        response_date: new Date().toISOString().split('T')[0],
        status: 'responded',
      },
    });
    setRespondingTo(null);
    setResponseText('');
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesPlatform = filterPlatform === 'all' || r.platform === filterPlatform;
    return matchesStatus && matchesPlatform;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="yelp">Yelp</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredReviews.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const sentiment = sentimentConfig[review.sentiment] || sentimentConfig.neutral;
            const SentimentIcon = sentiment.icon;

            return (
              <Card key={review.id} className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="font-medium text-gray-600">
                          {review.author_name?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {review.author_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge className={platformColors[review.platform]}>
                            {review.platform}
                          </Badge>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(review.review_date), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <Badge className={sentiment.color}>
                        <SentimentIcon className="w-3 h-3 mr-1" />
                        {review.sentiment}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3">{review.content}</p>

                  {review.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {review.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {review.response && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Your Response:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.response}</p>
                    </div>
                  )}

                  {respondingTo === review.id && (
                    <div className="space-y-2 mb-3">
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response..."
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => submitResponse(review.id)}
                          className="gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Send Response
                        </Button>
                      </div>
                    </div>
                  )}

                  {review.status === 'pending' && respondingTo !== review.id && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => generateResponse(review)}
                        disabled={generatingResponse === review.id}
                      >
                        {generatingResponse === review.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        AI Suggest
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(review.id);
                          setResponseText(review.ai_suggested_response || '');
                        }}
                      >
                        Respond
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() =>
                          updateMutation.mutate({ id: review.id, data: { status: 'flagged' } })
                        }
                      >
                        <AlertCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {review.status === 'responded' && (
                    <div className="flex items-center gap-1 text-emerald-600 text-sm pt-2 border-t">
                      <CheckCircle className="w-4 h-4" />
                      Responded
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
