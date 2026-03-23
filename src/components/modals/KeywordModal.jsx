import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function KeywordModal({ open, onClose, keyword, websites, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    keyword: '',
    website_id: '',
    current_position: '',
    search_volume: '',
    difficulty: '',
    target_url: '',
  });

  useEffect(() => {
    if (keyword) {
      setFormData({
        keyword: keyword.keyword || '',
        website_id: keyword.website_id || '',
        current_position: keyword.current_position || '',
        search_volume: keyword.search_volume || '',
        difficulty: keyword.difficulty || '',
        target_url: keyword.target_url || '',
      });
    } else {
      setFormData({
        keyword: '',
        website_id: websites?.[0]?.id || '',
        current_position: '',
        search_volume: '',
        difficulty: '',
        target_url: '',
      });
    }
  }, [keyword, open, websites]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      current_position: formData.current_position ? parseInt(formData.current_position) : null,
      search_volume: formData.search_volume ? parseInt(formData.search_volume) : null,
      difficulty: formData.difficulty ? parseInt(formData.difficulty) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{keyword ? 'Edit Keyword' : 'Add New Keyword'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword *</Label>
            <Input
              id="keyword"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              placeholder="e.g., best crm software"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Website *</Label>
            <Select
              value={formData.website_id}
              onValueChange={(value) => setFormData({ ...formData, website_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select website" />
              </SelectTrigger>
              <SelectContent>
                {websites?.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_position">Position</Label>
              <Input
                id="current_position"
                type="number"
                min="1"
                value={formData.current_position}
                onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                placeholder="1-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search_volume">Volume</Label>
              <Input
                id="search_volume"
                type="number"
                value={formData.search_volume}
                onChange={(e) => setFormData({ ...formData, search_volume: e.target.value })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Input
                id="difficulty"
                type="number"
                min="0"
                max="100"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_url">Target URL</Label>
            <Input
              id="target_url"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
              placeholder="https://example.com/page"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {keyword ? 'Update Keyword' : 'Add Keyword'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
