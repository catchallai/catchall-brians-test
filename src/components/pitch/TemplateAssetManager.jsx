import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TemplateAssetManager({ customFonts = [], customAssets = [], onChange }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFont = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newFont = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: file_url,
        format: file.name.endsWith('.woff2') ? 'woff2' : 'woff',
      };
      onChange({ customFonts: [...customFonts, newFont], customAssets });
    } catch (error) {
      console.error('Font upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAsset = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newAsset = {
        name: file.name,
        url: file_url,
        type: file.type.startsWith('image/') ? 'image' : 'file',
      };
      onChange({ customFonts, customAssets: [...customAssets, newAsset] });
    } catch (error) {
      console.error('Asset upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFont = (index) => {
    const newFonts = customFonts.filter((_, i) => i !== index);
    onChange({ customFonts: newFonts, customAssets });
  };

  const removeAsset = (index) => {
    const newAssets = customAssets.filter((_, i) => i !== index);
    onChange({ customFonts, customAssets: newAssets });
  };

  return (
    <Card className="p-4 bg-white dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Custom Assets</h3>

      <div className="space-y-4">
        {/* Custom Fonts */}
        <div>
          <Label className="text-xs">Custom Fonts</Label>
          <div className="mt-2 space-y-2">
            {customFonts.map((font, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{font.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFont(i)}
                  className="h-6 w-6 p-0 text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <label className="flex items-center justify-center h-10 border-2 border-dashed rounded cursor-pointer hover:border-violet-500 transition-colors">
              <Upload className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-xs text-gray-500">
                {isUploading ? 'Uploading...' : 'Upload Font (.woff2)'}
              </span>
              <input
                type="file"
                accept=".woff,.woff2"
                onChange={handleUploadFont}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Custom Assets */}
        <div>
          <Label className="text-xs">Custom Assets</Label>
          <div className="mt-2 space-y-2">
            {customAssets.map((asset, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <div className="flex items-center gap-2">
                  {asset.type === 'image' ? (
                    <img
                      src={asset.url}
                      className="w-8 h-8 object-cover rounded"
                      alt={asset.name}
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-700 dark:text-gray-300">{asset.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAsset(i)}
                  className="h-6 w-6 p-0 text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <label className="flex items-center justify-center h-10 border-2 border-dashed rounded cursor-pointer hover:border-violet-500 transition-colors">
              <Upload className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-xs text-gray-500">
                {isUploading ? 'Uploading...' : 'Upload Asset'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf,.svg"
                onChange={handleUploadAsset}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}
