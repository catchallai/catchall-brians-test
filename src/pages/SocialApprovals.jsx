import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, XCircle, Clock, Eye, Send, RotateCcw, AlertTriangle,
  ThumbsUp, Loader2, ChevronLeft, ChevronRight, Bell, FileText,
  ShieldCheck, Megaphone, Filter, Search, CalendarDays, User,
  Paperclip, MessageSquare, Pen, Image, Video, AlertCircle, Timer
} from "lucide-react";
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';
import ApprovalQueueTab from '@/components/social/approvals/ApprovalQueueTab';
import ApprovalReviewTab from '@/components/social/approvals/ApprovalReviewTab';
import ApprovalHistoryTab from '@/components/social/approvals/ApprovalHistoryTab';
import ApprovalMetricsTab from '@/components/social/approvals/ApprovalMetricsTab';

const TABS = [
  { key: 'queue',   label: 'Approval Queue',  icon: Clock },
  { key: 'review',  label: 'In Review',        icon: Eye },
  { key: 'history', label: 'History',          icon: FileText },
  { key: 'metrics', label: 'Metrics',          icon: ShieldCheck },
];

const STATUS_LABELS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  pending_review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-700' },
  changes_requested: { label: 'Changes Needed', color: 'bg-orange-100 text-orange-700' },
  pending_approval: { label: 'Pending Approval', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  published: { label: 'Published', color: 'bg-violet-100 text-violet-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

export default function SocialApprovals() {
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['calendar-posts-all'],
    queryFn: () => base44.entities.CalendarPost.list('-updated_date', 200),
  });

  const pendingCount = allPosts.filter(p =>
    ['pending_review', 'pending_approval', 'changes_requested'].includes(p.status)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Social Media Approvals</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Review, approve, and track social content</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 pb-0 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedPost(null); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'queue' && pendingCount > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
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