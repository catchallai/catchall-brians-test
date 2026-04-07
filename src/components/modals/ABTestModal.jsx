import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, X } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from '@/components/icons/BrandIcons';

const PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', icon: TwitterIcon },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
];

export default function ABTestModal({
  open,
  onClose,
  test,
  accounts,
  onSave,
  onGenerateVariant,
  isLoading,
  isGenerating,
}) {
  const [formData, setFormData] = useState({
    name: '',
    platform: 'twitter',
    social_account_id: '',
    variant_a: { content: '', hashtags: [] },
    variant_b: { content: '', hashtags: [] },
    status: 'draft',
  });
  const [newHashtagA, setNewHashtagA] = useState('');
  const [newHashtagB, setNewHashtagB] = useState('');

  useEffect(() => {
    if (test) {
      setFormData({
        name: test.name || '',
        platform: test.platform || 'twitter',
        social_account_id: test.social_account_id || '',
        variant_a: test.variant_a || { content: '', hashtags: [] },
        variant_b: test.variant_b || { content: '', hashtags: [] },
        status: test.status || 'draft',
      });
    } else {
      setFormData({
        name: '',
        platform: 'twitter',
        social_account_id: accounts?.[0]?.id || '',
        variant_a: { content: '', hashtags: [] },
        variant_b: { content: '', hashtags: [] },
        status: 'draft',
      });
    }
  }, [test, open, accounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addHashtag = (variant, value, setter) => {
    if (value && !formData[variant].hashtags?.includes(value)) {
      setFormData({
        ...formData,
        [variant]: {
          ...formData[variant],
          hashtags: [...(formData[variant].hashtags || []), value.replace('#', '')],
        },
      });
      setter('');
    }
  };

  const removeHashtag = (variant, tag) => {
    setFormData({
      ...formData,
      [variant]: {
        ...formData[variant],
        hashtags: formData[variant].hashtags.filter((t) => t !== tag),
      },
    });
  };

  const handleGenerateVariant = async (variant) => {
    const baseContent =
      variant === 'variant_a' ? formData.variant_b.content : formData.variant_a.content;
    const generated = await onGenerateVariant(baseContent, formData.platform);
    if (generated) {
      setFormData({
        ...formData,
        [variant]: {
          content: generated.content || formData[variant].content,
          hashtags: generated.hashtags || formData[variant].hashtags,
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test ? 'Edit A/B Test' : 'Create A/B Test'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., CTA Comparison Test"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="inline-flex items-center gap-2">
                        <p.icon className="w-4 h-4" />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="variant_a" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="variant_a">Variant A</TabsTrigger>
              <TabsTrigger value="variant_b">Variant B</TabsTrigger>
            </TabsList>

            <TabsContent value="variant_a" className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateVariant('variant_a')}
                  disabled={isGenerating || !formData.variant_b.content}
                  className="gap-1"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Generate from B
                </Button>
              </div>
              <Textarea
                value={formData.variant_a.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variant_a: { ...formData.variant_a, content: e.target.value },
                  })
                }
                rows={4}
                placeholder="Write your first variant..."
              />
              <div className="flex gap-2">
                <Input
                  value={newHashtagA}
                  onChange={(e) => setNewHashtagA(e.target.value)}
                  placeholder="Add hashtag"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addHashtag('variant_a', newHashtagA, setNewHashtagA))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addHashtag('variant_a', newHashtagA, setNewHashtagA)}
                >
                  Add
                </Button>
              </div>
              {formData.variant_a.hashtags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {formData.variant_a.hashtags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      #{tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeHashtag('variant_a', tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="variant_b" className="space-y-3">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateVariant('variant_b')}
                  disabled={isGenerating || !formData.variant_a.content}
                  className="gap-1"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Generate from A
                </Button>
              </div>
              <Textarea
                value={formData.variant_b.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    variant_b: { ...formData.variant_b, content: e.target.value },
                  })
                }
                rows={4}
                placeholder="Write your second variant..."
              />
              <div className="flex gap-2">
                <Input
                  value={newHashtagB}
                  onChange={(e) => setNewHashtagB(e.target.value)}
                  placeholder="Add hashtag"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addHashtag('variant_b', newHashtagB, setNewHashtagB))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addHashtag('variant_b', newHashtagB, setNewHashtagB)}
                >
                  Add
                </Button>
              </div>
              {formData.variant_b.hashtags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {formData.variant_b.hashtags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      #{tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeHashtag('variant_b', tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {test ? 'Update' : 'Create'} Test
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
