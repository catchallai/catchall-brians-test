import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, PenTool, Trash2, Star, Loader2, X } from 'lucide-react';

export default function BrandVoiceSettings({ brandVoices }) {
  const [showModal, setShowModal] = useState(false);
  const [editingVoice, setEditingVoice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    tone: [],
    vocabulary: [],
    avoid_words: [],
    sample_content: '',
    guidelines: '',
    is_default: false,
  });
  const [newTone, setNewTone] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newAvoid, setNewAvoid] = useState('');
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingVoice
        ? base44.entities.BrandVoice.update(editingVoice.id, data)
        : base44.entities.BrandVoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-voices'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BrandVoice.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-voices'] }),
  });

  const handleEdit = (voice) => {
    setEditingVoice(voice);
    setFormData({
      name: voice.name || '',
      tone: voice.tone || [],
      vocabulary: voice.vocabulary || [],
      avoid_words: voice.avoid_words || [],
      sample_content: voice.sample_content || '',
      guidelines: voice.guidelines || '',
      is_default: voice.is_default || false,
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingVoice(null);
    setFormData({
      name: '',
      tone: [],
      vocabulary: [],
      avoid_words: [],
      sample_content: '',
      guidelines: '',
      is_default: false,
    });
  };

  const addToArray = (field, value, setter) => {
    if (value && !formData[field].includes(value)) {
      setFormData({ ...formData, [field]: [...formData[field], value] });
      setter('');
    }
  };

  const removeFromArray = (field, value) => {
    setFormData({ ...formData, [field]: formData[field].filter((v) => v !== value) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Brand Voice Profiles</h3>
          <p className="text-sm text-gray-500">
            Define your brand's writing style for AI-generated content
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Voice Profile
        </Button>
      </div>

      {brandVoices.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-12 text-center">
            <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              No Brand Voices Defined
            </h3>
            <p className="text-gray-500 mb-4">
              Create a brand voice profile to ensure consistent AI-generated content
            </p>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Voice Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brandVoices.map((voice) => (
            <Card key={voice.id} className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <PenTool className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{voice.name}</h4>
                      {voice.is_default && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(voice)}>
                      <PenTool className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => deleteMutation.mutate(voice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {voice.tone?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Tone:</p>
                    <div className="flex flex-wrap gap-1">
                      {voice.tone.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {voice.guidelines && (
                  <p className="text-sm text-gray-500 line-clamp-2">{voice.guidelines}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVoice ? 'Edit' : 'Create'} Brand Voice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Profile Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Professional Blog, Casual Social"
              />
            </div>

            <div>
              <Label>Tone (e.g., Professional, Friendly, Authoritative)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  placeholder="Add tone"
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('tone', newTone, setNewTone)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray('tone', newTone, setNewTone)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tone.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => removeFromArray('tone', t)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Vocabulary</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Add word/phrase"
                  onKeyPress={(e) =>
                    e.key === 'Enter' && addToArray('vocabulary', newWord, setNewWord)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray('vocabulary', newWord, setNewWord)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.vocabulary.map((w) => (
                  <Badge key={w} variant="secondary" className="gap-1">
                    {w}
                    <button onClick={() => removeFromArray('vocabulary', w)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Words to Avoid</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newAvoid}
                  onChange={(e) => setNewAvoid(e.target.value)}
                  placeholder="Add word to avoid"
                  onKeyPress={(e) =>
                    e.key === 'Enter' && addToArray('avoid_words', newAvoid, setNewAvoid)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray('avoid_words', newAvoid, setNewAvoid)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.avoid_words.map((w) => (
                  <Badge key={w} variant="outline" className="gap-1 bg-red-50 text-red-700">
                    {w}
                    <button onClick={() => removeFromArray('avoid_words', w)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Style Guidelines</Label>
              <Textarea
                value={formData.guidelines}
                onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                placeholder="Additional writing guidelines..."
                rows={3}
              />
            </div>

            <div>
              <Label>Sample Content (for AI training)</Label>
              <Textarea
                value={formData.sample_content}
                onChange={(e) => setFormData({ ...formData, sample_content: e.target.value })}
                placeholder="Paste an example of your preferred writing style..."
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Set as Default</Label>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(v) => setFormData({ ...formData, is_default: v })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.name}
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
