import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Calendar, Send, X, AlertCircle } from "lucide-react";

const PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', icon: '𝕏', maxChars: 280, color: 'bg-gray-900 text-white' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', maxChars: 3000, color: 'bg-blue-600 text-white' },
  { id: 'facebook', label: 'Facebook', icon: 'f', maxChars: 63206, color: 'bg-blue-500 text-white' },
  { id: 'instagram', label: 'Instagram', icon: 'IG', maxChars: 2200, color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white' },
  { id: 'youtube', label: 'YouTube', icon: '▶', maxChars: 5000, color: 'bg-red-600 text-white' },
];

export default function ComposePostModal({ 
  open, 
  onClose, 
  accounts, 
  onSchedule, 
  onAdapt,
  isLoading,
  isAdapting 
}) {
  const [masterContent, setMasterContent] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [platformContent, setPlatformContent] = useState({});
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [activeTab, setActiveTab] = useState('compose');

  useEffect(() => {
    if (open) {
      setMasterContent('');
      setSelectedAccounts([]);
      setPlatformContent({});
      setHashtags([]);
      setScheduledTime('');
      setActiveTab('compose');
    }
  }, [open]);

  // Group accounts by platform
  const accountsByPlatform = accounts.reduce((acc, account) => {
    if (!acc[account.platform]) acc[account.platform] = [];
    acc[account.platform].push(account);
    return acc;
  }, {});

  const toggleAccount = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleAdaptContent = async () => {
    if (!masterContent.trim() || selectedAccounts.length === 0) return;
    
    const platforms = [...new Set(selectedAccounts.map(id => 
      accounts.find(a => a.id === id)?.platform
    ))].filter(Boolean);

    const adapted = await onAdapt(masterContent, platforms, hashtags);
    if (adapted) {
      setPlatformContent(adapted);
      setActiveTab('preview');
    }
  };

  const handleSchedule = () => {
    const posts = selectedAccounts.map(accountId => {
      const account = accounts.find(a => a.id === accountId);
      const content = platformContent[account.platform] || masterContent;
      const platformHashtags = hashtags.map(t => `#${t}`);
      
      return {
        social_account_id: accountId,
        platform: account.platform,
        content: content,
        hashtags: platformHashtags,
        scheduled_time: scheduledTime || new Date().toISOString(),
        status: scheduledTime ? 'scheduled' : 'draft',
        ai_optimized: !!platformContent[account.platform],
      };
    });

    onSchedule(posts);
  };

  const selectedPlatforms = [...new Set(selectedAccounts.map(id => 
    accounts.find(a => a.id === id)?.platform
  ))].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Compose Post</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="compose">1. Compose</TabsTrigger>
            <TabsTrigger value="preview" disabled={!masterContent.trim()}>2. Preview</TabsTrigger>
            <TabsTrigger value="schedule" disabled={selectedAccounts.length === 0}>3. Schedule</TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Master Content */}
            <div className="space-y-2">
              <Label>Your Message</Label>
              <Textarea
                value={masterContent}
                onChange={(e) => setMasterContent(e.target.value)}
                placeholder="Write your post content here. We'll help adapt it for each platform..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-gray-400">{masterContent.length} characters</p>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <div className="flex gap-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Add hashtag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addHashtag}>Add</Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {hashtags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeHashtag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Account Selection */}
            <div className="space-y-2">
              <Label>Select Accounts to Post To</Label>
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 bg-gray-50 rounded-lg text-center">
                  No social accounts connected. Add accounts in Social Media page first.
                </p>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {PLATFORMS.map(platform => {
                    const platformAccounts = accountsByPlatform[platform.id] || [];
                    if (platformAccounts.length === 0) return null;
                    
                    return (
                      <div key={platform.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded ${platform.color} flex items-center justify-center text-xs font-bold`}>
                            {platform.icon}
                          </span>
                          <span className="text-sm font-medium">{platform.label}</span>
                          <span className="text-xs text-gray-400">({platform.maxChars} chars max)</span>
                        </div>
                        <div className="pl-8 space-y-1">
                          {platformAccounts.map(account => (
                            <div key={account.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={account.id}
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={() => toggleAccount(account.id)}
                              />
                              <label htmlFor={account.id} className="text-sm cursor-pointer">
                                @{account.account_name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleAdaptContent}
                disabled={!masterContent.trim() || selectedAccounts.length === 0 || isAdapting}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                {isAdapting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Adapt for Platforms
              </Button>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <p className="text-sm text-gray-500">Review how your post will appear on each platform:</p>
            
            <div className="space-y-4">
              {selectedPlatforms.map(platformId => {
                const platform = PLATFORMS.find(p => p.id === platformId);
                const content = platformContent[platformId] || masterContent;
                const charCount = content.length;
                const isOverLimit = charCount > platform.maxChars;
                
                return (
                  <div key={platformId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center font-bold`}>
                          {platform.icon}
                        </span>
                        <span className="font-medium">{platform.label}</span>
                      </div>
                      <div className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                        {charCount} / {platform.maxChars}
                        {isOverLimit && <AlertCircle className="w-3 h-3 inline ml-1" />}
                      </div>
                    </div>
                    <Textarea
                      value={content}
                      onChange={(e) => setPlatformContent({ ...platformContent, [platformId]: e.target.value })}
                      className={`min-h-[80px] ${isOverLimit ? 'border-red-300' : ''}`}
                    />
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hashtags.map(tag => (
                          <span key={tag} className="text-violet-600 text-sm">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab('compose')}>Back</Button>
              <Button onClick={() => setActiveTab('schedule')} className="bg-violet-600 hover:bg-violet-700">
                Continue to Schedule
              </Button>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="space-y-2">
              <Label>When to post?</Label>
              <Input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-gray-400">
                Leave empty to save as draft
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Summary</h4>
              <p className="text-sm text-gray-600">
                Posting to {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''} across {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedAccounts.map(id => {
                  const account = accounts.find(a => a.id === id);
                  const platform = PLATFORMS.find(p => p.id === account?.platform);
                  return (
                    <Badge key={id} className={`${platform?.color} border-0`}>
                      @{account?.account_name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab('preview')}>Back</Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setScheduledTime(''); handleSchedule(); }}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleSchedule}
                  disabled={isLoading || !scheduledTime}
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Schedule Posts
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}