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
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, X } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from '@/components/icons/BrandIcons';
import { toLocalISOString } from '@/utils/date';

const PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', icon: TwitterIcon, maxLength: 280 },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, maxLength: 3000 },
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon, maxLength: 63206 },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon, maxLength: 2200 },
];

export default function SchedulePostModal({
  open,
  onClose,
  post,
  accounts,
  onSave,
  onOptimize,
  isLoading,
  isOptimizing,
}) {
  const [formData, setFormData] = useState({
    platform: 'twitter',
    social_account_id: '',
    content: '',
    scheduled_time: '',
    hashtags: [],
    status: 'scheduled',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [scheduleError, setScheduleError] = useState('');
  const [newHashtag, setNewHashtag] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        platform: post.platform || 'twitter',
        social_account_id: post.social_account_id || '',
        content: post.content || '',
        scheduled_time: post.scheduled_time ? post.scheduled_time.slice(0, 16) : '',
        hashtags: post.hashtags || [],
        status: post.status || 'scheduled',
        timezone: post.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      setFormData({
        platform: 'twitter',
        social_account_id: accounts?.[0]?.id || '',
        content: '',
        scheduled_time: toLocalISOString(now),
        hashtags: [],
        status: 'scheduled',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [post, open, accounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(formData.scheduled_time) <= new Date()) {
      setScheduleError('Scheduled time must be in the future.');
      return;
    }
    setScheduleError('');
    onSave({
      ...formData,
      scheduled_time: new Date(formData.scheduled_time).toISOString(),
    });
  };

  const addHashtag = () => {
    if (newHashtag && !formData.hashtags.includes(newHashtag)) {
      setFormData({ ...formData, hashtags: [...formData.hashtags, newHashtag.replace('#', '')] });
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag) => {
    setFormData({ ...formData, hashtags: formData.hashtags.filter((t) => t !== tag) });
  };

  const handleOptimize = async () => {
    const optimized = await onOptimize(formData.content, formData.platform);
    if (optimized) {
      setFormData({
        ...formData,
        content: optimized.content || formData.content,
        hashtags: optimized.hashtags || formData.hashtags,
      });
    }
  };

  const selectedPlatform = PLATFORMS.find((p) => p.id === formData.platform);
  const charCount = formData.content.length;
  const isOverLimit = selectedPlatform && charCount > selectedPlatform.maxLength;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Scheduled Post' : 'Schedule New Post'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={formData.social_account_id}
                onValueChange={(value) => setFormData({ ...formData, social_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    ?.filter((a) => a.platform === formData.platform)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        @{a.account_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOptimize}
                disabled={isOptimizing || !formData.content}
                className="gap-1"
              >
                {isOptimizing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI Optimize
              </Button>
            </div>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              placeholder="What's on your mind?"
              required
            />
            <div className="flex justify-between text-xs">
              <span className={isOverLimit ? 'text-red-500' : 'text-gray-400'}>
                {charCount} / {selectedPlatform?.maxLength || '∞'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex gap-2">
              <Input
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                placeholder="Add hashtag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
              />
              <Button type="button" variant="outline" onClick={addHashtag}>
                Add
              </Button>
            </div>
            {formData.hashtags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {formData.hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    #{tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeHashtag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Schedule Time</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_time}
              min={toLocalISOString()}
              onChange={(e) => {
                setScheduleError('');
                setFormData({ ...formData, scheduled_time: e.target.value });
              }}
              required
            />
            {scheduleError && <p className="text-xs text-red-500">{scheduleError}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isOverLimit}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {post ? 'Update' : 'Schedule'} Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
