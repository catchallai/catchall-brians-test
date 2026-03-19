import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Calendar,
  CheckCircle,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Zap,
  PenSquare,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';
import CalendarPostCard from '@/components/social/CalendarPostCard';
import CalendarPostModal from '@/components/modals/CalendarPostModal';
import SocialCalendarView from '@/components/social/SocialCalendarView';
import HashtagPoolCard from '@/components/social/HashtagPoolCard';
import NineGridEditor from '@/components/social/NineGridEditor';
import PlatformGridView from '@/components/social/PlatformGridView';
import PostGallery from '@/components/social/PostGallery';
import TeamManager from '@/components/social/TeamManager';
import CalendarNotifications from '@/components/social/CalendarNotifications';
import DraftPostsPlatformAssigner from '@/components/social/DraftPostsPlatformAssigner';
import PlatformPreviewCard from '@/components/social/PlatformPreviewCard';
import BulkScheduleModal from '@/components/social/BulkScheduleModal';
import PostTemplateManager from '@/components/social/PostTemplateManager';
import PostQueueManager from '@/components/social/PostQueueManager';
import OptimalTimeAnalyzer from '@/components/social/OptimalTimeAnalyzer';
import QuickPostModal from '@/components/social/QuickPostModal';
import BufferComposer from '@/components/social/BufferComposer';

const CALENDAR_PLATFORMS = [
  'all',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'Twitter',
  'YouTube',
  'TikTok',
];

// TODO: Replace with a shared Enum once a single source of truth for statuses is established
const CALENDAR_STATUSES = [
  'all',
  'draft',
  'scheduled',
  'pending_approval',
  'approved',
  'published',
];

