import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AllChannelsTab } from '@/types/enums';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Clock,
  FileText,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Image,
  Play,
  ArrowUpDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { PostStatus } from '@/types/enums';
import CalendarPostModal from '@/components/modals/CalendarPostModal';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
  YouTubeIcon,
} from '@/components/icons/BrandIcons';

const PLATFORM_COLORS = {
  Facebook: 'bg-blue-600',
  Instagram: 'bg-gradient-to-br from-pink-500 to-purple-600',
  LinkedIn: 'bg-blue-700',
  Twitter: 'bg-gray-900',
  YouTube: 'bg-red-600',
};

const PLATFORM_ICONS = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  LinkedIn: LinkedInIcon,
  Twitter: TwitterIcon,
  YouTube: YouTubeIcon,
};

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  pending_review: {
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  changes_requested: {
    label: 'Changes Requested',
    color: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
  },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  published: { label: 'Published', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  deleted: { label: 'Deleted', color: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' },
};

const APPROVAL_STATUSES = [
  PostStatus.PENDING_APPROVAL,
  PostStatus.PENDING_REVIEW,
  PostStatus.CHANGES_REQUESTED,
];
const APPROVAL_VIEW_STATUSES = [
  PostStatus.PENDING_APPROVAL,
  PostStatus.PENDING_REVIEW,
  PostStatus.CHANGES_REQUESTED,
];

function PostCard({
  post,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onRequestChanges,
  showApprovalActions,
}) {
  const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
  const showActions =
    showApprovalActions || (!!onApprove && APPROVAL_STATUSES.includes(post.status));

  return (
    <Card
      className="border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
      onClick={() => onEdit(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          onEdit(post);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Media Thumbnail */}
          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {post.image_url ? (
              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
            ) : post.video_url ? (
              <div className="relative w-full h-full">
                <video src={post.video_url} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            ) : (
              <Image className="w-6 h-6 text-gray-300" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {post.title && (
                  <p className="font-semibold text-gray-900 text-sm truncate">{post.title}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                  {post.caption || <span className="italic text-gray-400">No caption</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge className={`text-xs ${statusCfg.color}`}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${statusCfg.dot}`}
                  />
                  {statusCfg.label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              {/* Platform Chips + Schedule */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1">
                  {(post.platforms || []).map((pl) => (
                    <span
                      key={pl}
                      title={pl}
                      aria-label={pl}
                      className={`w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${PLATFORM_COLORS[pl] || 'bg-gray-400'}`}
                    >
                      {(() => {
                        const PlatformIcon = PLATFORM_ICONS[pl];
                        return PlatformIcon ? <PlatformIcon className="w-3 h-3" /> : pl[0];
                      })()}
                    </span>
                  ))}
                </div>
                {post.scheduled_date && (
                  <span className="text-xs text-gray-400">
                    {format(new Date(post.scheduled_date), 'MMM d, yyyy')}
                    {post.scheduled_time ? ` · ${post.scheduled_time}` : ''}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {showActions && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(post);
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(post);
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                    {onRequestChanges &&
                      ['pending_review', 'pending_approval'].includes(post.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-orange-700 border-orange-300 hover:bg-orange-50 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestChanges(post);
                          }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Request Changes
                        </Button>
                      )}
                  </>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostList({
  posts,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onRequestChanges,
  showApprovalActions,
  emptyMessage,
  emptyIcon: EmptyIcon,
}) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <EmptyIcon className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onReject={onReject}
          onRequestChanges={onRequestChanges}
          showApprovalActions={showApprovalActions}
        />
      ))}
    </div>
  );
}

const VALID_TABS = new Set(Object.values(AllChannelsTab));

export default function AllChannels() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const queryClient = useQueryClient();

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : AllChannelsTab.ALL;
  // Typed as string (not AllChannelsTab) because Radix's Tabs onValueChange
  // signature is (value: string) => void; we guard at read time via VALID_TABS
  // so any stray value simply falls back to AllChannelsTab.ALL.
  /**
   * @param {string} tab
   * @returns {void}
   */
  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === AllChannelsTab.ALL) next.delete('tab');
    else next.set('tab', tab);
    // Push a history entry so the browser back/forward buttons restore the previous tab.
    setSearchParams(next);
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts-all'],
    queryFn: () => base44.entities.CalendarPost.list('-created_date', 500),
  });

  const { data: hashtagPool = [] } = useQuery({
    queryKey: ['hashtag-pool'],
    queryFn: () => base44.entities.HashtagPool.list('-usage_count', 50),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setShowModal(false);
      setSelectedPost(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
      setShowModal(false);
      setSelectedPost(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (post) =>
      base44.entities.CalendarPost.update(post.id, {
        status: 'deleted',
        workflow_history: [
          ...(post.workflow_history || []),
          {
            action: 'deleted',
            by_email: user?.email,
            by_name: user?.full_name || user?.email,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
    },
  });

  const handleEdit = (post) => {
    if (APPROVAL_VIEW_STATUSES.includes(post.status)) {
      navigate(`${createPageUrl('PostApprovalView')}?id=${post.id}`);
      return;
    }
    setSelectedPost(post);
    setShowModal(true);
  };

  const handleDelete = (post) => {
    // eslint-disable-next-line no-alert
    if (confirm('Delete this post?')) {
      deleteMutation.mutate(post);
    }
  };

  const handleApprove = (post) => {
    updateMutation.mutate({
      id: post.id,
      data: {
        status: 'approved',
        approved_by: user?.email || '',
        approved_by_name: user?.full_name || '',
        approved_date: new Date().toISOString().split('T')[0],
      },
    });
  };

  const handleReject = (post) => {
    // eslint-disable-next-line no-alert
    const reason = prompt('Reason for rejection (optional):') ?? '';
    updateMutation.mutate({
      id: post.id,
      data: { status: 'rejected', rejected_reason: reason },
    });
  };

  const handleRequestChanges = (post) => {
    updateMutation.mutate({
      id: post.id,
      data: { status: 'changes_requested' },
    });
  };

  const handleSave = async (data) => {
    if (selectedPost?.id) {
      await updateMutation.mutateAsync({ id: selectedPost.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filtered = posts
    .filter((p) => {
      if (!search) {
        return true;
      }
      const q = search.toLowerCase();
      return (
        p.caption?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        (p.platforms || []).some((pl) => pl.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const rawA = sortBy === 'scheduled_date' ? a.scheduled_date : a.created_date;
      const rawB = sortBy === 'scheduled_date' ? b.scheduled_date : b.created_date;
      const tsA = rawA ? new Date(rawA).getTime() : 0;
      const tsB = rawB ? new Date(rawB).getTime() : 0;
      return sortOrder === 'desc' ? tsB - tsA : tsA - tsB;
    });

  // Tab buckets
  const approvalPosts = filtered.filter((p) =>
    ['pending_approval', 'pending_review', 'changes_requested'].includes(p.status)
  );
  const queuePosts = filtered.filter((p) => ['approved'].includes(p.status));
  const draftPosts = filtered.filter((p) => ['draft', 'rejected'].includes(p.status));
  const sentPosts = filtered.filter((p) => ['scheduled', 'published'].includes(p.status));
  const deletedPosts = filtered.filter((p) => p.status === 'deleted');

  const PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'YouTube'];

  const stats = [
    {
      label: 'Awaiting Approval',
      count: approvalPosts.length,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: ShieldCheck,
    },
    {
      label: 'Approved / Queue',
      count: queuePosts.length,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: Clock,
    },
    {
      label: 'Drafts',
      count: draftPosts.length,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      icon: FileText,
    },
    {
      label: 'Scheduled',
      count: sentPosts.length,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      icon: Send,
    },
    {
      label: 'Deleted',
      count: deletedPosts.length,
      color: 'text-red-500',
      bg: 'bg-red-50',
      icon: Trash2,
    },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Channels</h1>
          <p className="text-gray-500 mt-1">Manage posts across all platforms and workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedPost(null);
              setShowModal(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 gap-2"
          >
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm`}
              >
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform summary */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="text-sm font-semibold text-gray-500">By Platform:</p>
            {PLATFORMS.map((pl) => {
              const count = filtered.filter((p) => (p.platforms || []).includes(pl)).length;
              const PlatformIcon = PLATFORM_ICONS[pl];
              return (
                <div key={pl} className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${PLATFORM_COLORS[pl] || 'bg-gray-400'}`}
                  >
                    {PlatformIcon ? <PlatformIcon className="w-3.5 h-3.5" /> : pl[0]}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{pl}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by caption, title, or platform..."
            className="pl-9 bg-white"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_date">Created Date</SelectItem>
            <SelectItem value="scheduled_date">Post Date</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="bg-white"
          onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
          title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white border border-gray-200">
            <TabsTrigger value="all" className="gap-2">
              All
              {filtered.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center">
                  {filtered.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              Approvals
              {approvalPosts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                  {approvalPosts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="w-4 h-4" />
              Queue
              {queuePosts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                  {queuePosts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              <FileText className="w-4 h-4" />
              Drafts
              {draftPosts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center">
                  {draftPosts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="w-4 h-4" />
              Scheduled
              {sentPosts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">
                  {sentPosts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Deleted
              {deletedPosts.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {deletedPosts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <PostList
              posts={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestChanges={handleRequestChanges}
              showApprovalActions={false}
              emptyMessage="No posts found"
              emptyIcon={FileText}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <div className="mb-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Posts awaiting approval before they can be scheduled or published.
            </div>
            <PostList
              posts={approvalPosts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestChanges={handleRequestChanges}
              showApprovalActions={true}
              emptyMessage="No posts awaiting approval"
              emptyIcon={ShieldCheck}
            />
          </TabsContent>

          <TabsContent value="queue">
            <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <Clock className="w-4 h-4 flex-shrink-0" />
              Approved posts waiting to be published at their scheduled time.
            </div>
            <PostList
              posts={queuePosts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showApprovalActions={false}
              emptyMessage="No posts in the queue"
              emptyIcon={Clock}
            />
          </TabsContent>

          <TabsContent value="drafts">
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <FileText className="w-4 h-4 flex-shrink-0" />
              Drafts and rejected posts that need work before submission.
            </div>
            <PostList
              posts={draftPosts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showApprovalActions={false}
              emptyMessage="No drafts"
              emptyIcon={FileText}
            />
          </TabsContent>

          <TabsContent value="sent">
            <div className="mb-3 flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-4 py-2.5">
              <Send className="w-4 h-4 flex-shrink-0" />
              Posts that have been scheduled for publishing.
            </div>
            <PostList
              posts={sentPosts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showApprovalActions={false}
              emptyMessage="No published posts yet"
              emptyIcon={Send}
            />
          </TabsContent>

          <TabsContent value="deleted">
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              Posts that have been deleted. These are kept for audit history.
            </div>
            <PostList
              posts={deletedPosts}
              onEdit={handleEdit}
              showApprovalActions={false}
              emptyMessage="No deleted posts"
              emptyIcon={Trash2}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Modal */}
      <CalendarPostModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        hashtagPool={
          Array.isArray(
            /** @type {import('@/components/social/HashtagPoolSelector').HashtagPool[]} */ (
              hashtagPool
            )
          )
            ? /** @type {import('@/components/social/HashtagPoolSelector').HashtagPool[]} */ (
                hashtagPool
              )
            : []
        }
      />
    </div>
  );
}
