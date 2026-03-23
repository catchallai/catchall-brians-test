import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';

export default function SaveTemplateModal({ open, onClose, onSave, currentDeck }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [industry, setIndustry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        category,
        industry,
        branding: currentDeck.branding,
        default_slides: currentDeck.slides,
        is_public: false,
        usage_count: 0,
      });
      onClose();
      setName('');
      setDescription('');
      setCategory('custom');
      setIndustry('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tech Startup Pitch"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="nonprofit">Nonprofit</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Industry (Optional)</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., SaaS, E-commerce"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || isSaving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
