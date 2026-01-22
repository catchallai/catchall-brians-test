import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar, 
  Printer, 
  CheckCircle, 
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import CalendarPostCard from '@/components/social/CalendarPostCard';
import CalendarPostModal from '@/components/modals/CalendarPostModal';
import SocialCalendarView from '@/components/social/SocialCalendarView';
import HashtagPoolCard from '@/components/social/HashtagPoolCard';
import NineGridEditor from '@/components/social/NineGridEditor';
import PlatformGridView from '@/components/social/PlatformGridView';
import TeamManager from '@/components/social/TeamManager';
import CalendarNotifications from '@/components/social/CalendarNotifications';

export default function SocialCalendar() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [approverName, setApproverName] = useState('');
  const [showApprovalSection, setShowApprovalSection] = useState(false);
  const [viewMode, setViewMode] = useState('nine-grid');
  const [calendarViewType, setCalendarViewType] = useState('month');
  const [nineGridPosts, setNineGridPosts] = useState([]);
  const printRef = useRef();
  const queryClient = useQueryClient();

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts', startDate, endDate],
    queryFn: () => base44.entities.CalendarPost.list('-scheduled_date', 100),
  });

  const { data: hashtagPool = [] } = useQuery({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 50),
  });

  const filteredPosts = posts.filter(p => {
    const postDate = new Date(p.scheduled_date);
    return postDate >= startOfMonth(currentMonth) && postDate <= endOfMonth(addMonths(currentMonth, 1));
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

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
    mutationFn: (hashtag) => base44.entities.HashtagPool.create({ hashtag: hashtag.replace('#', '') }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] });
      setNewHashtag('');
    },
  });

  const deleteHashtagMutation = useMutation({
    mutationFn: (id) => base44.entities.HashtagPool.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hashtag-pool'] }),
  });

  const handleSave = async (data) => {
    if (selectedPost) {
      await updateMutation.mutateAsync({ id: selectedPost.id, data });
    } else {
      await createMutation.mutateAsync({ ...data, order: filteredPosts.length });
    }
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const handleDelete = (post) => {
    if (confirm('Delete this post?')) {
      deleteMutation.mutate(post.id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApproveAll = async () => {
    if (!approverName.trim()) {
      alert('Please enter approver name');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    for (const post of filteredPosts.filter(p => p.status !== 'approved' && p.status !== 'published')) {
      await base44.entities.CalendarPost.update(post.id, {
        status: 'approved',
        approved_by: approverName,
        approved_date: today
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
  const dateRange = `${format(startOfMonth(currentMonth), 'MMM d, yyyy')} - ${format(endOfMonth(addMonths(currentMonth, 1)), 'MMM d, yyyy')}`;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
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
              onClick={() => setViewMode('nine-grid')}
              className={`gap-1.5 px-4 ${viewMode === 'nine-grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-violet-700 dark:text-violet-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Posts
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
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          {canEdit && (
            <Button onClick={() => setShowModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4" />
              Add Post
            </Button>
          )}
        </div>
      </div>

      {/* Printable Calendar View */}
      <div ref={printRef} className="print:p-8">
        {/* Calendar Header */}
        <Card className="glass-card rounded-2xl mb-6 print:shadow-none print:border">
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
              <div className="flex items-center gap-2 print:hidden">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <SocialCalendarView
              posts={filteredPosts}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onAddPost={() => setShowModal(true)}
              onEditPost={handleEdit}
              viewType={calendarViewType}
            />
          </>
        )}

        {/* 9-Grid View */}
         {viewMode === 'nine-grid' && (
           filteredPosts.length === 0 ? (
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
             <div className="space-y-4 max-w-2xl">
               {filteredPosts.map((post) => (
                 <CalendarPostCard 
                   key={post.id}
                   post={post} 
                   onEdit={handleEdit}
                   onDelete={handleDelete}
                 />
               ))}
             </div>
           )
         )}

        {/* Platform Grid View */}
        {viewMode === 'platform-grid' && (
          <PlatformGridView
            posts={filteredPosts}
            onAddPost={() => setShowModal(true)}
            onEditPost={(post, platform) => {
              setSelectedPost({ ...post, editingPlatform: platform });
              setShowModal(true);
            }}
            onDeletePost={(post) => {
              if (confirm('Delete this post?')) {
                deleteMutation.mutate(post.id);
              }
            }}
          />
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          filteredPosts.length === 0 ? (
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-3 print:gap-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="flex flex-col">
                  <CalendarPostCard 
                    post={post} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    compact
                  />
                  {post.caption && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3 px-1">{post.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Hashtag Pool, Team Manager & Notifications */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6 print:hidden">
          <div className="space-y-6">
            <CalendarNotifications />
            <HashtagPoolCard
              hashtags={hashtagPool}
              onAdd={(hashtag) => addHashtagMutation.mutate(hashtag)}
              onDelete={(id) => deleteHashtagMutation.mutate(id)}
              isAddLoading={addHashtagMutation.isPending}
            />
          </div>
          <TeamManager />
        </div>

        {/* Approval Section */}
        <Card className="border-0 shadow-sm mt-6 print:shadow-none print:border print:border-emerald-500 bg-white dark:bg-gray-800 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sign Off Approved By</label>
                <div className="border-b-2 border-emerald-400 mt-2 pb-2 print:min-h-[24px]">
                  {showApprovalSection ? (
                    <Input
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      placeholder="Enter approver name..."
                      className="border-0 p-0 h-8 text-lg focus-visible:ring-0 bg-transparent"
                    />
                  ) : (
                    <span className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                      {filteredPosts.find(p => p.approved_by)?.approved_by || '—'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sign Off Date</label>
                <div className="border-b-2 border-emerald-400 mt-2 pb-2 print:min-h-[24px]">
                  <span className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                    {filteredPosts.find(p => p.approved_date)?.approved_date 
                      ? format(new Date(filteredPosts.find(p => p.approved_date).approved_date), 'MMM d, yyyy')
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="print:hidden w-full sm:w-auto">
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
                    <Button size="lg" variant="outline" onClick={() => setShowApprovalSection(false)} className="px-4">
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

      {/* Modal */}
      <CalendarPostModal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedPost(null); }}
        post={selectedPost}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        hashtagPool={hashtagPool}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:p-8, .print\\:p-8 * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid #e5e7eb !important; }
          .print\\:border-red-500 { border-color: #ef4444 !important; }
          .print\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .print\\:gap-3 { gap: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
}