import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Image } from "lucide-react";
import { base44 } from '@/api/base44Client';

const platforms = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'];

export default function CalendarPostModal({ open, onClose, post, onSave, isLoading, hashtagPool = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    image_url: '',
    scheduled_date: '',
    platforms: [],
    hashtags: [],
    status: 'draft',
    order: 0
  });
  const [uploading, setUploading] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        caption: post.caption || '',
        image_url: post.image_url || '',
        scheduled_date: post.scheduled_date || '',
        platforms: post.platforms || [],
        hashtags: post.hashtags || [],
        status: post.status || 'draft',
        order: post.order || 0
      });
    } else {
      setFormData({
        title: '',
        caption: '',
        image_url: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        platforms: [],
        hashtags: [],
        status: 'draft',
        order: 0
      });
    }
  }, [post, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url });
    setUploading(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'Add Calendar Post'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {formData.image_url ? (
                <div className="relative">
                  <img src={formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded" />
                  <Button 
                    type="button"
                    size="icon" 
                    variant="destructive" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload image</p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title/Headline Overlay *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="AVIATION ELEVATED"
              required
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

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label>Scheduled Date *</Label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              required
            />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {post ? 'Update' : 'Add Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}