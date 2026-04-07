import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PLATFORMS as PLATFORM_CONFIGS } from '@/constants/platforms';

const PLATFORMS = PLATFORM_CONFIGS.filter((p) =>
  ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].includes(p.id)
).map((p) => ({
  ...p,
  name: p.id,
  color: p.tailwindGradient || p.tailwind,
}));

export default function QuickPostModal({ open, onClose }) {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState([]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handlePost = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) {
      return;
    }

    setPosting(true);
    setResults([]);

    try {
      const response = await base44.functions.invoke('quickPostToSocial', {
        content,
        platforms: selectedPlatforms,
      });

      setResults(response.data.results || []);

      // If all successful, close after a moment
      const allSuccess = response.data.results.every((r) => r.success);
      if (allSuccess) {
        setTimeout(() => {
          onClose();
          setContent('');
          setSelectedPlatforms([]);
          setResults([]);
        }, 2000);
      }
    } catch (error) {
      setResults([{ platform: 'Error', success: false, error: error.message }]);
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.name);
                return (
                  <button
                    key={platform.name}
                    onClick={() => togglePlatform(platform.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${platform.color} text-white border-transparent`
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Post Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">{content.length} characters</div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, idx) => (
                <Alert
                  key={idx}
                  className={
                    result.success
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20'
                  }
                >
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription
                    className={
                      result.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }
                  >
                    <strong>{result.platform}:</strong>{' '}
                    {result.success ? 'Posted successfully!' : result.error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={posting}>
              Cancel
            </Button>
            <Button
              onClick={handlePost}
              disabled={!content.trim() || selectedPlatforms.length === 0 || posting}
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Now'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
