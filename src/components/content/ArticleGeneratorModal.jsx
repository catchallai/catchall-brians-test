import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wand2, CheckCircle } from 'lucide-react';

export default function ArticleGeneratorModal({ open, onClose, briefs, brandVoices }) {
  const [selectedBrief, setSelectedBrief] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const queryClient = useQueryClient();

  const brief = briefs.find((b) => b.id === selectedBrief);
  const voice = brandVoices.find((v) => v.id === selectedVoice);

  const generateArticle = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      setProgress(20);

      const title = brief?.title || customTitle;
      const keyword = brief?.target_keyword || customKeyword;
      const voiceGuidelines = voice
        ? `
Tone: ${voice.tone?.join(', ')}
Vocabulary to use: ${voice.vocabulary?.join(', ')}
Words to avoid: ${voice.avoid_words?.join(', ')}
Guidelines: ${voice.guidelines}`
        : '';

      setProgress(40);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a comprehensive, SEO-optimized article:

Title: ${title}
Target Keyword: ${keyword}
Secondary Keywords: ${brief?.secondary_keywords?.join(', ') || ''}
Word Count Target: ${wordCount}

${
  brief?.outline?.length
    ? `Outline:
${brief.outline.map((o) => `- ${o.heading}`).join('\n')}`
    : ''
}

${voiceGuidelines}

Write in markdown format with proper H2/H3 headings.
Include the target keyword naturally throughout.
Make it engaging, informative, and actionable.`,
        response_json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            meta_title: { type: 'string' },
            meta_description: { type: 'string' },
            word_count: { type: 'number' },
            seo_score: { type: 'number' },
            readability_score: { type: 'number' },
          },
        },
      });

      setProgress(80);

      const article = await base44.entities.GeneratedArticle.create({
        brief_id: selectedBrief || null,
        title,
        content: result.content,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        word_count: result.word_count,
        seo_score: result.seo_score || 85,
        readability_score: result.readability_score || 80,
        brand_voice_match: voice ? 90 : 0,
        status: 'draft',
      });

      setProgress(100);
      setGeneratedArticle(article);
      queryClient.invalidateQueries({ queryKey: ['generated-articles'] });
    } catch (error) {
      console.error('Generation failed:', error);
    }
    setIsGenerating(false);
  };

  const handleClose = () => {
    setGeneratedArticle(null);
    setProgress(0);
    setSelectedBrief('');
    setCustomTitle('');
    setCustomKeyword('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generate Article
          </DialogTitle>
        </DialogHeader>

        {generatedArticle ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Article Generated!
            </h3>
            <p className="text-gray-500 mb-4">
              {generatedArticle.word_count} words • SEO Score: {generatedArticle.seo_score}%
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button>View Article</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {briefs.length > 0 && (
              <div>
                <Label>Use Content Brief (Optional)</Label>
                <Select value={selectedBrief} onValueChange={setSelectedBrief}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brief or write custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Custom Article</SelectItem>
                    {briefs.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!selectedBrief && (
              <>
                <div>
                  <Label>Article Title *</Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter article title"
                  />
                </div>
                <div>
                  <Label>Target Keyword *</Label>
                  <Input
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    placeholder="Primary keyword"
                  />
                </div>
              </>
            )}

            <div>
              <Label>Brand Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Default tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Default</SelectItem>
                  {brandVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Word Count Target</Label>
              <Input
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
              />
            </div>

            {isGenerating && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Generating article...</span>
                  <span className="text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={generateArticle}
                disabled={isGenerating || (!selectedBrief && (!customTitle || !customKeyword))}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate Article
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
