import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Image as ImageIcon, Smile, Hash, Link2, Plus, ChevronDown, Sparkles, Maximize2, Calendar, CheckCircle2, MessageSquare, GitBranch } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PostComments from '../social/PostComments';
import PostApprovalPanel from '../social/PostApprovalPanel';

const PLATFORMS = [
  { id: 'Facebook',  color: 'bg-blue-600',  letter: 'f',  label: 'Facebook',       limit: 63206 },
  { id: 'Instagram', color: 'bg-gradient-to-br from-pink-500 to-purple-600', letter: 'IG', label: 'Instagram', limit: 2200 },
  { id: 'LinkedIn',  color: 'bg-blue-700',  letter: 'in', label: 'LinkedIn',        limit: 3000 },
  { id: 'Twitter',   color: 'bg-black',     letter: 'X',  label: 'Twitter / X',     limit: 280  },
];

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
      <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        {p.label} Preview
        <span className="text-xs font-normal text-gray-400 cursor-help">ⓘ</span>
      </p>

      {!caption && !imageUrl && !videoUrl ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-300">
          {/* Placeholder wireframe */}
          <div className="relative w-48">
            <div className="absolute -top-3 -right-3 text-gray-200 text-2xl">✦</div>
            <div className="absolute -bottom-3 -left-3 text-gray-200 text-2xl">✦</div>
            <div className="bg-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="flex-1 h-2 bg-gray-200 rounded" />
              </div>
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-200 rounded w-1/2" />
              <div className="bg-gray-200 rounded h-24 mt-2" />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">See your post's preview here</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${p.color}`}>
              {p.letter}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Your Account</p>
              <p className="text-xs text-gray-400">Just now</p>
            </div>
          </div>
          {imageUrl && <img src={imageUrl} alt="Preview" className="w-full object-cover max-h-48" />}
          {videoUrl && !imageUrl && <video src={videoUrl} className="w-full max-h-48 object-cover" muted />}
          <div className="p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
              {truncated || <span className="text-gray-300 italic">Your caption will appear here…</span>}
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
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const fileInputRef = useRef();
  const videoInputRef = useRef();

  useEffect(() => {
    if (open) {
      setActiveTab('details');
      setSaved(false);
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
    onSave({ ...formData, status });
    if (status === 'draft') setSaved(true);
  };

  const isViewer = currentUser?.social_media_role === 'viewer';
  const activePlatform = PLATFORMS.find(p => p.id === previewPlatform) || PLATFORMS[3];
  const overLimit = formData.caption.length > activePlatform.limit;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-5xl w-full max-h-[92vh] overflow-hidden rounded-2xl" style={{ gap: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{post ? 'Edit Post' : 'Create Post'}</h2>
            <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50 transition-colors">
              🏷 Tags <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 text-sm" onClick={() => {}}>
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
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs (only for existing posts) */}
        {post && (
          <div className="flex border-b border-gray-100 px-6 bg-white">
            {[
              { id: 'compose',  label: 'Compose',  icon: ImageIcon },
              { id: 'approval', label: 'Approval Workflow', icon: GitBranch },
              { id: 'comments', label: 'Team Feedback', icon: MessageSquare },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex overflow-hidden" style={{ maxHeight: 'calc(92vh - 130px)' }}>
          {/* LEFT: Composer */}
          <div className={`flex flex-col overflow-y-auto ${showPreview ? 'w-[58%]' : 'w-full'} border-r border-gray-100`}>
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
                className="border-0 shadow-none focus-visible:ring-0 resize-none text-[15px] text-gray-800 p-0 min-h-[160px] leading-relaxed"
              />
            </div>

            {/* Media drop zone / preview */}
            <div className="px-6 pb-2">
              {formData.image_url ? (
                <div className="relative inline-block mt-2">
                  <img src={formData.image_url} alt="Preview" className="rounded-xl max-h-52 object-cover" />
                  <button onClick={() => setFormData(f => ({ ...f, image_url: '', media_type: 'none' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : formData.video_url ? (
                <div className="relative mt-2">
                  <video src={formData.video_url} controls className="rounded-xl max-h-52 w-full" />
                  <button onClick={() => setFormData(f => ({ ...f, video_url: '', media_type: 'none' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-colors"
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
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center gap-1">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg px-2 py-1.5 text-sm transition-colors">
                  <Plus className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Hash className="w-5 h-5" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Link2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
                  {activePlatform.limit - formData.caption.length}
                </span>
                <button
                  onClick={() => {}}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 rounded-full px-3 py-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Start Thread
                </button>
              </div>
            </div>

            {/* Hashtag pool quick-add */}
            {hashtagPool.length > 0 && (
              <div className="px-6 pb-3 flex flex-wrap gap-1">
                {hashtagPool.slice(0, 10).map(h => (
                  <button key={h.id}
                    onClick={() => setFormData(f => ({ ...f, caption: f.caption + (f.caption ? ' ' : '') + '#' + h.hashtag }))}
                    className="text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-full px-2 py-0.5 transition-colors">
                    #{h.hashtag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Preview */}
          {showPreview && (
            <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
              {/* Platform preview tabs */}
              <div className="flex border-b border-gray-200 bg-white">
                {PLATFORMS.map(pl => (
                  <button key={pl.id}
                    onClick={() => setPreviewPlatform(pl.id)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      previewPlatform === pl.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {pl.id === 'Twitter' ? 'Twitter / X' : pl.id}
                  </button>
                ))}
              </div>
              <div className="p-6 flex-1">
                <PlatformPreviewPanel
                  platform={previewPlatform}
                  caption={formData.caption}
                  imageUrl={formData.image_url}
                  videoUrl={formData.video_url}
                />
              </div>

              {/* Schedule settings inside preview panel */}
              <div className="border-t border-gray-200 bg-white px-5 py-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Schedule</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input type="date" value={formData.scheduled_date}
                      onChange={(e) => setFormData(f => ({ ...f, scheduled_date: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Time</label>
                    <input type="time" value={formData.scheduled_time}
                      onChange={(e) => setFormData(f => ({ ...f, scheduled_time: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" className="rounded" onChange={() => {}} />
              Create Another
            </label>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isLoading || !formData.caption}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium disabled:opacity-40 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              Save Draft
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                Next Available
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button
              onClick={() => handleSubmit('pending_approval')}
              disabled={isLoading || isViewer || !formData.caption || formData.platforms.length === 0}
              className="bg-gray-800 hover:bg-black text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Schedule Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}