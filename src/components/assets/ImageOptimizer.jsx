import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles } from "lucide-react";
import { base44 } from '@/api/base44Client';

export default function ImageOptimizer({ imageUrl, onOptimized }) {
  const [optimizing, setOptimizing] = useState(false);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState([80]);
  const [maxWidth, setMaxWidth] = useState([1920]);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      // Generate optimized version using AI image generation with constraints
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Optimize this image: reduce file size, convert to ${format}, quality ${quality[0]}%, max width ${maxWidth[0]}px`,
        existing_image_urls: [imageUrl]
      });
      
      onOptimized(result.url);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h4 className="font-semibold text-sm">Optimize Image</h4>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="webp">WebP (Best)</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs">Quality: {quality[0]}%</Label>
          <Slider value={quality} onValueChange={setQuality} min={10} max={100} step={10} />
        </div>
        
        <div>
          <Label className="text-xs">Max Width: {maxWidth[0]}px</Label>
          <Slider value={maxWidth} onValueChange={setMaxWidth} min={320} max={3840} step={160} />
        </div>
        
        <Button onClick={handleOptimize} disabled={optimizing} className="w-full h-8 text-xs">
          {optimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Optimize'}
        </Button>
      </div>
    </div>
  );
}