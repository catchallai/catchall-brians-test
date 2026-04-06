import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import {
  Plus,
  Calendar,
  CheckCircle,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Zap,
  PenSquare,
  Filter,
  X,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addDays,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import CalendarPostCard from '@/components/social/CalendarPostCard';
import CalendarPostModal from '@/components/modals/CalendarPostModal';
import SocialCalendarView from '@/components/social/SocialCalendarView';
import { AllHashtagsSection } from '@/components/hashtags/AllHashtagsSection';
import { CreateHashtagPoolSection } from '@/components/hashtags/CreateHashtagPoolSection';
import { CategoriesSidebar } from '@/components/hashtags/CategoriesSidebar';
import NineGridEditor from '@/components/social/NineGridEditor';
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
import COPY from '@/lib/copy';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [approverName, setApproverName] = useState('');
  const [showApprovalSection, setShowApprovalSection] = useState(false);
  const [viewMode, setViewMode] = useState('composer');
  const [calendarViewType, setCalendarViewType] = useState('month');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [gridSortOrder, setGridSortOrder] = useState('date_desc');
  const [galleryPosts, setGalleryPosts] = useState([]);
  const [hashtagCategory, setHashtagCategory] = useState('all');
  const [customHashtagCategories, setCustomHashtagCategories] = useState(
    /** @type {string[]} */ ([])
  );
  const queryClient = useQueryClient();

  // Update expired post statuses every time this page is visited
  useEffect(() => {
    base44.functions.invoke('updateExpiredPostStatuses', {}).catch(console.error);
  }, []);

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts', startDate, endDate],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 100),
  });

  const { data: hashtagPool = [] } = useQuery({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 200),
  });

  const filteredPosts = posts
    .filter((p) => {
      // Skip posts without a scheduled date since they won't appear on the calendar
      if (!p.scheduled_date) {
        return false;
      }
      const postDate = parseISO(p.scheduled_date);
      // Expand window to cover week/day navigation that goes beyond the current month boundary
      const windowStart = startOfWeek(startOfMonth(currentMonth));
      const windowEnd = endOfWeek(endOfMonth(currentMonth));
      const inRange = postDate >= windowStart && postDate <= windowEnd;
      const matchesPlatform = platformFilter === 'all' || p.platforms?.includes(platformFilter);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return inRange && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Strict month-only filter for the layout view (no week spillover)
  const filteredPostsForLayoutView = filteredPosts.filter((post) => {
    if (!post.scheduled_date) {
      return false;
    }
    const day = parseISO(post.scheduled_date);
    return day >= startOfMonth(currentMonth) && day <= endOfMonth(currentMonth);
  });

  const gridPosts = [...filteredPosts].sort((a, b) => {
    if (gridSortOrder === 'date_asc') {
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    }
    if (gridSortOrder === 'date_desc') {
      return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime();
    }
    if (gridSortOrder === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    if (gridSortOrder === 'platform') {
      const pa = (a.platforms?.[0] || '').toLowerCase();
      const pb = (b.platforms?.[0] || '').toLowerCase();
      return pa.localeCompare(pb);
    }
    // 'order' — default, matches existing filteredPosts sort
    return (a.order || 0) - (b.order || 0);
  });

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

  const reorderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-posts'] }),
  });

  /**
   * Save handler for CalendarPostModal.
   * - Existing posts (selectedPost has an id): update in place.
   * - New posts: determine layout order, then create.
   *   - If created from a specific layout tile, use that tile's position as the order.
   *   - Otherwise (e.g. calendar "Add Post" button, templates), scan the current month's
   *     posts for the first unused layout slot (0-8) and assign that as the order.
   */
  const handleSave = async (data) => {
    if (selectedPost?.id) {
      await updateMutation.mutateAsync({ id: selectedPost.id, data });
    } else {
      let order;
      if (selectedPost?.order !== undefined && selectedPost?.order !== null) {
        // Explicit tile position (e.g. clicked an empty layout tile)
        order = selectedPost.order;
      } else {
        // Find the first available layout slot not occupied by an existing post this month.
        // No upper-bound cap — the grid expands dynamically when higher slots are occupied.
        const usedOrders = new Set(
          filteredPosts.map((post) => post.order).filter((o) => typeof o === 'number')
        );
        order = 0;
        while (usedOrders.has(order)) {
          order++;
        }
      }
      await createMutation.mutateAsync({ ...data, order });
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
    deleteMutation.mutate(post.id);
  };

  const handleApproveAll = async () => {
    if (!approverName.trim()) {
      // eslint-disable-next-line no-alert
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

  // Batch update: await all updates, then invalidate query once
  const handleOnPostsChange = async (updatedPosts) => {
    try {
      await Promise.all(
        updatedPosts.map((post) =>
          post && post.id
            ? reorderMutation.mutateAsync({
                id: post.id,
                data: { order: post.order, scheduled_date: post.scheduled_date },
              })
            : Promise.resolve()
        )
      );
    } catch (error) {
      console.error('Failed to update nine-grid post ordering', error);
      throw error; // rethrow to trigger toast error in NineGridEditor
    } finally {
      // Always refetch to reconcile UI with server state
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    }
  };

  const isViewer = user?.social_media_role === 'viewer';
  const canEdit = !isViewer;
  const isCalendarView = viewMode === 'calendar';
  const dateRange =
    isCalendarView && calendarViewType === 'day'
      ? format(currentMonth, 'MMM d, yyyy')
      : isCalendarView && calendarViewType === 'week'
        ? `${format(startOfWeek(currentMonth), 'MMM d, yyyy')} - ${format(endOfWeek(currentMonth), 'MMM d, yyyy')}`
        : `${format(startOfMonth(currentMonth), 'MMM d, yyyy')} - ${format(endOfMonth(currentMonth), 'MMM d, yyyy')}`;

  const navigateCalendarPeriod = (direction) => {
    const step = direction === 'next' ? 1 : -1;

    if (isCalendarView) {
      if (calendarViewType === 'day') {
        setCurrentMonth(addDays(currentMonth, step));
        return;
      }

      if (calendarViewType === 'week') {
        setCurrentMonth(addDays(currentMonth, step * 7));
        return;
      }
    }

    setCurrentMonth(step > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const handleGoToToday = () => {
    if (isCalendarView) {
      setCurrentMonth(new Date());
      return;
    }

    setCurrentMonth(startOfMonth(new Date()));
  };

  const handleJumpToDate = (date) => {
    if (!date) {
      return;
    }

    setCurrentMonth(startOfMonth(date));
    setShowDatePicker(false);
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {COPY.socialCalendar.socialCalendar}
          </h1>
          <p className="text-gray-500 mt-1">{COPY.socialCalendar.socialCalendarDescription}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('composer')}
              className={`gap-1.5 px-4 ${viewMode === 'composer' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <PenSquare className="w-4 h-4" />
              {COPY.socialCalendar.compose}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('nine-grid')}
              className={`gap-1.5 px-4 ${viewMode === 'nine-grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              {COPY.socialCalendar.layout}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={`gap-1.5 px-4 ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <CalendarDays className="w-4 h-4" />
              {COPY.socialCalendar.calendar}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('platform-grid')}
              className={`gap-1.5 px-4 ${viewMode === 'platform-grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              {COPY.socialCalendar.platforms}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`gap-1.5 px-4 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              {COPY.socialCalendar.grid}
            </Button>
          </div>
          {user?.social_media_role === 'admin' && (
            <Button onClick={() => setShowQuickPost(true)} variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              {COPY.socialCalendar.quickPost}
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
                {COPY.socialCalendar.templates}
              </Button>
              <Button onClick={() => setShowBulkModal(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                {COPY.socialCalendar.bulkSchedule}
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                {COPY.socialCalendar.addPost}
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
        {viewMode !== 'composer' && (
          <Card className="glass-card rounded-2xl mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6925162397800755912704a9/3da4d00f2_catchall.jpg"
                    alt="CatchAll"
                    className="h-8 object-contain"
                  />
                  <div className="border-l pl-4 min-w-0">
                    <h2 className="font-bold text-gray-900">Social Calendar</h2>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 rounded-full border-gray-200 px-3 text-left text-sm font-medium text-gray-600 shadow-sm hover:border-violet-300 hover:text-violet-700"
                          >
                            <Calendar className="h-4 w-4 text-violet-500" />
                            <span className="truncate max-w-[8rem] sm:max-w-[12rem]">
                              {dateRange}
                            </span>
                            <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <MonthYearPicker value={currentMonth} onSelect={handleJumpToDate} />
                        </PopoverContent>
                      </Popover>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={handleGoToToday}
                        >
                          Today
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigateCalendarPeriod('prev')}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigateCalendarPeriod('next')}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="flex justify-end items-center gap-2 mb-4">
              {(() => {
                const activeFilterCount =
                  (platformFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);
                return (
                  <Button
                    variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-controls="calendar-filter-panel"
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Button>
                );
              })()}
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
            {showFilters && (
              <Card id="calendar-filter-panel" className="p-4 space-y-4 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filter Options</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPlatformFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger aria-label="Platform">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALENDAR_PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p === 'all' ? 'All Platforms' : p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALENDAR_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}
            <div className="mb-4">
              <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
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

        {/* Layout View */}
        {viewMode === 'nine-grid' && (
          <>
            <NineGridEditor
              posts={filteredPostsForLayoutView}
              onPostsChange={handleOnPostsChange}
              onEditPost={(post) => {
                setSelectedPost(post);
                setShowModal(true);
              }}
              onAddPost={(position, suggestedDate) => {
                setSelectedPost({
                  order: position,
                  ...(suggestedDate ? { scheduled_date: suggestedDate } : {}),
                });
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
        {viewMode === 'grid' && (
          <>
            {/* Toolbar */}
            <div className="flex justify-end items-center gap-2 mb-4">
              <Select value={gridSortOrder} onValueChange={setGridSortOrder}>
                <SelectTrigger className="w-44" aria-label="Sort By">
                  <SelectValue placeholder="Sort by…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest first</SelectItem>
                  <SelectItem value="date_asc">Oldest first</SelectItem>
                  <SelectItem value="status">By status</SelectItem>
                  <SelectItem value="platform">By platform</SelectItem>
                  <SelectItem value="order">Default order</SelectItem>
                </SelectContent>
              </Select>
              {(() => {
                const activeFilterCount =
                  (platformFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);
                return (
                  <Button
                    variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-controls="grid-filter-panel"
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </Button>
                );
              })()}
            </div>

            {/* Filter panel */}
            {showFilters && (
              <Card id="grid-filter-panel" className="p-4 space-y-4 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPlatformFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger aria-label="Platform">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALENDAR_PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p === 'all' ? 'All Platforms' : p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALENDAR_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}

            {/* Grid */}
            {gridPosts.length === 0 ? (
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
                {gridPosts.map((post) => (
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
            )}
          </>
        )}

        {/* Enhanced Features Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <PostQueueManager />
            <CalendarNotifications />
            <CreateHashtagPoolSection
              customCategories={customHashtagCategories}
              onNewCategoryAdded={(cat) =>
                setCustomHashtagCategories((prev) => [...new Set([...prev, cat])])
              }
            />
            <AllHashtagsSection selectedCategory={hashtagCategory} />
          </div>
          <div className="space-y-6">
            <OptimalTimeAnalyzer />
            <CategoriesSidebar
              selectedCategory={hashtagCategory}
              onSelectCategory={setHashtagCategory}
              customCategories={customHashtagCategories}
              onAddCategory={(cat) => {
                setCustomHashtagCategories((prev) => {
                  if (prev.includes(cat)) {
                    return prev;
                  }
                  return [...prev, cat];
                });
              }}
            />
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
