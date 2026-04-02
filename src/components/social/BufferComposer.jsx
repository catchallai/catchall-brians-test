import { useState } from 'react';
import { useHashtagPoolToggle } from '@/components/hooks/useHashtagPoolToggle';
import HashtagPoolSelector from '@/components/social/HashtagPoolSelector';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Image,
  Video,
  X,
  Loader2,
  Zap,
  Calendar,
  Clock,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Send,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { todayLocal } from '@/utils/date';

const PLATFORMS = [
  { id: 'Twitter', label: 'X (Twitter)', icon: Twitter, color: 'bg-black text-white', limit: 280 },
  {
    id: 'LinkedIn',
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700 text-white',
    limit: 3000,
  },
  {
    id: 'Facebook',
    label: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600 text-white',
    limit: 63206,
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: Instagram,
    color: 'bg-pink-600 text-white',
    limit: 2200,
  },
  { id: 'YouTube', label: 'YouTube', icon: Youtube, color: 'bg-red-600 text-white', limit: 5000 },
];

const DEFAULT_FORM = {
  title: '',
  caption: '',
  image_url: '',
  video_url: '',
  media_type: 'none',
  scheduled_date: todayLocal(),
  scheduled_time: '09:00',
  platforms: [],
  hashtags: [],
  status: 'draft',
  auto_post: false,
};

function PlatformPreview({ platform, caption, imageUrl, videoUrl }) {
  const PIcon = PLATFORMS.find((p) => p.id === platform)?.icon || Globe;
  const limit = PLATFORMS.find((p) => p.id === platform)?.limit || 280;
  const truncated = caption?.length > limit ? caption.slice(0, limit) + '…' : caption;

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {/* Platform header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
          <PIcon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">{platform}</p>
          <p className="text-xs text-gray-400">Your Account</p>
        </div>
      </div>

      {/* Media */}
      {imageUrl && <img src={imageUrl} alt="Preview" className="w-full object-cover max-h-48" />}
      {videoUrl && !imageUrl && (
        <video src={videoUrl} className="w-full max-h-48 object-cover" muted />
      )}
      {!imageUrl && !videoUrl && (
        <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          <Image className="w-8 h-8 text-gray-300" />
        </div>
      )}

      {/* Caption */}
      <div className="p-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
          {truncated || (
            <span className="text-gray-300 italic">Your caption will appear here…</span>
          )}
        </p>
        {caption?.length > 0 && (
          <p
            className={`text-xs mt-1 ${caption.length > limit ? 'text-red-500' : 'text-gray-400'}`}
          >
            {caption.length}/{limit}
          </p>
        )}
      </div>
    </div>
  );
}

