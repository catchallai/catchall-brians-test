import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, FileText, Plus, X } from 'lucide-react';

export default function ContentBriefModal({ open, onClose, idea }) {
  const [formData, setFormData] = useState({
    title: '',
    target_keyword: '',
    secondary_keywords: [],
    word_count_target: 1500,
    tone: '',
    target_audience: '',
    outline: [],
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title || '',
        target_keyword: idea.target_keyword || '',
        secondary_keywords: [],
        word_count_target: 1500,
        tone: '',
        target_audience: '',
        outline: [],
      });
    }
  }, [idea, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentBrief.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-briefs'] });
      if (idea) {
        base44.entities.ContentIdea.update(idea.id, { status: 'brief_created' });
        queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      }
      onClose();
    },
  });

  const generateBrief = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive SEO content brief for:
Title: ${formData.title}
Target Keyword: ${formData.target_keyword}

Generate:
- 5-7 secondary keywords
- Content outline with H2 headings
- 5 questions to answer
- Recommended tone
- Target audience description
- Word count recommendation`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            secondary_keywords: { type: 'array', items: { type: 'string' } },
            outline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  heading: { type: 'string' },
                  type: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
            questions_to_answer: { type: 'array', items: { type: 'string' } },
            tone: { type: 'string' },
            target_audience: { type: 'string' },
            word_count_target: { type: 'number' },
          },
        },
      });

      setFormData({
        ...formData,
        secondary_keywords: result.secondary_keywords || [],
        outline: result.outline || [],
        tone: result.tone || '',
        target_audience: result.target_audience || '',
        word_count_target: result.word_count_target || 1500,
      });
    } catch (error) {
      console.error('Failed to generate brief:', error);
    }
    setIsGenerating(false);
  };

  const addKeyword = () => {
    if (newKeyword && !formData.secondary_keywords.includes(newKeyword)) {
      setFormData({
        ...formData,
        secondary_keywords: [...formData.secondary_keywords, newKeyword],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw) => {
    setFormData({
      ...formData,
      secondary_keywords: formData.secondary_keywords.filter((k) => k !== kw),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Content Brief
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Article title"
            />
          </div>

          <div>
            <Label>Target Keyword *</Label>
            <Input
              value={formData.target_keyword}
              onChange={(e) => setFormData({ ...formData, target_keyword: e.target.value })}
              placeholder="Primary keyword"
            />
          </div>

          <div>
            <Label>Secondary Keywords</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <Button type="button" variant="outline" onClick={addKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.secondary_keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Word Count Target</Label>
              <Input
                type="number"
                value={formData.word_count_target}
                onChange={(e) =>
                  setFormData({ ...formData, word_count_target: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Input
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                placeholder="e.g., Professional, Friendly"
              />
            </div>
          </div>

          <div>
            <Label>Target Audience</Label>
            <Textarea
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              placeholder="Describe your target reader..."
              rows={2}
            />
          </div>

          {formData.outline.length > 0 && (
            <div>
              <Label>Content Outline</Label>
              <div className="space-y-2 mt-2">
                {formData.outline.map((item, i) => (
                  <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="font-medium text-sm">{item.heading}</p>
                    {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={generateBrief}
              disabled={isGenerating || !formData.title || !formData.target_keyword}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Generate
            </Button>
            <Button
              onClick={() => saveMutation.mutate({ ...formData, idea_id: idea?.id })}
              disabled={saveMutation.isPending || !formData.title || !formData.target_keyword}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Brief
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
