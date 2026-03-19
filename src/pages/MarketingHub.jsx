import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Users,
  Mail,
  Target,
  Link2,
  FlaskConical,
  UserPlus,
  FileText,
  Bell,
  RefreshCw,
  Plus,
  BarChart3,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import LeadScoringPanel from '@/components/marketing/LeadScoringPanel';
import UTMTrackingPanel from '@/components/marketing/UTMTrackingPanel';
import ABTestingPanel from '@/components/marketing/ABTestingPanel';
import ReferralPanel from '@/components/marketing/ReferralPanel';
import ContentPerformancePanel from '@/components/marketing/ContentPerformancePanel';
import CompetitorAlertsPanel from '@/components/marketing/CompetitorAlertsPanel';
import ReEngagementPanel from '@/components/marketing/ReEngagementPanel';
import MarketingROIPanel from '@/components/marketing/MarketingROIPanel';

export default function MarketingHub() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter(
        { business_id: user.current_business_id },
        '-created_date',
        500
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Deal.filter(
        { business_id: user.current_business_id },
        '-created_date',
        200
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: leadScores = [] } = useQuery({
    queryKey: ['lead-scores'],
    queryFn: () => base44.entities.LeadScore.list('-total_score', 100),
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 100),
  });

  const { data: utmData = [] } = useQuery({
    queryKey: ['utm-tracking'],
    queryFn: () => base44.entities.UTMTracking.list('-created_date', 200),
  });

  // Calculate metrics
  const hotLeads = leadScores.filter((l) => l.grade === 'A' || l.grade === 'B').length;
  const convertedReferrals = referrals.filter((r) => r.status === 'converted').length;

  const pipelineValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Hub</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Automation, analytics, and optimization tools
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{hotLeads}</p>
                <p className="text-xs text-gray-500">Hot Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {convertedReferrals}
                </p>
                <p className="text-xs text-gray-500">Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(pipelineValue / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500">Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(wonValue / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-gray-500">Won Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="lead-scoring">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="lead-scoring" className="gap-1">
            <Target className="w-4 h-4" />
            Lead Scoring
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="gap-1">
            <FlaskConical className="w-4 h-4" />
            A/B Testing
          </TabsTrigger>
          <TabsTrigger value="utm-tracking" className="gap-1">
            <Link2 className="w-4 h-4" />
            UTM & Attribution
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-1">
            <UserPlus className="w-4 h-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="content-performance" className="gap-1">
            <FileText className="w-4 h-4" />
            Content Performance
          </TabsTrigger>
          <TabsTrigger value="competitor-alerts" className="gap-1">
            <Bell className="w-4 h-4" />
            Competitor Alerts
          </TabsTrigger>
          <TabsTrigger value="re-engagement" className="gap-1">
            <RefreshCw className="w-4 h-4" />
            Re-engagement
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-1">
            <BarChart3 className="w-4 h-4" />
            ROI Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lead-scoring" className="mt-6">
          <LeadScoringPanel contacts={contacts} leadScores={leadScores} deals={deals} />
        </TabsContent>

        <TabsContent value="ab-testing" className="mt-6">
          <ABTestingPanel />
        </TabsContent>

        <TabsContent value="utm-tracking" className="mt-6">
          <UTMTrackingPanel utmData={utmData} contacts={contacts} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralPanel referrals={referrals} contacts={contacts} />
        </TabsContent>

        <TabsContent value="content-performance" className="mt-6">
          <ContentPerformancePanel />
        </TabsContent>

        <TabsContent value="competitor-alerts" className="mt-6">
          <CompetitorAlertsPanel />
        </TabsContent>

        <TabsContent value="re-engagement" className="mt-6">
          <ReEngagementPanel contacts={contacts} deals={deals} />
        </TabsContent>

        <TabsContent value="roi" className="mt-6">
          <MarketingROIPanel deals={deals} contacts={contacts} utmData={utmData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
