import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Share2, CalendarDays, Radio, UserCircle, Users, Target, ArrowRight
} from "lucide-react";

export default function SocialDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: socialAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['social-accounts', user?.current_business_id],
    queryFn: () => base44.entities.SocialAccount.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: scheduledPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: () => base44.entities.ScheduledPost.list('-scheduled_for', 200),
  });

  const { data: socialLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['social-leads'],
    queryFn: () => base44.entities.SocialLead.list('-created_date', 100),
  });

  const isLoading = loadingAccounts || loadingPosts || loadingLeads;

  const stats = {
    accounts: socialAccounts.length,
    scheduledPosts: scheduledPosts.filter(p => p.status === 'scheduled').length,
    leads: socialLeads.length,
    engagement: socialAccounts.reduce((sum, a) => sum + (a.engagement_rate || 0), 0),
  };

  const quickLinks = [
    { name: 'Social Analytics', icon: Share2, page: 'SocialMedia', color: 'violet' },
    { name: 'Social Calendar', icon: CalendarDays, page: 'SocialCalendar', count: stats.scheduledPosts, color: 'blue' },
    { name: 'Social Listening', icon: Radio, page: 'SocialListening', color: 'emerald' },
    { name: 'Social Leads', icon: UserCircle, page: 'SocialLeads', count: stats.leads, color: 'amber' },
    { name: 'Competitors', icon: Users, page: 'CompetitorAnalysis', color: 'cyan' },
    { name: 'Hashtag Manager', icon: Target, page: 'HashtagManager', color: 'pink' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Social</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Social media management overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Connected Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accounts}</p>
              </div>
              <Share2 className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scheduledPosts}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Social Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.leads}</p>
              </div>
              <UserCircle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Engagement</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.accounts > 0 ? (stats.engagement / stats.accounts).toFixed(1) : 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.page} to={createPageUrl(link.page)}>
                <Card className="glass-card hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-${link.color}-100 dark:bg-${link.color}-900/40 flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${link.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{link.name}</h3>
                          {link.count !== undefined && (
                            <p className="text-sm text-gray-500">{link.count} items</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}