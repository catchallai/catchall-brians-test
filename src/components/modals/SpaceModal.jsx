import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const colorOptions = [
  { value: 'violet', class: 'bg-violet-500' },
  { value: 'blue', class: 'bg-blue-500' },
  { value: 'green', class: 'bg-green-500' },
  { value: 'orange', class: 'bg-orange-500' },
  { value: 'red', class: 'bg-red-500' },
  { value: 'pink', class: 'bg-pink-500' },
  { value: 'cyan', class: 'bg-cyan-500' },
  { value: 'yellow', class: 'bg-yellow-500' },
];

export default function SpaceModal({ open, onClose, space, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: 'violet',
    is_public: false,
    members: [],
  });

  useEffect(() => {
    if (space) {
      setFormData(space);
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '📁',
        color: 'violet',
        is_public: false,
        members: [],
      });
    }
  }, [space, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{space ? 'Edit Space' : 'Create New Space'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2">
              <Label>Icon</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="text-2xl text-center"
                maxLength={2}
              />
            </div>
            <div className="col-span-10">
              <Label>Space Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Engineering, Marketing, Product Docs"
                required
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this space about?"
              rows={3}
            />
          </div>

          <div>
            <Label>Color Theme</Label>
            <div className="flex gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full ${color.class} ${
                    formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Public Space</Label>
              <p className="text-sm text-gray-500">Allow all users to view this space</p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : space ? 'Update Space' : 'Create Space'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
