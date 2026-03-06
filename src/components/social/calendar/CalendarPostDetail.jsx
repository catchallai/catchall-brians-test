import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Calendar, Clock, Image as ImageIcon, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  pending_approval: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  published: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'TikTok'];

export default function CalendarPostDetail({ post, onClose, onSave }) {
  const [form, setForm] = useState({
    title: post.title || '',
    caption: post.caption || '',
    scheduled_date: post.scheduled_date || '',
    scheduled_time: post.scheduled_time || '10:00',
    platforms: post.platforms || ['Instagram'],
    hashtags: (post.hashtags || []).join(', '),
    status: post.status || 'draft',
  });
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: brief } = useQuery({
    queryKey: ['brief', post.campaign_brief_id],
    queryFn: () => post.campaign_brief_id 
      ? base44.entities.CampaignBrief.filter({ id: post.campaign_brief_id }).then(r => r[0])
      : null,
    enabled: !!post.campaign_brief_id,
  });

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) 
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.CalendarPost.update(post.id, {
        title: form.title,
        caption: form.caption,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        platforms: form.platforms,
        hashtags: form.hashtags.split(',').map(h => h.trim()).filter(Boolean),
        status: form.status,
      });
      qc.invalidateQueries({ queryKey: ['calendar-posts'] });
      onSave?.();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Post Details</h2>
            <Badge className={`${STATUS_COLORS[form.status] || STATUS_COLORS.draft}`}>
              {form.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Campaign Brief */}
          {brief && (
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Campaign Brief</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{brief.title}</p>
              {brief.focal_point && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{brief.focal_point}</p>}
            </div>
          )}

          {/* Image Preview */}
          {post.image_url && (
            <div className="rounded-lg overflow-hidden max-h-48">
              <img src={post.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Title</label>
            <Input 
              value={form.title} 
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Post title (optional)"
              className="mt-1"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Caption</label>
            <Textarea 
              value={form.caption} 
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Post caption text"
              className="mt-1 min-h-[100px] resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <Input 
                type="date"
                value={form.scheduled_date} 
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Time
              </label>
              <Input 
                type="time"
                value={form.scheduled_time} 
                onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Platforms</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PLATFORMS.map(p => (
                <button 
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    form.platforms.includes(p)
                      ? 'border-violet-400 bg-violet-600 text-white'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Hashtags</label>
            <Input 
              value={form.hashtags} 
              onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))}
              placeholder="Comma-separated hashtags (no # symbol)"
              className="mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Status</label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}