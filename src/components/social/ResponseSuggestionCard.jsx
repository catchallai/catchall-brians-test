import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Sparkles, Send, ThumbsUp, ThumbsDown, Minus, Loader2 } from 'lucide-react';
import { PLATFORM_MAP_LOWER } from '@/constants/platforms';

const sentimentConfig = {
  positive: { icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  neutral: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100' },
  negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-100' },
};

export default function ResponseSuggestionCard({
  mention,
  onGenerateResponse,
  onUpdateStatus,
  isGenerating,
}) {
  const [copied, setCopied] = useState(false);
  const [editedResponse, setEditedResponse] = useState(mention.suggested_response || '');
  const [showEdit, setShowEdit] = useState(false);

  const platformEntry = PLATFORM_MAP_LOWER[mention.platform];
  const PlatformIcon = platformEntry?.icon;
  const platformBg = platformEntry?.tailwindGradient || platformEntry?.tailwind || 'bg-gray-400';
  const sentiment = sentimentConfig[mention.sentiment] || sentimentConfig.neutral;
  const SentimentIcon = sentiment.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(editedResponse || mention.suggested_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    const response = await onGenerateResponse(mention);
    if (response) {
      setEditedResponse(response);
    }
  };

  return (
    <Card
      className={`border-0 shadow-sm ${mention.response_status === 'responded' ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-4">
        {/* Original mention */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-8 h-8 rounded-lg ${platformBg} flex items-center justify-center flex-shrink-0`}
          >
            {PlatformIcon && <PlatformIcon size={14} color="white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">@{mention.author}</span>
              <Badge className={`${sentiment.bg} ${sentiment.color} border-0 text-xs`}>
                <SentimentIcon className="w-3 h-3 mr-1" />
                {mention.sentiment}
              </Badge>
              {mention.response_status === 'responded' && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                  Responded
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{mention.content}</p>
          </div>
        </div>

        {/* Response suggestion */}
        {mention.suggested_response || editedResponse ? (
          <div className="space-y-3">
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
              {showEdit ? (
                <Textarea
                  value={editedResponse || mention.suggested_response}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  className="min-h-24 text-sm"
                  placeholder="Edit your response..."
                />
              ) : (
                <p className="text-sm text-gray-700">
                  {editedResponse || mention.suggested_response}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowEdit(!showEdit)}>
                  {showEdit ? 'Preview' : 'Edit'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500"
                  onClick={() => onUpdateStatus(mention.id, 'ignored')}
                >
                  Ignore
                </Button>
                <Button
                  size="sm"
                  className="gap-1 bg-violet-600 hover:bg-violet-700"
                  onClick={() => onUpdateStatus(mention.id, 'responded')}
                >
                  <Send className="w-3 h-3" />
                  Mark Responded
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
            variant="outline"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Response Suggestion
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
