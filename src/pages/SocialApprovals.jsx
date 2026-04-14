import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ShieldCheck,
  FileText,
  Image,
  Clock,
  Target,
  Eye,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import ApprovalQueueTab from '@/components/social/approvals/ApprovalQueueTab';
import ApprovalReviewTab from '@/components/social/approvals/ApprovalReviewTab';
import ApprovalHistoryTab from '@/components/social/approvals/ApprovalHistoryTab';
import ApprovalMetricsTab from '@/components/social/approvals/ApprovalMetricsTab';
import CopyPoolTab from '@/components/approvals/CopyPoolTab';
import GraphicTemplatePoolTab from '@/components/approvals/GraphicTemplatePoolTab';
import CampaignBriefTab from '@/components/approvals/CampaignBriefTab';

const TABS = [
  {
    group: 'Content Assets',
    items: [
      {
        key: 'copy_pool',
        label: 'Copy Pool',
        icon: FileText,
        description: 'Approve written copy for all channels',
      },
      {
        key: 'templates',
        label: 'Graphic Templates',
        icon: Image,
        description: 'Approve visual templates for all channels',
      },
      {
        key: 'brief',
        label: 'Campaign Briefs',
        icon: Target,
        description: 'Build monthly multi-channel campaign briefs from approved assets',
      },
    ],
  },
  {
    group: 'Social Post Approvals',
    items: [
      {
        key: 'queue',
        label: 'Approval Queue',
        icon: Clock,
        description: 'Individual posts pending review',
      },
      { key: 'review', label: 'In Review', icon: Eye },
      { key: 'history', label: 'History', icon: FileText },
      { key: 'metrics', label: 'Metrics', icon: BarChart3 },
    ],
  },
];

const STATUS_LABELS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  pending_review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-700' },
  changes_requested: { label: 'Changes Needed', color: 'bg-orange-100 text-orange-700' },
  pending_approval: { label: 'Pending Approval', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  published: { label: 'Published', color: 'bg-violet-100 text-violet-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  deleted: { label: 'Deleted', color: 'bg-gray-200 text-gray-500' },
};

export default function SocialApprovals() {
  const [activeTab, setActiveTab] = useState('copy_pool');
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts-all'],
    queryFn: () => base44.entities.CalendarPost.list('-updated_date', 200),
  });

  const { data: pendingCopy = [] } = useQuery({
    queryKey: ['pending-copy-count'],
    queryFn: () => base44.entities.ApprovedCopy.filter({ status: 'pending_review' }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: pendingTemplates = [] } = useQuery({
    queryKey: ['pending-template-count'],
    queryFn: () => base44.entities.ApprovedGraphicTemplate.filter({ status: 'pending_review' }),
    staleTime: 2 * 60 * 1000,
  });

  const pendingPostCount = allPosts.filter((p) =>
    ['pending_review', 'pending_approval', 'changes_requested'].includes(p.status)
  ).length;

  const totalPending = pendingPostCount + pendingCopy.length + pendingTemplates.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Content Approvals
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Copy · Templates · Campaign Briefs · Social Posts
                </p>
              </div>
            </div>
            {totalPending > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                <AlertCircle className="w-3 h-3" />
                {totalPending} pending
              </Badge>
            )}
          </div>

          {/* Grouped Tab Navigation */}
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map((group, gi) => (
              <React.Fragment key={group.group}>
                {gi > 0 && (
                  <div className="w-px bg-gray-100 dark:bg-slate-700 self-stretch my-2 mx-2 flex-shrink-0" />
                )}
                <div className="flex items-end">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    const count =
                      tab.key === 'queue'
                        ? pendingPostCount
                        : tab.key === 'copy_pool'
                          ? pendingCopy.length
                          : tab.key === 'templates'
                            ? pendingTemplates.length
                            : 0;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setSelectedPost(null);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                          isActive
                            ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {count > 9 ? '9+' : count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Copy Pool */}
        {activeTab === 'copy_pool' && <CopyPoolTab currentUser={currentUser} />}

        {/* Graphic Templates */}
        {activeTab === 'templates' && <GraphicTemplatePoolTab currentUser={currentUser} />}

        {/* Campaign Briefs */}
        {activeTab === 'brief' && <CampaignBriefTab currentUser={currentUser} />}

        {/* Social Post Approvals (existing) */}
        {isLoading && ['queue', 'review', 'history', 'metrics'].includes(activeTab) ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            {activeTab === 'queue' && (
              <ApprovalQueueTab
                posts={allPosts}
                currentUser={currentUser}
                selectedPost={selectedPost}
                onSelectPost={setSelectedPost}
                statusLabels={STATUS_LABELS}
              />
            )}
            {activeTab === 'review' && (
              <ApprovalReviewTab
                posts={allPosts}
                currentUser={currentUser}
                selectedPost={selectedPost}
                onSelectPost={setSelectedPost}
                statusLabels={STATUS_LABELS}
              />
            )}
            {activeTab === 'history' && (
              <ApprovalHistoryTab
                posts={allPosts}
                currentUser={currentUser}
                statusLabels={STATUS_LABELS}
              />
            )}
            {activeTab === 'metrics' && (
              <ApprovalMetricsTab
                posts={allPosts}
                currentUser={currentUser}
                statusLabels={STATUS_LABELS}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
