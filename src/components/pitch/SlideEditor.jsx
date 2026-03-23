import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, GripVertical, Sparkles, Video } from 'lucide-react';
import MediaEmbedModal from './MediaEmbedModal';

export default function SlideEditor({ slide, branding, onChange, onDelete, onAIEnhance }) {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const updateContent = (field, value) => {
    onChange({
      ...slide,
      content: { ...slide.content, [field]: value },
    });
  };

  const handleMediaEmbed = (media) => {
    onChange({
      ...slide,
      content: {
        ...slide.content,
        media: media,
      },
    });
  };

  return (
    <Card className="group relative overflow-hidden">
      {/* Drag Handle */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gray-50 dark:bg-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div
        className="pl-8 pr-4 py-4"
        style={{
          borderLeft: `4px solid ${branding?.primary_color || '#7c3aed'}`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Input
              value={slide.title || ''}
              onChange={(e) => onChange({ ...slide, title: e.target.value })}
              placeholder="Slide title..."
              className="text-lg font-semibold border-0 px-0 focus-visible:ring-0"
              style={{
                fontFamily: branding?.font_heading || 'Inter',
                color: branding?.primary_color || '#7c3aed',
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onAIEnhance}
              className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content based on slide type */}
        {slide.type === 'cover' && (
          <div className="space-y-3">
            <Input
              value={slide.content?.company || ''}
              onChange={(e) => updateContent('company', e.target.value)}
              placeholder="Company Name"
              className="text-2xl font-bold"
            />
            <Input
              value={slide.content?.tagline || ''}
              onChange={(e) => updateContent('tagline', e.target.value)}
              placeholder="Tagline"
              className="text-lg"
            />
          </div>
        )}

        {(slide.type === 'problem' || slide.type === 'solution') && (
          <div className="space-y-3">
            <Textarea
              value={slide.content?.description || ''}
              onChange={(e) => updateContent('description', e.target.value)}
              placeholder={`Describe the ${slide.type}...`}
              rows={3}
              className="text-sm"
            />
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Key Points (one per line)</label>
              <Textarea
                value={slide.content?.points?.join('\n') || ''}
                onChange={(e) => updateContent('points', e.target.value.split('\n'))}
                placeholder="• Point 1&#10;• Point 2&#10;• Point 3"
                rows={4}
                className="text-sm font-mono"
              />
            </div>
          </div>
        )}

        {slide.type === 'market' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">TAM</label>
              <Input
                value={slide.content?.tam || ''}
                onChange={(e) => updateContent('tam', e.target.value)}
                placeholder="$10B"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">SAM</label>
              <Input
                value={slide.content?.sam || ''}
                onChange={(e) => updateContent('sam', e.target.value)}
                placeholder="$1B"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">SOM</label>
              <Input
                value={slide.content?.som || ''}
                onChange={(e) => updateContent('som', e.target.value)}
                placeholder="$100M"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {slide.type === 'traction' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Metric Name</label>
              <Input
                value={slide.content?.metric1_name || ''}
                onChange={(e) => updateContent('metric1_name', e.target.value)}
                placeholder="MRR"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Value</label>
              <Input
                value={slide.content?.metric1_value || ''}
                onChange={(e) => updateContent('metric1_value', e.target.value)}
                placeholder="$50K"
                className="mt-1"
              />
            </div>
          </div>
        )}

        {slide.type === 'team' && (
          <div className="space-y-3">
            <Textarea
              value={slide.content?.members || ''}
              onChange={(e) => updateContent('members', e.target.value)}
              placeholder="List team members and their roles..."
              rows={4}
              className="text-sm"
            />
          </div>
        )}

        {/* Generic content for other types */}
        {!['cover', 'problem', 'solution', 'market', 'traction', 'team'].includes(slide.type) && (
          <Textarea
            value={slide.content?.text || ''}
            onChange={(e) => updateContent('text', e.target.value)}
            placeholder="Slide content..."
            rows={4}
            className="text-sm"
          />
        )}

        {/* Media Section */}
        {slide.content?.media && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {slide.content.media.type === 'youtube' && '📺 YouTube Video'}
                {slide.content.media.type === 'video' && '🎥 Video'}
                {slide.content.media.type === 'link' && '🔗 Website Embed'}
                {slide.content.media.type === 'upload' && '📁 ' + slide.content.media.fileName}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateContent('media', null)}
                className="h-6 text-xs text-red-500"
              >
                Remove
              </Button>
            </div>
            <p className="text-xs text-gray-500 truncate">{slide.content.media.url}</p>
          </div>
        )}

        {/* Media Actions */}
        <div className="mt-3 pt-3 border-t flex gap-2">
          <button
            onClick={() => setShowMediaModal(true)}
            className="text-xs text-gray-500 hover:text-violet-600 flex items-center gap-1"
          >
            <Video className="w-3 h-3" />
            Add media
          </button>
        </div>
      </div>

      <MediaEmbedModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onEmbed={handleMediaEmbed}
      />
    </Card>
  );
}
