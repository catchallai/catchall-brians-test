import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Rocket,
  Users,
  FileSignature,
  MapPin,
  Mail,
  Newspaper,
  UserCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Send
} from "lucide-react";

export default function BusinessDevDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: aerospaceCompanies = [], isLoading: loadingAerospace } = useQuery({
    queryKey: ['aerospace-companies', user?.current_business_id],
    queryFn: () => base44.entities.AerospaceCompany.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: competitors = [], isLoading: loadingCompetitors } = useQuery({
    queryKey: ['competitors', user?.current_business_id],
    queryFn: () => base44.entities.Competitor.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: legalDocs = [], isLoading: loadingLegal } = useQuery({
    queryKey: ['legal-documents', user?.current_business_id],
    queryFn: () => base44.entities.LegalDocument.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['listings', user?.current_business_id],
    queryFn: () => base44.entities.Listing.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: mediaOutreach = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['media-outreach', user?.current_business_id],
    queryFn: () => base44.entities.MediaOutreach.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: pressMentions = [], isLoading: loadingPress } = useQuery({
    queryKey: ['press-mentions', user?.current_business_id],
    queryFn: () => base44.entities.PressMention.filter({ business_id: user?.current_business_id }),
    enabled: !!user?.current_business_id,
  });

  const { data: visitors = [], isLoading: loadingVisitors } = useQuery({
    queryKey: ['visitor-sessions'],
    queryFn: () => base44.entities.VisitorSession.list('-created_date', 100),
  });

  const isLoading = loadingAerospace || loadingCompetitors || loadingLegal || 
                    loadingListings || loadingMedia || loadingPress || loadingVisitors;

  // Calculate stats
  const stats = {
    aerospace: {
      total: aerospaceCompanies.length,
      public: aerospaceCompanies.filter(c => c.company_type === 'public').length,
      private: aerospaceCompanies.filter(c => c.company_type === 'private').length,
    },
    competitors: {
      total: competitors.length,
      tier1: competitors.filter(c => c.tier === 'tier_1').length,
      analyzed: competitors.filter(c => c.last_analyzed).length,
    },
    legal: {
      total: legalDocs.length,
      sent: legalDocs.filter(d => d.status === 'sent').length,
      signed: legalDocs.filter(d => d.status === 'signed').length,
      pending: legalDocs.filter(d => ['sent', 'viewed'].includes(d.status)).length,
    },
    listings: {
      total: listings.length,
      verified: listings.filter(l => l.verification_status === 'verified').length,
      pending: listings.filter(l => l.verification_status === 'pending').length,
    },
    media: {
      total: mediaOutreach.length,
      sent: mediaOutreach.filter(m => m.status === 'sent').length,
      responded: mediaOutreach.filter(m => m.status === 'responded').length,
    },
    press: {
      total: pressMentions.length,
      positive: pressMentions.filter(p => p.sentiment === 'positive').length,
      recent: pressMentions.filter(p => {
        const date = new Date(p.published_date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return date > weekAgo;
      }).length,
    },
    visitors: {
      total: visitors.length,
      qualified: visitors.filter(v => v.lead_score >= 70).length,
      hot: visitors.filter(v => v.lead_score >= 85).length,
    }
  };

  const quickLinks = [
    { name: 'Aerospace Scanner', icon: Rocket, page: 'AerospaceScanner', count: stats.aerospace.total, color: 'violet' },
    { name: 'Competitor Analysis', icon: Users, page: 'CompetitorAnalysis', count: stats.competitors.total, color: 'blue' },
    { name: 'Legal Documents', icon: FileSignature, page: 'LegalDocuments', count: stats.legal.total, color: 'emerald' },
    { name: 'Lead Analysis', icon: UserCircle, page: 'VisitorProfiles', count: stats.visitors.qualified, color: 'amber' },
    { name: 'Listings & Reviews', icon: MapPin, page: 'Listings', count: stats.listings.total, color: 'cyan' },
    { name: 'Media Outreach', icon: Mail, page: 'MediaOutreach', count: stats.media.total, color: 'indigo' },
    { name: 'Press Monitoring', icon: Newspaper, page: 'PressMonitoring', count: stats.press.total, color: 'pink' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Business Dev</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of all business development activities and metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aerospace Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.aerospace.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.aerospace.public} public, {stats.aerospace.private} private</p>
              </div>
              <Rocket className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Competitors Tracked</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.competitors.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.competitors.tier1} tier 1 competitors</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Legal Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.legal.total}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.legal.signed} signed</p>
              </div>
              <FileSignature className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualified Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.visitors.qualified}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{stats.visitors.hot} hot leads</p>
              </div>
              <UserCircle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Documents Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            Legal Documents Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.legal.sent}</p>
                <p className="text-xs text-gray-500">Sent</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.legal.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.legal.signed}</p>
                <p className="text-xs text-gray-500">Signed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Eye className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.legal.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
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
                          <p className="text-sm text-gray-500">{link.count} items</p>
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

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-5 h-5" />
              Media Outreach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.media.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                <span className="font-semibold text-blue-600">{stats.media.sent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Responded</span>
                <span className="font-semibold text-green-600">{stats.media.responded}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="w-5 h-5" />
              Press Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Mentions</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.press.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
                <span className="font-semibold text-violet-600">{stats.press.recent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Positive Sentiment</span>
                <span className="font-semibold text-green-600">{stats.press.positive}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}