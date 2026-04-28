import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Star,
  Loader2,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GBPManager({ listing }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [generatingResponse, setGeneratingResponse] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [generatingPost, setGeneratingPost] = useState(false);

  const analyzeGBP = async () => {
    setAnalyzing(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this Google Business Profile listing and provide optimization recommendations:
      
      Business: ${listing.business_name}
      Address: ${listing.address}, ${listing.city}, ${listing.state} ${listing.zip_code}
      Phone: ${listing.phone}
      Rating: ${listing.rating} (${listing.review_count} reviews)
      
      Provide:
      1. Profile completeness score (0-100)
      2. Key optimization opportunities
      3. Review response recommendations
      4. Post suggestions for engagement
      5. Local SEO tips specific to this business
      6. Competitor insights for the area`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          completeness_score: { type: 'number' },
          optimization_tips: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                tip: { type: 'string' },
                priority: { type: 'string' },
                impact: { type: 'string' },
              },
            },
          },
          review_insights: {
            type: 'object',
            properties: {
              avg_response_time: { type: 'string' },
              sentiment_breakdown: {
                type: 'object',
                properties: {
                  positive: { type: 'number' },
                  neutral: { type: 'number' },
                  negative: { type: 'number' },
                },
              },
              common_themes: { type: 'array', items: { type: 'string' } },
              response_suggestions: { type: 'array', items: { type: 'string' } },
            },
          },
          post_ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
          local_seo_tips: { type: 'array', items: { type: 'string' } },
          competitor_insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                competitor: { type: 'string' },
                rating: { type: 'number' },
                strength: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setAnalysis(result);
    setAnalyzing(false);
  };

  const generateReviewResponse = async (reviewType) => {
    setGeneratingResponse(reviewType);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional ${reviewType} review response for ${listing.business_name}.
      
      The response should be:
      - Friendly and professional
      - Thank the customer
      - ${reviewType === 'positive' ? 'Express appreciation and invite them back' : 'Apologize, offer solution, and invite them to discuss offline'}
      - Include business name naturally
      - Be under 150 words`,
      response_json_schema: {
        type: 'object',
        properties: {
          response: { type: 'string' },
        },
      },
    });

    setGeneratingResponse(null);
    return result.response;
  };

  const generatePost = async (postType) => {
    setGeneratingPost(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a Google Business Profile ${postType} post for ${listing.business_name} located in ${listing.city}, ${listing.state}.
      
      The post should be:
      - Engaging and action-oriented
      - Include a clear call-to-action
      - Optimized for local search
      - Under 300 words
      - Include suggested image description`,
      response_json_schema: {
        type: 'object',
        properties: {
          post_content: { type: 'string' },
          suggested_image: { type: 'string' },
          cta_button: { type: 'string' },
        },
      },
    });

    setPostContent(result.post_content);
    setGeneratingPost(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) {
      return 'text-emerald-600';
    }
    if (score >= 60) {
      return 'text-amber-600';
    }
    return 'text-red-600';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Google Business Profile Manager
          </CardTitle>
          <Button onClick={analyzeGBP} disabled={analyzing} size="sm" className="gap-2">
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Analyze GBP
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Listing Overview */}
        <div className="p-4 bg-gray-50 rounded-xl mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{listing.business_name}</h3>
              <p className="text-sm text-gray-500">
                {listing.address}, {listing.city}, {listing.state}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">{listing.rating || 0}</span>
                  <span className="text-gray-400">({listing.review_count || 0})</span>
                </div>
                <Badge
                  className={
                    listing.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }
                >
                  {listing.status}
                </Badge>
              </div>
            </div>
            {analysis && (
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(analysis.completeness_score)}`}>
                  {analysis.completeness_score}%
                </p>
                <p className="text-xs text-gray-500">Profile Score</p>
              </div>
            )}
          </div>
        </div>

        {analyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="text-gray-600">Analyzing your Google Business Profile...</p>
          </div>
        )}

        {analysis && (
          <Tabs defaultValue="optimize" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="optimize">Optimize</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="local">Local SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="optimize" className="mt-4 space-y-3">
              {analysis.optimization_tips?.map((tip, idx) => (
                <div key={idx} className="p-3 bg-white border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {tip.category}
                        </Badge>
                        <Badge
                          className={
                            tip.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : tip.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {tip.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900">{tip.tip}</p>
                      <p className="text-xs text-gray-500 mt-1">Impact: {tip.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 space-y-4">
              {/* Sentiment Breakdown */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Review Sentiment</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">
                      {analysis.review_insights?.sentiment_breakdown?.positive || 0}% Positive
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">
                      {analysis.review_insights?.sentiment_breakdown?.negative || 0}% Negative
                    </span>
                  </div>
                </div>
              </div>

              {/* Common Themes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Common Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.review_insights?.common_themes?.map((theme, idx) => (
                    <Badge key={idx} variant="outline">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Response Templates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quick Response Templates</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => generateReviewResponse('positive')}
                    disabled={generatingResponse === 'positive'}
                    className="gap-2"
                  >
                    {generatingResponse === 'positive' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    Positive Response
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => generateReviewResponse('negative')}
                    disabled={generatingResponse === 'negative'}
                    className="gap-2"
                  >
                    {generatingResponse === 'negative' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsDown className="w-4 h-4" />
                    )}
                    Negative Response
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="posts" className="mt-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generatePost('update')}
                  disabled={generatingPost}
                >
                  <Sparkles className="w-4 h-4 mr-1" /> Update Post
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generatePost('offer')}
                  disabled={generatingPost}
                >
                  <Sparkles className="w-4 h-4 mr-1" /> Offer Post
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generatePost('event')}
                  disabled={generatingPost}
                >
                  <Sparkles className="w-4 h-4 mr-1" /> Event Post
                </Button>
              </div>

              {generatingPost && (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                </div>
              )}

              {postContent && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Label className="mb-2 block">Generated Post</Label>
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={5}
                  />
                  <Button className="mt-2 gap-2" size="sm">
                    <CheckCircle className="w-4 h-4" /> Copy to Clipboard
                  </Button>
                </div>
              )}

              {/* Post Ideas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Post Ideas</h4>
                <div className="space-y-2">
                  {analysis.post_ideas?.map((idea, idx) => (
                    <div key={idx} className="p-3 bg-white border rounded-lg">
                      <Badge variant="outline" className="text-xs mb-1">
                        {idea.type}
                      </Badge>
                      <p className="font-medium text-gray-900">{idea.title}</p>
                      <p className="text-sm text-gray-600">{idea.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="local" className="mt-4 space-y-4">
              {/* Local SEO Tips */}
              <div className="space-y-2">
                {analysis.local_seo_tips?.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-900">{tip}</p>
                  </div>
                ))}
              </div>

              {/* Competitor Insights */}
              {analysis.competitor_insights?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Nearby Competitors</h4>
                  <div className="space-y-2">
                    {analysis.competitor_insights.map((comp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{comp.competitor}</p>
                          <p className="text-xs text-gray-500">{comp.strength}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{comp.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!analysis && !analyzing && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Click "Analyze GBP" to get optimization recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
