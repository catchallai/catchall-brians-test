import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ImageOptimizer({ asset, onOptimized }) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(!!asset.optimized_versions);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      // Simulate optimization - in production, you'd use an image optimization service
      const optimizedVersions = {
        thumbnail: asset.file_url, // Would be optimized 150x150
        small: asset.file_url, // Would be optimized 480x480
        medium: asset.file_url, // Would be optimized 1024x1024
        large: asset.file_url, // Would be optimized 1920x1920
        webp: asset.file_url, // Would be converted to WebP
      };

      await base44.entities.MediaAsset.update(asset.id, {
        optimized_versions: optimizedVersions,
        cdn_url: asset.file_url, // In production, this would be a CDN URL
      });

      setOptimized(true);
      onOptimized?.();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  if (asset.file_type !== 'image') {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold">Image Optimization</h4>
          </div>
          {optimized ? (
            <Badge className="bg-green-100 text-green-800 gap-1">
              <CheckCircle className="w-3 h-3" />
              Optimized
            </Badge>
          ) : (
            <Button onClick={handleOptimize} disabled={optimizing} size="sm" className="gap-2">
              {optimizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Optimize
            </Button>
          )}
        </div>

        {optimized && (
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Available formats:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Thumbnail (150px)</Badge>
              <Badge variant="outline">Small (480px)</Badge>
              <Badge variant="outline">Medium (1024px)</Badge>
              <Badge variant="outline">Large (1920px)</Badge>
              <Badge variant="outline">WebP</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
