import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Check, RefreshCw, Send } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from '@/components/icons/BrandIcons';

const CONTENT_TYPES = [
  { id: 'social_post', label: 'Social Media Post', icon: '📱' },
  { id: 'email_campaign', label: 'Email Campaign', icon: '📧' },
  { id: 'blog_outline', label: 'Blog Post Outline', icon: '📝' },
];

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual & Friendly' },
  { id: 'humorous', label: 'Humorous' },
  { id: 'urgent', label: 'Urgent/FOMO' },
  { id: 'inspirational', label: 'Inspirational' },
];

const SOCIAL_PLATFORM_OPTIONS = [
  { id: 'twitter', label: 'Twitter', icon: TwitterIcon },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
];

export default function ContentGeneratorCard({
  insights,
  competitors,
  abTests,
  onGenerate,
  isGenerating,
  onSchedulePost,
}) {
  const [contentType, setContentType] = useState('social_post');
  const [platform, setPlatform] = useState('twitter');
  const [tone, setTone] = useState('professional');
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  const trendingTopics = insights?.flatMap((i) => i.trending_topics || []).slice(0, 10) || [];
  const emergingTrends = insights?.flatMap((i) => i.emerging_trends || []).slice(0, 5) || [];
  const competitorStrengths = competitors?.flatMap((c) => c.top_content || []).slice(0, 5) || [];
  const winningVariants =
    abTests
      ?.filter((t) => t.status === 'completed' && t.winner)
      .map((t) => (t.winner === 'a' ? t.variant_a?.content : t.variant_b?.content))
      .filter(Boolean)
      .slice(0, 3) || [];

  const handleGenerate = async () => {
    const result = await onGenerate({
      contentType,
      platform,
      tone,
      topic,
      trendingTopics,
      emergingTrends: emergingTrends.map((t) => t.topic || t),
      competitorInsights: competitorStrengths,
      winningContent: winningVariants,
    });
    if (result) {
      setGeneratedContent(result);
    }
  };

  const handleCopy = () => {
    const textToCopy =
      contentType === 'blog_outline'
        ? generatedContent?.outline?.join('\n')
        : generatedContent?.content;
    navigator.clipboard.writeText(textToCopy || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseForScheduling = () => {
    if (generatedContent?.content && contentType === 'social_post') {
      onSchedulePost({
        content: generatedContent.content,
        platform,
        hashtags: generatedContent.hashtags || [],
      });
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          AI Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Topic Suggestions */}
        {(trendingTopics.length > 0 || emergingTrends.length > 0) && (
          <div>
            <Label className="text-xs text-gray-500">Quick topics from your insights:</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                ...trendingTopics.slice(0, 5),
                ...emergingTrends.map((t) => t.topic || t).slice(0, 3),
              ].map((t, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-violet-50 text-xs"
                  onClick={() => setTopic(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="mr-1">{t.icon}</span> {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {contentType === 'social_post' && (
            <div className="space-y-1">
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="inline-flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-1">
          <Label className="text-xs">Topic or Brief</Label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Describe what you want to write about, or leave empty to use trending topics..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate Content
        </Button>

        {/* Generated Content */}
        {generatedContent && (
          <div className="mt-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-violet-700">Generated Content</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="h-7"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {contentType === 'social_post' && (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {generatedContent.content}
                </p>
                {generatedContent.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {generatedContent.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-blue-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <Button size="sm" onClick={handleUseForScheduling} className="gap-1 mt-2">
                  <Send className="w-3 h-3" /> Use for Scheduling
                </Button>
              </>
            )}

            {contentType === 'email_campaign' && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Subject Line:</span>
                  <p className="text-sm font-medium text-gray-900">{generatedContent.subject}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Preview Text:</span>
                  <p className="text-xs text-gray-600">{generatedContent.preview}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Body:</span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {generatedContent.content}
                  </p>
                </div>
                {generatedContent.cta && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">CTA:</span>
                    <Badge className="ml-2 bg-violet-100 text-violet-700">
                      {generatedContent.cta}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {contentType === 'blog_outline' && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Title:</span>
                  <p className="text-sm font-medium text-gray-900">{generatedContent.title}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Outline:</span>
                  <ul className="mt-1 space-y-1">
                    {generatedContent.outline?.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-violet-500 font-medium">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {generatedContent.keywords?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">SEO Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedContent.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
