import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Loader2,
  Sparkles,
  Target,
  ListOrdered,
  Clock,
  BookOpen,
  Copy,
  CheckCircle,
} from 'lucide-react';

export default function ContentOutlineGenerator({ selectedTopic }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [outline, setOutline] = useState(null);
  const [topic, setTopic] = useState(selectedTopic?.topic || '');
  const [contentType, setContentType] = useState(selectedTopic?.content_type || 'blog');
  const [targetKeyword, setTargetKeyword] = useState(selectedTopic?.keyword || '');
  const [copied, setCopied] = useState(false);

  const generateOutline = async () => {
    if (!topic.trim()) {
      return;
    }
    setIsGenerating(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a comprehensive content outline for:
      Topic: ${topic}
      Content type: ${contentType}
      Target keyword: ${targetKeyword || topic}
      
      Generate a detailed outline that includes:
      
      1. SEO-OPTIMIZED TITLE OPTIONS (3 options):
         - Include power words
         - Include the target keyword
         - Optimize for click-through rate
      
      2. META DESCRIPTION (2 options):
         - 155-160 characters
         - Include target keyword
         - Include call-to-action
      
      3. INTRODUCTION HOOK:
         - Attention-grabbing opening
         - Problem statement
         - Promise of value
      
      4. MAIN SECTIONS (5-8 sections):
         For each section provide:
         - H2 heading
         - Key points to cover (3-5 bullet points)
         - Suggested word count
         - Internal linking opportunities
         - Any media suggestions (images, videos, charts)
      
      5. CONCLUSION:
         - Summary points
         - Call-to-action
         - Next steps for reader
      
      6. SEO RECOMMENDATIONS:
         - Primary keyword placement
         - Secondary keywords to include
         - LSI keywords
         - Suggested internal links
         - External link opportunities
      
      7. CONTENT SPECIFICATIONS:
         - Recommended total word count
         - Reading time estimate
         - Difficulty level
         - Target audience`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          title_options: { type: 'array', items: { type: 'string' } },
          meta_descriptions: { type: 'array', items: { type: 'string' } },
          introduction: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              problem: { type: 'string' },
              value_promise: { type: 'string' },
            },
          },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                heading: { type: 'string' },
                key_points: { type: 'array', items: { type: 'string' } },
                word_count: { type: 'number' },
                internal_links: { type: 'array', items: { type: 'string' } },
                media_suggestions: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          conclusion: {
            type: 'object',
            properties: {
              summary_points: { type: 'array', items: { type: 'string' } },
              cta: { type: 'string' },
              next_steps: { type: 'array', items: { type: 'string' } },
            },
          },
          seo: {
            type: 'object',
            properties: {
              primary_keyword_placement: { type: 'array', items: { type: 'string' } },
              secondary_keywords: { type: 'array', items: { type: 'string' } },
              lsi_keywords: { type: 'array', items: { type: 'string' } },
              internal_link_suggestions: { type: 'array', items: { type: 'string' } },
              external_link_topics: { type: 'array', items: { type: 'string' } },
            },
          },
          specifications: {
            type: 'object',
            properties: {
              word_count: { type: 'number' },
              reading_time: { type: 'string' },
              difficulty: { type: 'string' },
              target_audience: { type: 'string' },
            },
          },
        },
      },
    });

    setOutline(result);
    setIsGenerating(false);
  };

  const copyOutline = () => {
    if (!outline) {
      return;
    }

    let text = `# ${outline.title_options?.[0] || topic}\n\n`;
    text += `## Introduction\n${outline.introduction?.hook}\n\n`;

    outline.sections?.forEach((section) => {
      text += `## ${section.heading}\n`;
      section.key_points?.forEach((point) => {
        text += `- ${point}\n`;
      });
      text += `\n`;
    });

    text += `## Conclusion\n${outline.conclusion?.cta}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    if (selectedTopic) {
      setTopic(selectedTopic.topic || '');
      setContentType(selectedTopic.content_type || 'blog');
      setTargetKeyword(selectedTopic.keyword || '');
    }
  }, [selectedTopic]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-500" />
          Content Outline Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Content topic or title"
            className="md:col-span-2"
          />
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blog">Blog Post</SelectItem>
              <SelectItem value="guide">Ultimate Guide</SelectItem>
              <SelectItem value="how-to">How-To Article</SelectItem>
              <SelectItem value="listicle">Listicle</SelectItem>
              <SelectItem value="comparison">Comparison</SelectItem>
              <SelectItem value="case-study">Case Study</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            value={targetKeyword}
            onChange={(e) => setTargetKeyword(e.target.value)}
            placeholder="Target keyword"
            className="flex-1"
          />
          <Button
            onClick={generateOutline}
            disabled={isGenerating || !topic.trim()}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Outline
          </Button>
        </div>

        {isGenerating && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Generating content outline...</p>
                <p className="text-sm text-violet-600">
                  Creating SEO-optimized structure and recommendations
                </p>
              </div>
            </div>
          </div>
        )}

        {outline && (
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {/* Copy Button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={copyOutline} className="gap-2">
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Outline'}
                </Button>
              </div>

              {/* Specifications */}
              {outline.specifications && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <BookOpen className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{outline.specifications.word_count}</p>
                    <p className="text-xs text-gray-500">Words</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{outline.specifications.reading_time}</p>
                    <p className="text-xs text-gray-500">Read Time</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <ListOrdered className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-lg font-bold">{outline.sections?.length || 0}</p>
                    <p className="text-xs text-gray-500">Sections</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <Target className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium truncate">
                      {outline.specifications.difficulty}
                    </p>
                    <p className="text-xs text-gray-500">Level</p>
                  </div>
                </div>
              )}

              {/* Title Options */}
              {outline.title_options?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Title Options</h4>
                  <div className="space-y-2">
                    {outline.title_options.map((title, idx) => (
                      <div key={idx} className="p-3 bg-violet-50 rounded-lg">
                        <span className="font-medium text-gray-900">{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Descriptions */}
              {outline.meta_descriptions?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Meta Descriptions</h4>
                  <div className="space-y-2">
                    {outline.meta_descriptions.map((meta, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">{meta}</p>
                        <p className="text-xs text-gray-400 mt-1">{meta.length} characters</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Introduction */}
              {outline.introduction && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Introduction</h4>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg space-y-3">
                    <div>
                      <p className="text-xs font-medium text-emerald-700 mb-1">Hook</p>
                      <p className="text-sm text-gray-700">{outline.introduction.hook}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700 mb-1">Problem Statement</p>
                      <p className="text-sm text-gray-700">{outline.introduction.problem}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700 mb-1">Value Promise</p>
                      <p className="text-sm text-gray-700">{outline.introduction.value_promise}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Sections */}
              {outline.sections?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Content Sections</h4>
                  <div className="space-y-3">
                    {outline.sections.map((section, idx) => (
                      <div key={idx} className="p-4 bg-white border border-gray-100 rounded-lg">
                        <div className="flex items-start justify-between">
                          <h5 className="font-medium text-gray-900">
                            <span className="text-violet-500 mr-2">H2:</span>
                            {section.heading}
                          </h5>
                          <Badge variant="outline">{section.word_count} words</Badge>
                        </div>
                        <ul className="mt-3 space-y-1">
                          {section.key_points?.map((point, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-violet-400">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                        {section.media_suggestions?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Media suggestions:</p>
                            <div className="flex flex-wrap gap-1">
                              {section.media_suggestions.map((media, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {media}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion */}
              {outline.conclusion && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Conclusion</h4>
                  <div className="p-4 bg-amber-50 rounded-lg space-y-3">
                    {outline.conclusion.summary_points?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1">Key Takeaways</p>
                        <ul className="space-y-1">
                          {outline.conclusion.summary_points.map((point, i) => (
                            <li key={i} className="text-sm text-gray-700">
                              • {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-amber-700 mb-1">Call to Action</p>
                      <p className="text-sm text-gray-700">{outline.conclusion.cta}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Recommendations */}
              {outline.seo && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">SEO Recommendations</h4>
                  <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                    {outline.seo.secondary_keywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-1">Secondary Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {outline.seo.secondary_keywords.map((kw, i) => (
                            <Badge key={i} className="bg-blue-100 text-blue-700">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {outline.seo.lsi_keywords?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-1">LSI Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {outline.seo.lsi_keywords.map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {outline.seo.internal_link_suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Internal Link Opportunities
                        </p>
                        <ul className="space-y-1">
                          {outline.seo.internal_link_suggestions.map((link, i) => (
                            <li key={i} className="text-sm text-gray-700">
                              → {link}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
