import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Hash, AtSign, Search } from 'lucide-react';

const TYPES = [
  { id: 'keyword', label: 'Keyword', icon: Search, description: 'Track any word or phrase' },
  { id: 'hashtag', label: 'Hashtag', icon: Hash, description: 'Track #hashtags' },
  { id: 'mention', label: 'Mention', icon: AtSign, description: 'Track @mentions' },
];

const PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
];

export default function AddListeningModal({ open, onClose, onSave, isLoading, editingKeyword }) {
  const [type, setType] = useState('keyword');
  const [keyword, setKeyword] = useState('');
  const [platforms, setPlatforms] = useState(['twitter', 'linkedin']);

  React.useEffect(() => {
    if (editingKeyword) {
      setType(editingKeyword.type || 'keyword');
      setKeyword(editingKeyword.keyword || '');
      setPlatforms(editingKeyword.platforms || ['twitter', 'linkedin']);
    } else {
      setType('keyword');
      setKeyword('');
      setPlatforms(['twitter', 'linkedin']);
    }
  }, [editingKeyword, open]);

  const handleSubmit = () => {
    if (!keyword.trim()) {
      return;
    }
    onSave({
      id: editingKeyword?.id,
      keyword: keyword.trim().replace(/^[#@]/, ''),
      type,
      platforms,
      is_active: editingKeyword?.is_active ?? true,
    });
  };

  const togglePlatform = (platformId) => {
    setPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingKeyword ? 'Edit Tracked Keyword' : 'Add Keyword to Track'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>What do you want to track?</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      type === t.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mx-auto mb-1 ${type === t.id ? 'text-violet-600' : 'text-gray-400'}`}
                    />
                    <p
                      className={`text-sm font-medium ${type === t.id ? 'text-violet-700' : 'text-gray-700'}`}
                    >
                      {t.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keyword Input */}
          <div className="space-y-2">
            <Label>
              {type === 'keyword'
                ? 'Keyword or phrase'
                : type === 'hashtag'
                  ? 'Hashtag'
                  : 'Username'}
            </Label>
            <div className="relative">
              {type !== 'keyword' && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {type === 'hashtag' ? '#' : '@'}
                </span>
              )}
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={
                  type === 'keyword'
                    ? 'e.g., AI marketing'
                    : type === 'hashtag'
                      ? 'e.g., marketing'
                      : 'e.g., competitor'
                }
                className={type !== 'keyword' ? 'pl-8' : ''}
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platforms to monitor</Label>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <div key={p.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={p.id}
                    checked={platforms.includes(p.id)}
                    onCheckedChange={() => togglePlatform(p.id)}
                  />
                  <label htmlFor={p.id} className="text-sm text-gray-700 cursor-pointer">
                    {p.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!keyword.trim() || platforms.length === 0 || isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingKeyword ? 'Save Changes' : 'Start Tracking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
