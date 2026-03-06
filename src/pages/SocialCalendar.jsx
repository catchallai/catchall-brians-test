import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Calendar, Plus, Sparkles, LayoutGrid, AlertCircle } from "lucide-react";
import CalendarView from '@/components/social/calendar/CalendarView';
import CalendarPostDetail from '@/components/social/calendar/CalendarPostDetail';
import CalendarFilters from '@/components/social/calendar/CalendarFilters';
import AutoScheduleAssistant from '@/components/social/calendar/AutoScheduleAssistant';
import DraftFromAssetsModal from '@/components/social/calendar/DraftFromAssetsModal';
import NineGridEditor from '@/components/social/NineGridEditor';

export default function SocialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month' | 'week'
  const [calendarMode, setCalendarMode] = useState('calendar'); // 'calendar' | 'grid'
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState(null);
  const [filters, setFilters] = useState({ platforms: [], briefs: [], statuses: [] });
  const qc = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts'],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 500),
  });

  const { data: activeBriefs = [] } = useQuery({
    queryKey: ['active-briefs'],
    queryFn: () => base44.entities.CampaignBrief.filter({ status: 'active' }),
    staleTime: 5 * 60 * 1000,
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, data }) => base44.entities.CalendarPost.update(postId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });

  // Handle drag and drop
  const handlePostDrop = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newDate = destination.droppableId;
    const post = posts.find(p => p.id === draggableId);

    if (post && post.scheduled_date !== newDate) {
      updatePostMutation.mutate({
        postId: post.id,
        data: { scheduled_date: newDate }
      });
    }
  };

  const handleSelectPost = useCallback((post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  }, []);

  const handleNavMonth = (direction) => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + direction, 1));
  };

  const handleNavWeek = (direction) => {
    setCurrentDate(d => new Date(d.getTime() + direction * 7 * 24 * 60 * 60 * 1000));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Social Calendar</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Drag & drop to reschedule posts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowDraftModal(true)} className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4" />
                Create Draft
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* View Toggle */}
            <ToggleGroup type="single" value={viewType} onValueChange={setViewType} className="border border-gray-200 dark:border-slate-700 rounded-lg p-1">
              <ToggleGroupItem value="month" className="data-[state=on]:bg-violet-600 data-[state=on]:text-white">
                Month
              </ToggleGroupItem>
              <ToggleGroupItem value="week" className="data-[state=on]:bg-violet-600 data-[state=on]:text-white">
                Week
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Filters */}
            <CalendarFilters filters={filters} onFiltersChange={setFilters} />

            {/* Stats */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {posts.length} total posts · {posts.filter(p => p.status === 'draft').length} drafts
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* AI Assistant */}
        {activeBriefs.length > 0 && (
          <AutoScheduleAssistant 
            campaignBriefId={activeBriefs[0].id}
            onSuccess={(count) => {
              qc.invalidateQueries({ queryKey: ['calendar-posts'] });
            }}
          />
        )}

        {/* Calendar */}
        <CalendarView
          currentDate={currentDate}
          onPrevMonth={() => handleNavMonth(-1)}
          onNextMonth={() => handleNavMonth(1)}
          viewType={viewType}
          posts={posts}
          onPostDrop={handlePostDrop}
          onSelectPost={handleSelectPost}
          selectedPost={selectedPost}
          filters={filters}
        />

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No posts scheduled yet</p>
            <Button onClick={() => setShowDraftModal(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {showPostDetail && selectedPost && (
        <CalendarPostDetail
          post={selectedPost}
          onClose={() => setShowPostDetail(false)}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ['calendar-posts'] });
            setShowPostDetail(false);
          }}
        />
      )}

      {/* Draft from Assets Modal */}
      <DraftFromAssetsModal
        open={showDraftModal}
        onOpenChange={setShowDraftModal}
        campaignBriefId={selectedBriefId}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['calendar-posts'] });
        }}
      />
    </div>
  );
}