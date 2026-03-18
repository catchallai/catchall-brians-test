import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, X, Image as ImageIcon, Smile, Hash, Link2, Plus, ChevronDown,
  Sparkles, Maximize2, Calendar, CheckCircle2, MessageSquare, GitBranch,
  Clock, Repeat, Zap, Send, FileText, ChevronRight, ShieldCheck
} from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PostComments from '../social/PostComments';
import PostApprovalPanel from '../social/PostApprovalPanel';
import Tooltip from '@/components/ui-custom/Tooltip';

const PLATFORMS = [
  { id: 'Facebook',  color: 'bg-blue-600',  letter: 'f',  label: 'Facebook',    limit: 63206 },
  { id: 'Instagram', color: 'bg-gradient-to-br from-pink-500 to-purple-600', letter: 'IG', label: 'Instagram', limit: 2200 },
  { id: 'LinkedIn',  color: 'bg-blue-700',  letter: 'in', label: 'LinkedIn',     limit: 3000 },
  { id: 'Twitter',   color: 'bg-black',     letter: 'X',  label: 'Twitter / X',  limit: 280 },
];

// Best times by platform based on general audience activity research
const BEST_TIMES = {
  Facebook:  [{ day: 'Wednesday', time: '11:00', label: 'Wed 11am' }, { day: 'Thursday', time: '13:00', label: 'Thu 1pm' }, { day: 'Friday', time: '10:00', label: 'Fri 10am' }],
  Instagram: [{ day: 'Monday', time: '11:00', label: 'Mon 11am' }, { day: 'Wednesday', time: '14:00', label: 'Wed 2pm' }, { day: 'Friday', time: '10:00', label: 'Fri 10am' }],
  LinkedIn:  [{ day: 'Tuesday', time: '09:00', label: 'Tue 9am' }, { day: 'Wednesday', time: '12:00', label: 'Wed 12pm' }, { day: 'Thursday', time: '10:00', label: 'Thu 10am' }],
  Twitter:   [{ day: 'Wednesday', time: '09:00', label: 'Wed 9am' }, { day: 'Friday', time: '09:00', label: 'Fri 9am' }, { day: 'Tuesday', time: '10:00', label: 'Tue 10am' }],
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PlatformAvatar({ platform, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={platform.label}
      className={`relative w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 transition-all ${platform.color} ${
        active ? 'border-violet-500 ring-2 ring-violet-300 scale-110' : 'border-white opacity-60 hover:opacity-90'
      }`}
    >
      {platform.letter}
      {active && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-violet-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
        </span>
      )}
    </button>
  );
}

