import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Loader2, ExternalLink, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function WebsiteScreenshot({
  url,
  screenshotUrl,
  onScreenshotCaptured,
  showCaptureButton = true,
  className = '',
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [localScreenshot, setLocalScreenshot] = useState(screenshotUrl);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [error, setError] = useState(null);

  const captureScreenshot = async () => {
    if (!url) {
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const screenshotPreview = `https://image.thum.io/get/width/1200/crop/800/${url}`;

      setLocalScreenshot(screenshotPreview);
      if (onScreenshotCaptured) {
        onScreenshotCaptured(screenshotPreview);
      }
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      setError('Failed to capture screenshot');
      // Use a fallback placeholder
      const fallbackUrl = `https://via.placeholder.com/1200x800/f3f4f6/9ca3af?text=${encodeURIComponent(url)}`;
      setLocalScreenshot(fallbackUrl);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <div
        className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`}
      >
        {localScreenshot ? (
          <>
            <img
              src={localScreenshot}
              alt="Website screenshot"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/1200x800/f3f4f6/9ca3af?text=Preview`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-between p-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1 text-xs h-7"
                onClick={() => setShowFullscreen(true)}
              >
                <Maximize2 className="w-3 h-3" />
                Expand
              </Button>
              {showCaptureButton && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 text-xs h-7"
                  onClick={captureScreenshot}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Refresh
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[120px] p-4">
            {isCapturing ? (
              <>
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                <p className="text-xs text-gray-500">Capturing screenshot...</p>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500 mb-2">No screenshot available</p>
                {showCaptureButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={captureScreenshot}
                  >
                    <Camera className="w-3 h-3" />
                    Capture
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        {error && (
          <p className="absolute bottom-2 left-2 text-xs text-red-500 bg-white/90 px-2 py-1 rounded">
            {error}
          </p>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              Website Preview
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1 font-normal"
              >
                {url} <ExternalLink className="w-3 h-3" />
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4">
            <img
              src={localScreenshot}
              alt="Website screenshot full"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
