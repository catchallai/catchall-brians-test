import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Zap, ArrowRight, Trash, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function PostQueueManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    platforms: [],
    hashtags: [],
    priority: 'normal',
    optimal_time_preference: 'peak_engagement',
    auto_schedule: true,
  });
  const queryClient = useQueryClient();

  const { data: queuedPosts = [] } = useQuery({
    queryKey: ['post-queue'],
    queryFn: () => base44.entities.PostQueue.filter({ queue_status: 'queued' }),
  });

  const { data: optimalTimes = [] } = useQuery({
    queryKey: ['optimal-times'],
    queryFn: () => base44.entities.OptimalPostingTime.filter({ is_peak_time: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PostQueue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-queue'] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PostQueue.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-queue'] }),
  });

  const schedulePostMutation = useMutation({
    mutationFn: async (queueItem) => {
      // Find optimal time for the platform
      const platformTimes = optimalTimes.filter((t) => queueItem.platforms.includes(t.platform));

      let scheduledDate = new Date();
      let scheduledTime = '09:00';

      if (platformTimes.length > 0 && queueItem.auto_schedule) {
        const bestTime = platformTimes.sort((a, b) => b.engagement_score - a.engagement_score)[0];
        scheduledDate = addDays(new Date(), 1);
        scheduledDate.setHours(bestTime.hour, 0, 0, 0);
        scheduledTime = `${bestTime.hour.toString().padStart(2, '0')}:00`;
      }

      // Create calendar post
      const calendarPost = await base44.entities.CalendarPost.create({
        title: queueItem.title,
        caption: queueItem.caption,
        image_url: queueItem.image_url || '',
        video_url: queueItem.video_url || '',
        media_type: queueItem.media_type || 'none',
        platforms: queueItem.platforms,
        hashtags: queueItem.hashtags || [],
        scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
        scheduled_time: scheduledTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: 'approved',
        auto_post: true,
      });

      // Update queue status
      await base44.entities.PostQueue.update(queueItem.id, {
        queue_status: 'scheduled',
        scheduled_post_id: calendarPost.id,
      });

      return calendarPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-queue'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      caption: '',
      platforms: [],
      hashtags: [],
      priority: 'normal',
      optimal_time_preference: 'peak_engagement',
      auto_schedule: true,
    });
  };

  const togglePlatform = (platform) => {
    const current = formData.platforms || [];
    if (current.includes(platform)) {
      setFormData({ ...formData, platforms: current.filter((p) => p !== platform) });
    } else {
      setFormData({ ...formData, platforms: [...current, platform] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <>
      <Card className="glass-card rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Post Queue
            <Badge variant="outline">{queuedPosts.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setIsOpen(true);
                setShowModal(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              aria-expanded={isOpen}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent>
            {queuedPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No posts in queue. Add posts for optimal scheduling!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedPosts.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                            {item.auto_schedule && (
                              <Badge variant="outline" className="gap-1">
                                <Zap className="w-3 h-3" />
                                Auto
                              </Badge>
                            )}
                          </div>
                          {item.title && (
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {item.title}
                            </h4>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {item.caption}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.platforms?.map((p) => (
                              <Badge key={p} variant="outline" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => schedulePostMutation.mutate(item)}
                            disabled={schedulePostMutation.isPending}
                            className="gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRemoveConfirmId(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Post to Queue</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Caption *</Label>
              <Textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Post content..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Platforms *</Label>
              <div className="flex flex-wrap gap-2">
                {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((p) => (
                  <Badge
                    key={p}
                    className={`cursor-pointer ${formData.platforms?.includes(p) ? 'bg-violet-600' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => togglePlatform(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Optimal Time</Label>
                <Select
                  value={formData.optimal_time_preference}
                  onValueChange={(v) => setFormData({ ...formData, optimal_time_preference: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="peak_engagement">Peak Engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || formData.platforms.length === 0}
              >
                Add to Queue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeConfirmId}
        onClose={() => setRemoveConfirmId(null)}
        onConfirm={() => {
          deleteMutation.mutate(removeConfirmId);
          setRemoveConfirmId(null);
        }}
        title="Remove from queue?"
        description="This action cannot be undone."
        confirmLabel="Remove"
      />
    </>
  );
}