function PlatformPreviewPanel({ platform, caption, imageUrl, videoUrl }) {
  const p = PLATFORMS.find(pl => pl.id === platform) || PLATFORMS[3];
  const overLimit = caption.length > p.limit;
  const truncated = caption.length > p.limit ? caption.slice(0, p.limit) + '…' : caption;

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        {p.label} Preview
        <span className="text-xs font-normal text-gray-400 cursor-help">ⓘ</span>
      </p>

      {!caption && !imageUrl && !videoUrl ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-300 dark:text-gray-600">
          <div className="relative w-48">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="bg-gray-200 dark:bg-gray-700 rounded h-24 mt-2" />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">See your post's preview here</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${p.color}`}>
              {p.letter}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Your Account</p>
              <p className="text-xs text-gray-400">Just now</p>
            </div>
          </div>
          {imageUrl && <img src={imageUrl} alt="Preview" className="w-full object-cover max-h-48" />}
          {videoUrl && !imageUrl && <video src={videoUrl} className="w-full max-h-48 object-cover" muted />}
          <div className="p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
              {truncated || <span className="text-gray-300 dark:text-gray-600 italic">Your caption will appear here…</span>}
            </p>
            {caption.length > 0 && (
              <p className={`text-xs mt-2 ${overLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {caption.length} / {p.limit}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BestTimeSuggestions({ platforms, onApply }) {
  // Get best times for the selected platforms
  const activePlatforms = platforms.length > 0 ? platforms : ['Twitter'];
  const primaryPlatform = activePlatforms[0];
  const suggestions = BEST_TIMES[primaryPlatform] || BEST_TIMES['Twitter'];

  const getNextOccurrence = (dayName, time) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.findIndex(d => d === dayName);
    const today = new Date();
    const todayDay = today.getDay();
    let daysUntil = (targetDay - todayDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7; // Push to next week if same day
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntil);
    return next.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span>Best times for <strong>{primaryPlatform}</strong> based on typical audience activity:</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onApply(getNextOccurrence(s.day, s.time), s.time)}
            className="text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2 py-2 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-center group"
          >
            <div className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-400">{s.label}</div>
            <div className="text-gray-400 group-hover:text-violet-500 mt-0.5">Apply →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecurringSchedulePanel({ formData, setFormData }) {
  const toggleDay = (dayIndex) => {
    const days = formData.recurrence_days || [];
    const updated = days.includes(dayIndex)
      ? days.filter(d => d !== dayIndex)
      : [...days, dayIndex];
    setFormData(f => ({ ...f, recurrence_days: updated }));
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <Select
          value={formData.recurrence_type || 'weekly'}
          onValueChange={(v) => setFormData(f => ({ ...f, recurrence_type: v }))}
        >
          <SelectTrigger className="h-8 text-xs w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400">repeat</span>
      </div>

      {formData.recurrence_type === 'weekly' && (
        <div className="flex gap-1 flex-wrap">
          {DAYS_OF_WEEK.map((day, idx) => (
            <button
              key={day}
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${
                (formData.recurrence_days || []).includes(idx)
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">End date (optional)</label>
        <input
          type="date"
          value={formData.recurrence_end_date || ''}
          onChange={(e) => setFormData(f => ({ ...f, recurrence_end_date: e.target.value }))}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
    </div>
  );
}

const DEFAULT_FORM = {
  title: '', caption: '', image_url: '', video_url: '',
  media_type: 'none', scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '09:00', platforms: [], hashtags: [], status: 'draft',
  order: 0, is_recurring: false, recurrence_type: 'weekly',
  recurrence_end_date: '', recurrence_days: [], auto_post: false,
};

export default function CalendarPostModal({ open, onClose, post, onSave, isLoading, hashtagPool = [] }) {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [uploading, setUploading] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState('Twitter');
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState('compose');
  const [saved, setSaved] = useState(false);
  const [showBestTimes, setShowBestTimes] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const fileInputRef = useRef();
  const videoInputRef = useRef();

  useEffect(() => {
    if (open) {
      setActiveTab('compose');
      setSaved(false);
      setShowBestTimes(false);
      setRequireApproval(true);
      if (post) {
        setFormData({
          title: post.title || '', caption: post.caption || '',
          image_url: post.image_url || '', video_url: post.video_url || '',
          media_type: post.media_type || 'none',
          scheduled_date: post.scheduled_date || new Date().toISOString().split('T')[0],
          scheduled_time: post.scheduled_time || '09:00',
          platforms: post.platforms || [], hashtags: post.hashtags || [],
          status: post.status || 'draft', order: post.order || 0,
          is_recurring: post.is_recurring || false,
          recurrence_type: post.recurrence_type || 'weekly',
          recurrence_end_date: post.recurrence_end_date || '',
          recurrence_days: post.recurrence_days || [],
          auto_post: post.auto_post || false,
        });
        if (post.platforms?.[0]) setPreviewPlatform(post.platforms[0]);
      } else {
        setFormData({ ...DEFAULT_FORM, scheduled_date: new Date().toISOString().split('T')[0] });
      }
    }
  }, [post, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(f => ({ ...f, image_url: file_url, video_url: '', media_type: 'image' }));
    setUploading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(f => ({ ...f, video_url: file_url, image_url: '', media_type: 'video' }));
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const syntheticEvent = { target: { files: [file] } };
    if (isVideo) handleVideoUpload(syntheticEvent);
    else handleImageUpload(syntheticEvent);
  };

  const togglePlatform = (id) => {
    setFormData(f => ({
      ...f,
      platforms: f.platforms.includes(id) ? f.platforms.filter(p => p !== id) : [...f.platforms, id],
    }));
    setPreviewPlatform(id);
  };

  const handleSubmit = (status) => {
    // If admin requires approval, override to pending_approval
    const finalStatus = (isAdmin && requireApproval && status === 'approved') ? 'pending_approval' : status;
    onSave({ ...formData, status: finalStatus });
    if (status === 'draft') setSaved(true);
  };

  const applyBestTime = (date, time) => {
    setFormData(f => ({ ...f, scheduled_date: date, scheduled_time: time }));
    setShowBestTimes(false);
  };

  const isViewer = currentUser?.social_media_role === 'viewer';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.social_media_role === 'admin' || currentUser?.social_media_role === 'approver';
  const activePlatform = PLATFORMS.find(p => p.id === previewPlatform) || PLATFORMS[3];
  const overLimit = formData.caption.length > activePlatform.limit;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-5xl w-full max-h-[92vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900" style={{ gap: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{post ? 'Edit Post' : 'Create Post'}</h2>
            <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              🏷 Tags <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 dark:text-gray-400 text-sm" onClick={() => {}}>
              <Sparkles className="w-4 h-4" /> AI Assistant
            </Button>
            <Button
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
              className={`gap-1.5 text-sm ${showPreview ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              onClick={() => setShowPreview(v => !v)}
            >
              👁 Preview
            </Button>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs (only for existing posts) */}
        {post && (
          <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 bg-white dark:bg-gray-900">
            {[
              { id: 'compose',  label: 'Compose',  icon: ImageIcon },
              { id: 'approval', label: 'Approval Workflow', icon: GitBranch },
              { id: 'comments', label: 'Team Feedback', icon: MessageSquare },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex overflow-hidden" style={{ maxHeight: 'calc(92vh - 140px)' }}>
          {/* Approval tab */}
          {activeTab === 'approval' && post && (
            <div className="flex-1 overflow-y-auto p-6">
              <PostApprovalPanel post={post} onUpdate={(updatedPost) => {
                // Merge approval changes back into formData so the modal reflects them
                if (updatedPost) {
                  setFormData(f => ({ ...f, ...updatedPost }));
                }
              }} />
            </div>
          )}

          {/* Comments tab */}
          {activeTab === 'comments' && post && (
            <div className="flex-1 overflow-y-auto p-6">
              <PostComments postId={post.id} currentUser={currentUser} />
            </div>
          )}

          {/* LEFT: Composer */}
          {(activeTab === 'compose' || !post) && <div className={`flex flex-col overflow-y-auto ${showPreview ? 'w-[58%]' : 'w-full'} border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900`}>
            {/* Platform Avatars */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4">
              {PLATFORMS.map(pl => (
                <PlatformAvatar
                  key={pl.id}
                  platform={pl}
                  active={formData.platforms.includes(pl.id)}
                  onClick={() => togglePlatform(pl.id)}
                />
              ))}
              <span className="text-xs text-gray-400 ml-1">Click to toggle platforms</span>
            </div>

            {/* Caption area */}
            <div className="px-6 flex gap-3 flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${activePlatform.color}`}>
                {activePlatform.letter}
              </div>
              <Textarea
                value={formData.caption}
                onChange={(e) => setFormData(f => ({ ...f, caption: e.target.value }))}
                placeholder="What would you like to share?"
                className="border-0 shadow-none focus-visible:ring-0 resize-none text-[15px] text-gray-800 dark:text-gray-200 bg-transparent p-0 min-h-[120px] leading-relaxed"
              />
            </div>

            {/* Media drop zone / preview */}
            <div className="px-6 pb-2">
              {formData.image_url ? (
                <div className="relative inline-block mt-2">
                  <img src={formData.image_url} alt="Preview" className="rounded-xl max-h-40 object-cover" />
                  <button onClick={() => setFormData(f => ({ ...f, image_url: '', media_type: 'none' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : formData.video_url ? (
                <div className="relative mt-2">
                  <video src={formData.video_url} controls className="rounded-xl max-h-40 w-full" />
                  <button onClick={() => setFormData(f => ({ ...f, video_url: '', media_type: 'none' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="mt-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  ) : (
                    <>
                      <ImageIcon className="w-7 h-7 text-gray-300" />
                      <p className="text-sm text-gray-400">
                        Drag &amp; drop or{' '}
                        <span className="text-blue-500 font-medium underline cursor-pointer">select a file</span>
                      </p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-100 dark:border-gray-800 mt-1">
              <div className="flex items-center gap-1">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 text-sm transition-colors">
                  <Plus className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Hash className="w-5 h-5" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Link2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
                  {formData.caption.length}/{activePlatform.limit} 
                </span>
              </div>
            </div>

            {/* Hashtag pool quick-add */}
            {hashtagPool.length > 0 && (
              <div className="px-6 pb-2 flex flex-wrap gap-1">
                {hashtagPool.slice(0, 10).map(h => (
                  <button
                    key={h.id}
                    onClick={() =>
                      setFormData(f => {
                        const existingHashtags = Array.isArray(f.hashtags) ? f.hashtags : [];
                        const alreadyIncluded = existingHashtags.includes(h.hashtag);
                        const newHashtags = alreadyIncluded
                          ? existingHashtags
                          : [...existingHashtags, h.hashtag];

                        let newCaption = f.caption || '';
                        const hashtagText = `#${h.hashtag}`;

                        // Trim trailing whitespace before appending
                        newCaption = newCaption.replace(/\s*$/, '');

                        if (!newCaption) {
                          // No body text yet: just the hashtag
                          newCaption = hashtagText;
                        } else if (existingHashtags.length === 0) {
                          // First hashtag being added: separate body from hashtag block with a blank line
                          newCaption = `${newCaption}\n\n${hashtagText}`;
                        } else {
                          // Subsequent hashtags: append with a space
                          newCaption = `${newCaption} ${hashtagText}`;
                        }

                        return {
                          ...f,
                          caption: newCaption,
                          hashtags: newHashtags,
                        };
                      })
                    }
                    className="text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-full px-2 py-0.5 transition-colors"
                  >
                    #{h.hashtag}
                  </button>
                ))}
              </div>
            )}

            {/* Recurring toggle */}
            <div className="px-6 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring Post</span>
                </div>
                <Switch
                  checked={formData.is_recurring}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_recurring: v }))}
                />
              </div>
              {formData.is_recurring && (
                <RecurringSchedulePanel formData={formData} setFormData={setFormData} />
              )}
            </div>
          </div>}

          {/* RIGHT: Preview + Scheduling */}
          {(activeTab === 'compose' || !post) && showPreview && (
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto">
              {/* Platform preview tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                {PLATFORMS.map(pl => (
                  <button key={pl.id}
                    onClick={() => setPreviewPlatform(pl.id)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      previewPlatform === pl.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {pl.id === 'Twitter' ? 'Twitter / X' : pl.id}
                  </button>
                ))}
              </div>
              <div className="p-4 flex-1">
                <PlatformPreviewPanel
                  platform={previewPlatform}
                  caption={formData.caption}
                  imageUrl={formData.image_url}
                  videoUrl={formData.video_url}
                />
              </div>

              {/* Scheduling panel */}
              <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Schedule
                  </p>
                  <button
                    onClick={() => setShowBestTimes(v => !v)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Best Times
                    <ChevronRight className={`w-3 h-3 transition-transform ${showBestTimes ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {showBestTimes && (
                  <BestTimeSuggestions
                    platforms={formData.platforms}
                    onApply={applyBestTime}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
                    <input type="date" value={formData.scheduled_date}
                      onChange={(e) => setFormData(f => ({ ...f, scheduled_date: e.target.value }))}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Time</label>
                    <input type="time" value={formData.scheduled_time}
                      onChange={(e) => setFormData(f => ({ ...f, scheduled_time: e.target.value }))}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>

                {/* Approval toggle */}
                <Tooltip content="You do not have permission to change this setting. Please contact an admin for assistance." disableHover={isAdmin}>
                  <div
                    className="border rounded-xl overflow-hidden px-4 py-3 text-sm select-none cursor-default transition-colors bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`w-4 h-4 ${requireApproval ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span className={`font-medium ${requireApproval ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          Requires Approval
                        </span>
                      </div>
                      <Switch
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                        disabled={!isAdmin}
                        aria-label="Requires Approval"
                      />
                    </div>
                    <div
                      className={`mt-2 px-0 py-2.5 text-xs rounded ${requireApproval ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                    >
                      {requireApproval
                        ? 'This post will be sent for team approval before going live.'
                        : 'This post will be scheduled without requiring approval.'}
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isLoading || !formData.caption}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 font-medium disabled:opacity-40 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Save Draft
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Submit for review (editors) */}
            {!isAdmin && !isViewer && (
              <Button
                variant="outline"
                onClick={() => handleSubmit('pending_review')}
                disabled={isLoading || !formData.caption || formData.platforms.length === 0}
                className="flex items-center gap-1.5 text-sm rounded-xl"
              >
                <Send className="w-4 h-4" />
                Submit for Review
              </Button>
            )}
            {/* TODO: Only use pending_approval or pending_review, not both. This will streamline the workflow and reduce confusion.  */}
            <Button
              onClick={() =>
                 handleSubmit(
                   isAdmin
                     ? (requireApproval ? 'pending_approval' : 'approved')
                     : 'pending_review'
                 )
               }
              disabled={isLoading || isViewer || !formData.caption || formData.platforms.length === 0}
              className="bg-gray-800 hover:bg-black text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {requireApproval ? <Send className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {requireApproval ? 'Send for Approval' : 'Schedule Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}