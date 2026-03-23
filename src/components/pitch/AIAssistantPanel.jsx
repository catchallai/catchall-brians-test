import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Image, BarChart3, Wand2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIAssistantPanel({ slide, companyName, industry, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (slide?.type && slide?.title) {
      generateSuggestions();
    }
  }, [slide?.id]);

  const generateSuggestions = async () => {
    if (!slide) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert pitch deck consultant. Generate compelling content suggestions for this slide.

Company: ${companyName || 'Tech Startup'}
Industry: ${industry || 'Technology'}
Slide Type: ${slide.type}
Slide Title: ${slide.title}
Current Content: ${JSON.stringify(slide.content)}

Provide:
1. content_suggestions: 2-3 specific content ideas (bullet points, text, or data)
2. alternative_phrases: 3 alternative ways to phrase the title or main message
3. visual_suggestions: 2-3 specific visual/chart recommendations
4. data_points: 2-3 relevant statistics or metrics to include`,
        response_json_schema: {
          type: 'object',
          properties: {
            content_suggestions: {
              type: 'array',
              items: { type: 'string' },
            },
            alternative_phrases: {
              type: 'array',
              items: { type: 'string' },
            },
            visual_suggestions: {
              type: 'array',
              items: { type: 'string' },
            },
            data_points: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      });

      setSuggestions(result);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyContent = (content) => {
    const points = slide.content?.points || [];
    onApplySuggestion({
      ...slide,
      content: {
        ...slide.content,
        points: [...points, content],
      },
    });
  };

  const handleApplyTitle = (title) => {
    onApplySuggestion({
      ...slide,
      title: title,
    });
  };

  if (!slide) {
    return (
      <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a slide to get AI suggestions
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Assistant
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={generateSuggestions}
          disabled={isLoading}
          className="h-7 text-violet-600 hover:text-violet-700 hover:bg-violet-100"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      ) : suggestions ? (
        <div className="space-y-4">
          {/* Alternative Phrases */}
          {suggestions.alternative_phrases?.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Wand2 className="w-3 h-3 text-violet-600" />
                <h4 className="text-xs font-medium text-violet-900 dark:text-violet-100">
                  Alternative Titles
                </h4>
              </div>
              <div className="space-y-1">
                {suggestions.alternative_phrases.map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyTitle(phrase)}
                    className="w-full text-left p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors text-xs text-gray-700 dark:text-gray-300 border border-violet-100 dark:border-violet-800"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Suggestions */}
          {suggestions.content_suggestions?.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3 text-violet-600" />
                <h4 className="text-xs font-medium text-violet-900 dark:text-violet-100">
                  Content Ideas
                </h4>
              </div>
              <div className="space-y-1">
                {suggestions.content_suggestions.map((content, i) => (
                  <div
                    key={i}
                    className="group p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-violet-100 dark:border-violet-800"
                  >
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">{content}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyContent(content)}
                      className="h-5 text-[10px] text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      + Add to slide
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Suggestions */}
          {suggestions.visual_suggestions?.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Image className="w-3 h-3 text-violet-600" />
                <h4 className="text-xs font-medium text-violet-900 dark:text-violet-100">
                  Visual Ideas
                </h4>
              </div>
              <div className="space-y-1">
                {suggestions.visual_suggestions.map((visual, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400 border border-violet-100 dark:border-violet-800"
                  >
                    {visual}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Points */}
          {suggestions.data_points?.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <BarChart3 className="w-3 h-3 text-violet-600" />
                <h4 className="text-xs font-medium text-violet-900 dark:text-violet-100">
                  Data Points
                </h4>
              </div>
              <div className="space-y-1">
                {suggestions.data_points.map((data, i) => (
                  <div
                    key={i}
                    className="group p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-violet-100 dark:border-violet-800"
                  >
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">{data}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyContent(data)}
                      className="h-5 text-[10px] text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      + Add to slide
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-xs text-gray-500 mb-3">Get AI-powered suggestions for this slide</p>
          <Button
            size="sm"
            onClick={generateSuggestions}
            className="bg-violet-600 hover:bg-violet-700 h-8 text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Generate Suggestions
          </Button>
        </div>
      )}
    </Card>
  );
}
