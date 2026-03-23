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
import { Card } from '@/components/ui/card';
import { Save, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CustomBlockEditor({ open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [blockType, setBlockType] = useState('text_image');
  const [layout, setLayout] = useState({ structure: 'default', columns: 1, alignment: 'left' });
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setThumbnailUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const blockData = {
      name,
      description,
      block_type: blockType,
      layout,
      thumbnail_url: thumbnailUrl,
      default_content: getDefaultContent(blockType),
      styling: {
        background: 'transparent',
        padding: '1rem',
        border: 'none',
      },
      is_public: false,
      usage_count: 0,
    };

    await onSave(blockData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setBlockType('text_image');
    setLayout({ structure: 'default', columns: 1, alignment: 'left' });
    setThumbnailUrl('');
  };

  const getDefaultContent = (type) => {
    const defaults = {
      text_image: { text: '', image_url: '' },
      two_column: { left: '', right: '' },
      chart: { type: 'bar', data: [] },
      quote: { quote: '', author: '' },
      cta: { title: '', button_text: '', button_url: '' },
      stats: { stats: [] },
      timeline: { events: [] },
      comparison: { left_title: '', right_title: '', items: [] },
      custom: {},
    };
    return defaults[type] || {};
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Custom Block</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <div>
            <Label>Block Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Feature Showcase"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this block's purpose..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Block Type</Label>
            <Select value={blockType} onValueChange={setBlockType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text_image">Text + Image</SelectItem>
                <SelectItem value="two_column">Two Column</SelectItem>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="quote">Quote</SelectItem>
                <SelectItem value="cta">Call to Action</SelectItem>
                <SelectItem value="stats">Statistics</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Columns</Label>
              <Input
                type="number"
                min="1"
                max="4"
                value={layout.columns}
                onChange={(e) => setLayout({ ...layout, columns: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Alignment</Label>
              <Select
                value={layout.alignment}
                onValueChange={(v) => setLayout({ ...layout, alignment: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Thumbnail Preview</Label>
            <div className="mt-2">
              {thumbnailUrl ? (
                <div className="relative group">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => setThumbnailUrl('')}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">
                    {isUploading ? 'Uploading...' : 'Upload thumbnail'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadThumbnail}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Preview */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-900">
            <Label className="text-xs mb-2 block">Preview</Label>
            <div
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border"
              style={{ textAlign: layout.alignment }}
            >
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }}
              >
                {Array.from({ length: layout.columns }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 dark:bg-gray-700 h-20 rounded flex items-center justify-center text-xs text-gray-500"
                  >
                    Column {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
