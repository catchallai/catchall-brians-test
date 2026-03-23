import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIPostAssistant({
  imageUrl,
  currentCaption,
  onCaptionSuggested,
  onHashtagSuggested,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateSuggestions = async () => {
    if (!imageUrl && !currentCaption) {
      return;
    }

    setIsLoading(true);
    try {
      const fileUrls = imageUrl ? [imageUrl] : [];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image and the current caption: "${currentCaption || 'No caption'}"
        
        Provide:
        1. 3 different caption options (engaging, professional, casual)
        2. 10 relevant hashtags for social media reach
        3. 5 keywords for content organization
        
        Return a JSON object with:
        {
          "captions": [{"text": "...", "style": "engaging/professional/casual"}, ...],
          "hashtags": ["hashtag1", "hashtag2", ...],
          "keywords": ["keyword1", "keyword2", ...]
        }`,
        response_json_schema: {
          type: 'object',
          properties: {
            captions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  style: { type: 'string' },
                },
              },
            },
            hashtags: {
              type: 'array',
              items: { type: 'string' },
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        file_urls: fileUrls,
      });

      setSuggestions(result);
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
          </div>
          <Button
            size="sm"
            onClick={generateSuggestions}
            disabled={isLoading || (!imageUrl && !currentCaption)}
            className="gap-1"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Generate Suggestions
          </Button>
        </div>

        {suggestions && (
          <div className="space-y-4">
            {/* Captions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Caption Ideas
              </h4>
              <div className="space-y-2">
                {suggestions.captions.map((caption, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-start justify-between gap-2"
                  >
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                        {caption.style}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">{caption.text}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onCaptionSuggested(caption.text);
                        copyToClipboard(caption.text, `caption-${idx}`);
                      }}
                    >
                      {copiedIndex === `caption-${idx}` ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Suggested Hashtags
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.hashtags.slice(0, 6).map((tag, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    onClick={() => onHashtagSuggested(tag)}
                    className="text-xs h-7"
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
              {suggestions.hashtags.length > 6 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  +{suggestions.hashtags.length - 6} more hashtags available
                </p>
              )}
            </div>

            {/* Keywords */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Keywords for Organization
              </h4>
              <div className="flex flex-wrap gap-1">
                {suggestions.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100 rounded cursor-help"
                    title="Keywords help organize and search your posts"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!suggestions && !isLoading && (imageUrl || currentCaption) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
            Click "Generate Suggestions" to get AI-powered captions, hashtags, and keywords
          </p>
        )}
      </div>
    </Card>
  );
}