export default function BufferComposer({ hashtagPool = [], onSuccess }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [uploading, setUploading] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState('Twitter');
  const [saved, setSaved] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const { _activeHashtags, toggledPoolIds, handleTogglePool } = useHashtagPoolToggle({
    hashtagPool,
    form,
    setForm,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setForm({ ...DEFAULT_FORM });
      onSuccess?.();
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url, video_url: '', media_type: 'image' }));
    setUploading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, video_url: file_url, image_url: '', media_type: 'video' }));
    setUploading(false);
  };

  const togglePlatform = (id) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id],
    }));
    setPreviewPlatform(id);
  };

  const handleSubmit = (status = 'draft') => {
    if (status !== 'draft') {
      const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}`);
      if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        setScheduleError('Scheduled time must be in the future.');
        return;
      }
    }
    setScheduleError('');
    createMutation.mutate({ ...form, status });
  };

  const activePlatformLimit = PLATFORMS.find((p) => p.id === previewPlatform)?.limit || 280;
  const overLimit = form.caption.length > activePlatformLimit;

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT: Composer */}
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compose</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and schedule posts across all your platforms
          </p>
        </div>

        {/* Platform Selector */}
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Publish to
          </Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ id, label: _label, icon: Icon }) => {
              const active = form.platforms.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => togglePlatform(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media Upload */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
          {form.image_url ? (
            <div className="relative">
              <img
                src={form.image_url}
                alt="Preview"
                className="w-full rounded-lg object-contain max-h-64 bg-gray-50"
              />
              <button
                onClick={() => setForm((f) => ({ ...f, image_url: '', media_type: 'none' }))}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : form.video_url ? (
            <div className="relative">
              <video src={form.video_url} controls className="w-full rounded-lg max-h-64" />
              <button
                onClick={() => setForm((f) => ({ ...f, video_url: '', media_type: 'none' }))}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-7 h-7 animate-spin text-violet-500 mb-2" />
              <p className="text-sm text-gray-500">Uploading…</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 justify-center py-4">
              <label className="cursor-pointer flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Image className="w-6 h-6 text-blue-500" />
                <span className="text-xs text-gray-500 font-medium">Photo</span>
              </label>
              <label className="cursor-pointer flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
                <Video className="w-6 h-6 text-purple-500" />
                <span className="text-xs text-gray-500 font-medium">Video</span>
              </label>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Caption
          </Label>
          <Textarea
            value={form.caption}
            onChange={(e) => {
              const newCaption = e.target.value;
              setForm((f) => ({
                ...f,
                caption: newCaption,
                // Reset tracked hashtags when the caption no longer contains any,
                // so that the next addHashtag call correctly inserts a blank line.
                hashtags: /#\w+/.test(newCaption) ? f.hashtags : [],
              }));
            }}
            placeholder="What do you want to share?"
            rows={5}
            className={`resize-none ${overLimit ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
          />
          <div className="flex justify-end">
            <span className={`text-xs font-medium ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
              {form.caption.length} / {activePlatformLimit}
            </span>
          </div>

          {/* Hashtag Pool */}
          <HashtagPoolSelector
            pools={hashtagPool}
            toggledPoolIds={toggledPoolIds}
            onToggle={handleTogglePool}
          />
        </div>

        {/* Schedule & Title */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Title (optional)
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Post headline…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </Label>
            <Input
              type="date"
              value={form.scheduled_date}
              min={todayLocal()}
              onChange={(e) => {
                setScheduleError('');
                setForm((f) => ({ ...f, scheduled_date: e.target.value }));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time
            </Label>
            <Input
              type="time"
              value={form.scheduled_time}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-500" /> Auto-Post
            </Label>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={form.auto_post}
                onCheckedChange={(v) => setForm((f) => ({ ...f, auto_post: v }))}
              />
              <span className="text-sm text-gray-500">{form.auto_post ? 'On' : 'Off'}</span>
            </div>
          </div>
        </div>

        {scheduleError && <p className="text-xs text-red-500">{scheduleError}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => handleSubmit('draft')}
            disabled={createMutation.isPending || !form.caption}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button
            className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
            onClick={() => handleSubmit('pending_approval')}
            disabled={createMutation.isPending || !form.caption || form.platforms.length === 0}
          >
            <Send className="w-4 h-4" />
            Schedule Post
          </Button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Post saved successfully!
          </div>
        )}
      </div>

      {/* RIGHT: Live Preview */}
      <div className="w-80 shrink-0 space-y-4">
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Live Preview
          </Label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PLATFORMS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPreviewPlatform(id)}
                className={`p-1.5 rounded-lg border transition-all ${previewPlatform === id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Icon
                  className={`w-4 h-4 ${previewPlatform === id ? 'text-violet-600' : 'text-gray-400'}`}
                />
              </button>
            ))}
          </div>
          <PlatformPreview
            platform={previewPlatform}
            caption={form.caption}
            imageUrl={form.image_url}
            videoUrl={form.video_url}
          />
        </div>

        {/* Selected platforms summary */}
        {form.platforms.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Scheduling to
            </p>
            <div className="flex flex-wrap gap-1.5">
              {form.platforms.map((p) => {
                const meta = PLATFORMS.find((pl) => pl.id === p);
                const Icon = meta?.icon || Globe;
                return (
                  <div
                    key={p}
                    className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5"
                  >
                    <Icon className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">{p}</span>
                  </div>
                );
              })}
            </div>
            {form.scheduled_date && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(form.scheduled_date + 'T' + form.scheduled_time).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