export default function SocialCalendar() {
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showQuickPost, setShowQuickPost] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [approverName, setApproverName] = useState('');
  const [showApprovalSection, setShowApprovalSection] = useState(false);
  const [viewMode, setViewMode] = useState('composer');
  const [calendarViewType, setCalendarViewType] = useState('month');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nineGridPosts, setNineGridPosts] = useState(Array(9).fill(null));
  const [galleryPosts, setGalleryPosts] = useState([]);
  const queryClient = useQueryClient();

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts', startDate, endDate],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 100),
  });

  const { data: hashtagPool = [] } = useQuery({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 50),
  });

  const filteredPosts = posts
    .filter((p) => {
      const postDate = new Date(p.scheduled_date);
      // Expand window to cover week/day navigation that goes beyond the current month boundary
      const windowStart = startOfWeek(startOfMonth(currentMonth));
      const windowEnd = endOfWeek(endOfMonth(currentMonth));
      const inRange = postDate >= windowStart && postDate <= windowEnd;
      const matchesPlatform = platformFilter === 'all' || p.platforms?.includes(platformFilter);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return inRange && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setShowModal(false);
      setSelectedPost(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setShowModal(false);
      setSelectedPost(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-posts'] }),
  });

  const addHashtagMutation = useMutation({
    mutationFn: (hashtag) =>
      base44.entities.HashtagPool.create({ hashtag: hashtag.replace('#', '') }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setNewHashtag('');
    },
  });

  const deleteHashtagMutation = useMutation({
    mutationFn: (id) => base44.entities.HashtagPool.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const publishNowMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await base44.functions.invoke('autoPostToSocial', { postId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });

  const handleSave = async (data) => {
    if (selectedPost) {
      await updateMutation.mutateAsync({ id: selectedPost.id, data });
    } else {
      await createMutation.mutateAsync({ ...data, order: filteredPosts.length });
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedPost({
      title: template.title_template || '',
      caption: template.caption_template || '',
      platforms: template.platforms || [],
      hashtags: template.hashtags || [],
      media_type: template.media_type || 'none',
      status: 'draft',
    });
    setShowTemplateModal(false);
    setShowModal(true);
  };

  const handleEdit = (post) => {
    // Always get the freshest version of the post from the fetched list
    const freshPost = posts.find((p) => p.id === post.id) || post;
    setSelectedPost(freshPost);
    setShowModal(true);
  };

  const handleDelete = (post) => {
    if (confirm('Delete this post?')) {
      deleteMutation.mutate(post.id);
    }
  };

  const handleApproveAll = async () => {
    if (!approverName.trim()) {
      alert('Please enter approver name');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    for (const post of filteredPosts.filter(
      (p) => p.status !== 'approved' && p.status !== 'published'
    )) {
      await base44.entities.CalendarPost.update(post.id, {
        status: 'approved',
        approved_by: approverName,
        approved_date: today,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    setShowApprovalSection(false);
    setApproverName('');
  };

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isViewer = user?.social_media_role === 'viewer';
  const canEdit = !isViewer;
  const dateRange = `${format(startOfMonth(currentMonth), 'MMM d, yyyy')} - ${format(endOfMonth(currentMonth), 'MMM d, yyyy')}`;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social Calendar</h1>
          <p className="text-gray-500 mt-1">Plan and preview upcoming social media posts</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <Badge variant="outline" className="text-xs">
              {user.social_media_role || 'editor'}
            </Badge>
          )}
          {/* View Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('composer')}
              className={`gap-1.5 px-4 ${viewMode === 'composer' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <PenSquare className="w-4 h-4" />
              Compose
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('nine-grid')}
              className={`gap-1.5 px-4 ${viewMode === 'nine-grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              9-Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={`gap-1.5 px-4 ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('platform-grid')}
              className={`gap-1.5 px-4 ${viewMode === 'platform-grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Platforms
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`gap-1.5 px-4 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </Button>
          </div>
          {user?.social_media_role === 'admin' && (
            <Button onClick={() => setShowQuickPost(true)} variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Quick Post
            </Button>
          )}
          {canEdit && (
            <>
              <Button
                onClick={() => setShowTemplateModal(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Templates
              </Button>
              <Button onClick={() => setShowBulkModal(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Bulk Schedule
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Add Post
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Draft Posts Platform Assigner */}
      <DraftPostsPlatformAssigner
        posts={filteredPosts}
        onUpdatePost={({ id, platforms }) => {
          updateMutation.mutate({ id, data: { platforms } });
        }}
      />

      <div>
        {/* Calendar Header */}
        <Card className="glass-card rounded-2xl mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg"
                  alt="CatchAll"
                  className="h-8 object-contain"
                />
                <div className="border-l pl-4">
                  <h2 className="font-bold text-gray-900">Social Calendar</h2>
                  <p className="text-sm text-gray-500">{dateRange}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Composer View (Buffer-style) */}
        {viewMode === 'composer' && (
          <Card className="glass-card rounded-2xl">
            <CardContent className="p-6">
              <BufferComposer hashtagPool={hashtagPool} onSuccess={() => {}} />
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <>
            <div className="flex justify-end mb-4">
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewType('day')}
                  className={`px-4 ${calendarViewType === 'day' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  Day
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewType('week')}
                  className={`px-4 ${calendarViewType === 'week' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalendarViewType('month')}
                  className={`px-4 ${calendarViewType === 'month' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  Month
                </Button>
              </div>
            </div>
            {/* Platform & status filter chips */}
            <div className="flex gap-2 flex-wrap items-center mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Platform:
              </span>
              {CALENDAR_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    platformFilter === p
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500'
                  }`}
                >
                  {p === 'all' ? 'All' : p}
                </button>
              ))}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-2">
                Status:
              </span>
              {CALENDAR_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                    statusFilter === s
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <SocialCalendarView
              posts={filteredPosts}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onAddPost={() => setShowModal(true)}
              onEditPost={handleEdit}
              viewType={calendarViewType}
              onViewTypeChange={setCalendarViewType}
            />
          </>
        )}

        {/* 9-Grid View */}
        {viewMode === 'nine-grid' && (
          <>
            <NineGridEditor
              posts={filteredPosts}
              onPostsChange={(updatedPosts) => {
                // Update order in DB based on new grid positions
                updatedPosts.forEach((post, idx) => {
                  if (post && post.id) {
                    updateMutation.mutate({ id: post.id, data: { order: idx } });
                  }
                });
              }}
              onEditPost={(post, isPreview) => {
                setSelectedPost(post);
                setShowModal(true);
              }}
              onAddPost={(position, suggestedDate) => {
                setSelectedPost(suggestedDate ? { scheduled_date: suggestedDate } : null);
                setShowModal(true);
              }}
            />
            <PostGallery posts={galleryPosts} onPostsChange={setGalleryPosts} />
          </>
        )}

        {/* Platform Grid View */}
        {viewMode === 'platform-grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <PlatformPreviewCard
              platform="Facebook"
              posts={filteredPosts}
              onEditPost={handleEdit}
            />
            <PlatformPreviewCard
              platform="Instagram"
              posts={filteredPosts}
              onEditPost={handleEdit}
            />
            <PlatformPreviewCard
              platform="LinkedIn"
              posts={filteredPosts}
              onEditPost={handleEdit}
            />
            <PlatformPreviewCard platform="Twitter" posts={filteredPosts} onEditPost={handleEdit} />
            <PlatformPreviewCard platform="YouTube" posts={filteredPosts} onEditPost={handleEdit} />
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' &&
          (filteredPosts.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-16 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts scheduled</h3>
                <p className="text-gray-500 mb-4">Add your first post to the calendar</p>
                <Button onClick={() => setShowModal(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex flex-col">
                  <CalendarPostCard
                    post={post}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    compact
                    showDeleteButton={true}
                  />
                  {post.caption && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3 px-1">{post.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* Enhanced Features Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <PostQueueManager />
            <CalendarNotifications />
            <HashtagPoolCard
              hashtags={hashtagPool}
              onAdd={(hashtag) => addHashtagMutation.mutate(hashtag)}
              onDelete={(id) => deleteHashtagMutation.mutate(id)}
              isAddLoading={addHashtagMutation.isPending}
            />
          </div>
          <div className="space-y-6">
            <OptimalTimeAnalyzer />
            <TeamManager />
          </div>
        </div>

        {/* Approval Section */}
        <Card className="border-0 shadow-sm mt-6 bg-white dark:bg-gray-800 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Sign Off Approved By
                </label>
                <div className="border-b-2 border-emerald-400 mt-2 pb-2">
                  {showApprovalSection ? (
                    <Input
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      placeholder="Enter approver name..."
                      className="border-0 p-0 h-8 text-lg focus-visible:ring-0 bg-transparent"
                    />
                  ) : (
                    <span className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                      {filteredPosts.find((p) => p.approved_by)?.approved_by || '—'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Sign Off Date
                </label>
                <div className="border-b-2 border-emerald-400 mt-2 pb-2">
                  <span className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                    {filteredPosts.find((p) => p.approved_date)?.approved_date
                      ? format(
                          new Date(filteredPosts.find((p) => p.approved_date).approved_date),
                          'MMM d, yyyy'
                        )
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                {showApprovalSection ? (
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      onClick={handleApproveAll}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 h-auto text-base font-semibold shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve All Posts
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setShowApprovalSection(false)}
                      className="px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setShowApprovalSection(true)}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-4 h-auto text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Sign Off Calendar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <QuickPostModal open={showQuickPost} onClose={() => setShowQuickPost(false)} />

      <CalendarPostModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        hashtagPool={hashtagPool}
      />

      <BulkScheduleModal open={showBulkModal} onClose={() => setShowBulkModal(false)} />

      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <PostTemplateManager onUseTemplate={handleUseTemplate} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
