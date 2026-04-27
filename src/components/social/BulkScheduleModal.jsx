import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function BulkScheduleModal({ open, onClose }) {
  const [csvData, setCsvData] = useState([]);
  const [manualPosts, setManualPosts] = useState('');
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [scheduleError, setScheduleError] = useState('');
  const [intervalHours, setIntervalHours] = useState(24);
  const [uploadStatus, setUploadStatus] = useState([]);
  const queryClient = useQueryClient();

  const bulkCreateMutation = useMutation({
    mutationFn: async (posts) => {
      const results = [];
      for (const post of posts) {
        try {
          await base44.entities.CalendarPost.create(post);
          results.push({ success: true, post });
        } catch (error) {
          results.push({ success: false, post, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      setUploadStatus(results);
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setTimeout(() => {
        if (results.every((r) => r.success)) {
          onClose();
        }
      }, 2000);
    },
  });

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setCsvData(results.data.filter((row) => row.caption || row.content));
        },
      });
    }
  };

  const handleBulkSchedule = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse startDate (YYYY-MM-DD) as a local date at midnight to avoid UTC interpretation issues
    const startDateLocal = new Date(`${startDate}T00:00:00`);

    if (startDateLocal < today) {
      setScheduleError('Start date must be today or in the future.');
      return;
    }
    setScheduleError('');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let posts = [];

    if (csvData.length > 0) {
      posts = csvData.map((row, index) => ({
        caption: row.caption || row.content || '',
        image_url: row.image_url || row.image || '',
        platforms: row.platforms
          ? row.platforms.split(',').map((p) => p.trim())
          : ['Instagram', 'Facebook'],
        scheduled_date: new Date(startDateLocal.getTime() + index * intervalHours * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        timezone,
        status: 'scheduled',
        auto_post: row.auto_post === 'true' || row.auto_post === '1',
      }));
    } else if (manualPosts.trim()) {
      const lines = manualPosts.split('\n').filter((line) => line.trim());
      posts = lines.map((caption, index) => ({
        caption: caption.trim(),
        platforms: ['Instagram', 'Facebook'],
        scheduled_date: new Date(startDateLocal.getTime() + index * intervalHours * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        timezone,
        status: 'scheduled',
        auto_post: false,
      }));
    }

    if (posts.length > 0) {
      bulkCreateMutation.mutate(posts);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Schedule Posts</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div>
              <Label>Post Captions (one per line)</Label>
              <Textarea
                value={manualPosts}
                onChange={(e) => setManualPosts(e.target.value)}
                placeholder="Enter post captions, one per line...&#10;Example:&#10;Excited to announce our new product!&#10;Check out this amazing feature!&#10;Join us for a special event!"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {manualPosts.split('\n').filter((l) => l.trim()).length} posts
              </p>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-4">
                Upload CSV with columns: caption, image_url, platforms, auto_post
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => document.getElementById('csv-upload').click()}
                >
                  <Upload className="w-4 h-4" />
                  Choose CSV File
                </Button>
              </label>
              {csvData.length > 0 && (
                <Badge className="mt-3 bg-emerald-100 text-emerald-700">
                  {csvData.length} posts loaded
                </Badge>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => {
                setScheduleError('');
                setStartDate(e.target.value);
              }}
            />
            {scheduleError && <p className="text-xs text-red-500 mt-1">{scheduleError}</p>}
          </div>
          <div>
            <Label>Interval (hours)</Label>
            <Input
              type="number"
              value={intervalHours}
              onChange={(e) => setIntervalHours(parseInt(e.target.value))}
              min="1"
            />
          </div>
        </div>

        {uploadStatus.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
            <p className="text-sm font-medium mb-2">Upload Results:</p>
            {uploadStatus.map((result, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="truncate">{result.post.caption?.substring(0, 50)}...</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkSchedule}
            disabled={bulkCreateMutation.isPending || (csvData.length === 0 && !manualPosts.trim())}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {bulkCreateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Schedule {csvData.length || manualPosts.split('\n').filter((l) => l.trim()).length}{' '}
            Posts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
