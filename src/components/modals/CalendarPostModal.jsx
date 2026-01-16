import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, X, Image, Video, Repeat } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { addDays, addWeeks, addMonths, format as formatDate } from 'date-fns';
import PostComments from '../social/PostComments';
import { useQuery } from '@tanstack/react-query';

const platforms = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'];

export default function CalendarPostModal({ open, onClose, post, onSave, isLoading, hashtagPool = [] }) {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    image_url: '',
    video_url: '',
    media_type: 'none',
    scheduled_date: '',
    scheduled_time: '09:00',
    platforms: [],
    hashtags: [],
    status: 'draft',
    order: 0,
    is_recurring: false,
    recurrence_type: 'weekly',
    recurrence_end_date: '',
    recurrence_days: []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        caption: post.caption || '',
        image_url: post.image_url || '',
        video_url: post.video_url || '',
        media_type: post.media_type || 'none',
        scheduled_date: post.scheduled_date || '',
        scheduled_time: post.scheduled_time || '09:00',
        platforms: post.platforms || [],
        hashtags: post.hashtags || [],
        status: post.status || 'draft',
        order: post.order || 0,
        is_recurring: post.is_recurring || false,
        recurrence_type: post.recurrence_type || 'weekly',
        recurrence_end_date: post.recurrence_end_date || '',
        recurrence_days: post.recurrence_days || []
      });
    } else {
      setFormData({
        title: '',
        caption: '',
        image_url: '',
        video_url: '',
        media_type: 'none',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '09:00',
        platforms: [],
        hashtags: [],
        status: 'draft',
        order: 0,
        is_recurring: false,
        recurrence_type: 'weekly',
        recurrence_end_date: '',
        recurrence_days: []
      });
    }
  }, [post, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url, video_url: '', media_type: 'image' });
    setUploading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingVideo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, video_url: file_url, image_url: '', media_type: 'video' });
    setUploadingVideo(false);
  };

  const clearMedia = () => {
    setFormData({ ...formData, image_url: '', video_url: '', media_type: 'none' });
  };

  const togglePlatform = (platform) => {
    const current = formData.platforms || [];
    if (current.includes(platform)) {
      setFormData({ ...formData, platforms: current.filter(p => p !== platform) });
    } else {
      setFormData({ ...formData, platforms: [...current, platform] });
    }
  };

  const addHashtag = (tag) => {
    const cleanTag = tag.replace('#', '').trim();
    if (cleanTag && !formData.hashtags?.includes(cleanTag)) {
      setFormData({ ...formData, hashtags: [...(formData.hashtags || []), cleanTag] });
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag) => {
    setFormData({ ...formData, hashtags: formData.hashtags.filter(h => h !== tag) });
  };

  const toggleRecurrenceDay = (day) => {
    const current = formData.recurrence_days || [];
    if (current.includes(day)) {
      setFormData({ ...formData, recurrence_days: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, recurrence_days: [...current, day] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If recurring, create multiple posts
    if (formData.is_recurring && formData.recurrence_end_date) {
      const posts = [];
      let currentDate = new Date(formData.scheduled_date);
      const endDate = new Date(formData.recurrence_end_date);
      
      while (currentDate <= endDate) {
        posts.push({
          ...formData,
          scheduled_date: formatDate(currentDate, 'yyyy-MM-dd'),
          parent_post_id: post?.id || null
        });
        
        if (formData.recurrence_type === 'daily') {
          currentDate = addDays(currentDate, 1);
        } else if (formData.recurrence_type === 'weekly') {
          currentDate = addWeeks(currentDate, 1);
        } else if (formData.recurrence_type === 'monthly') {
          currentDate = addMonths(currentDate, 1);
        }
      }
      
      // Save each recurring post
      for (const postData of posts) {
        await onSave(postData);
      }
    } else {
      onSave(formData);
    }
  };

  const isViewer = currentUser?.social_media_role === 'viewer';
  const canEdit = !isViewer;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'Add Calendar Post'}</DialogTitle>
        </DialogHeader>

        {post ? (
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Post Details</TabsTrigger>
              <TabsTrigger value="feedback">Team Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Media</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {formData.image_url ? (
                <div className="relative">
                  <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded" />
                  <Button 
                    type="button"
                    size="icon" 
                    variant="destructive" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={clearMedia}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : formData.video_url ? (
                <div className="relative">
                  <video src={formData.video_url} controls className="w-full h-40 object-cover rounded" />
                  <Button 
                    type="button"
                    size="icon" 
                    variant="destructive" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={clearMedia}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploading || uploadingVideo ? (
                    <div className="py-4">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center gap-4">
                        <label className="cursor-pointer flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          <Image className="w-8 h-8 text-blue-500 mb-1" />
                          <span className="text-sm text-gray-600">Photo</span>
                        </label>
                        <label className="cursor-pointer flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                          <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                          <Video className="w-8 h-8 text-purple-500 mb-1" />
                          <span className="text-sm text-gray-600">Video</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-400">Click to upload photo or video</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title/Headline</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter title or headline..."
            />
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label>Caption</Label>
            <Textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Post description..."
              rows={3}
            />
          </div>

          {/* Scheduled Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
          </div>

          {/* Recurring Options */}
          <div className="space-y-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
              <Label htmlFor="recurring" className="cursor-pointer font-medium flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                Recurring Post
              </Label>
            </div>
            
            {formData.is_recurring && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Repeat Every</Label>
                    <Select 
                      value={formData.recurrence_type} 
                      onValueChange={(v) => setFormData({ ...formData, recurrence_type: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Date *</Label>
                    <Input
                      type="date"
                      className="h-9"
                      value={formData.recurrence_end_date}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                      min={formData.scheduled_date}
                    />
                  </div>
                </div>

                {formData.recurrence_type === 'weekly' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Repeat On</Label>
                    <div className="flex gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          size="sm"
                          variant={formData.recurrence_days?.includes(idx) ? 'default' : 'outline'}
                          className="w-10 h-10 p-0"
                          onClick={() => toggleRecurrenceDay(idx)}
                        >
                          {day[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => (
                <Badge 
                  key={p}
                  className={`cursor-pointer ${formData.platforms?.includes(p) ? 'bg-violet-600' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => togglePlatform(p)}
                >
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex gap-2">
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="Add hashtag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag(hashtagInput))}
              />
              <Button type="button" onClick={() => addHashtag(hashtagInput)}>Add</Button>
            </div>
            {formData.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.hashtags.map(tag => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    #{tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeHashtag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
            {hashtagPool.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">From pool:</p>
                <div className="flex flex-wrap gap-1">
                  {hashtagPool.slice(0, 10).map(h => (
                    <Badge 
                      key={h.id} 
                      variant="outline" 
                      className="cursor-pointer text-xs hover:bg-violet-50"
                      onClick={() => addHashtag(h.hashtag)}
                    >
                      #{h.hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading || isViewer}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {post ? 'Update' : 'Add Post'}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="feedback" className="mt-4">
        <PostComments postId={post.id} currentUser={currentUser} />
      </TabsContent>
    </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Same form fields for new posts */}
            <div className="space-y-2">
              <Label>Media</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {formData.image_url ? (
                  <div className="relative">
                    <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded" />
                    <Button 
                      type="button"
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={clearMedia}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : formData.video_url ? (
                  <div className="relative">
                    <video src={formData.video_url} controls className="w-full h-40 object-cover rounded" />
                    <Button 
                      type="button"
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={clearMedia}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploading || uploadingVideo ? (
                      <div className="py-4">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center gap-4">
                          <label className="cursor-pointer flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <Image className="w-8 h-8 text-blue-500 mb-1" />
                            <span className="text-sm text-gray-600">Photo</span>
                          </label>
                          <label className="cursor-pointer flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                            <Video className="w-8 h-8 text-purple-500 mb-1" />
                            <span className="text-sm text-gray-600">Video</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-400">Click to upload photo or video</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title/Headline</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title or headline..."
              />
            </div>

            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Post description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date *</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(p => (
                  <Badge 
                    key={p}
                    className={`cursor-pointer ${formData.platforms?.includes(p) ? 'bg-violet-600' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => togglePlatform(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isLoading || isViewer}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Post
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}