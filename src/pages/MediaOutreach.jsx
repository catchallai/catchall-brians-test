import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Mail,
  Send,
  Search,
  Plus,
  Filter,
  Sparkles,
  Eye,
  Clock,
  CheckCircle,
  Download,
  Link2,
} from 'lucide-react';
import JournalistCard from '@/components/media/JournalistCard';
import OutreachCampaignCard from '@/components/media/OutreachCampaignCard';
import JournalistFinderModal from '@/components/media/JournalistFinderModal';
import ComposeOutreachModal from '@/components/media/ComposeOutreachModal';
import EmailAnalytics from '@/components/media/EmailAnalytics';

export default function MediaOutreach() {
  const [showFinderModal, setShowFinderModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedJournalist, setSelectedJournalist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: journalists = [], isLoading } = useQuery({
    queryKey: ['journalists'],
    queryFn: () => base44.entities.Journalist.list('-relevance_score', 200),
  });

  const { data: outreach = [] } = useQuery({
    queryKey: ['media-outreach'],
    queryFn: () => base44.entities.MediaOutreach.list('-created_date', 100),
  });

  const { data: pressMentions = [] } = useQuery({
    queryKey: ['press-mentions'],
    queryFn: () => base44.entities.PressMention.list('-publish_date', 100),
  });

  const totalSent = outreach.filter((o) => o.status !== 'draft').length;
  const opened = outreach.filter(
    (o) => o.status === 'opened' || o.status === 'replied' || o.status === 'published'
  ).length;
  const replied = outreach.filter((o) => o.status === 'replied' || o.status === 'published').length;
  const published = outreach.filter((o) => o.status === 'published').length;
  const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0;

  const scheduledFollowUps = outreach.filter(
    (o) => o.follow_up_date && new Date(o.follow_up_date) > new Date()
  ).length;

  const filteredJournalists = journalists.filter(
    (j) =>
      !searchQuery ||
      j.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.outlet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.beat?.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const linkedMentions = pressMentions.filter((m) =>
    outreach.some((o) => o.earned_mention_id === m.id)
  ).length;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media Outreach</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Connect with journalists and manage PR campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFinderModal(true)} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Find Journalists
          </Button>
          <Button
            onClick={() => setShowComposeModal(true)}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Mail className="w-4 h-4" />
            New Outreach
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{journalists.length}</p>
            <p className="text-sm text-gray-500">Journalists</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSent}</p>
            <p className="text-sm text-gray-500">Emails Sent</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{openRate}%</p>
            <p className="text-sm text-gray-500">Open Rate</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Mail className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{replyRate}%</p>
            <p className="text-sm text-gray-500">Reply Rate</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{published}</p>
            <p className="text-sm text-gray-500">Published</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Link2 className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-600">{linkedMentions}</p>
            <p className="text-sm text-gray-500">Linked Mentions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="database">
        <TabsList>
          <TabsTrigger value="database">Media Database</TabsTrigger>
          <TabsTrigger value="campaigns">Outreach Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Email Analytics</TabsTrigger>
          <TabsTrigger value="followups" className="gap-1">
            Follow-ups
            {scheduledFollowUps > 0 && (
              <Badge className="bg-amber-500 text-white text-xs ml-1">{scheduledFollowUps}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search journalists, outlets, or beats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Contacts
            </Button>
          </div>

          {filteredJournalists.length === 0 ? (
            <Card className="glass-card rounded-2xl">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No Journalists in Database
                </h3>
                <p className="text-gray-500 mb-4">
                  Use AI to find relevant journalists for your industry
                </p>
                <Button onClick={() => setShowFinderModal(true)} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Find Journalists
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJournalists.map((journalist) => (
                <JournalistCard
                  key={journalist.id}
                  journalist={journalist}
                  onContact={() => {
                    setSelectedJournalist(journalist);
                    setShowComposeModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <div className="space-y-3">
            {outreach.length === 0 ? (
              <Card className="glass-card rounded-2xl">
                <CardContent className="py-12 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Outreach Campaigns
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start reaching out to journalists and media outlets
                  </p>
                  <Button onClick={() => setShowComposeModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Outreach
                  </Button>
                </CardContent>
              </Card>
            ) : (
              outreach.map((campaign) => {
                const journalist = journalists.find((j) => j.id === campaign.journalist_id);
                const linkedMention = pressMentions.find(
                  (m) => m.id === campaign.earned_mention_id
                );
                return (
                  <OutreachCampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    journalist={journalist}
                    linkedMention={linkedMention}
                  />
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <EmailAnalytics outreach={outreach} />
        </TabsContent>

        <TabsContent value="followups" className="mt-4">
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle>Scheduled Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledFollowUps === 0 ? (
                <p className="text-center text-gray-500 py-8">No follow-ups scheduled</p>
              ) : (
                <div className="space-y-3">
                  {outreach
                    .filter((o) => o.follow_up_date && new Date(o.follow_up_date) > new Date())
                    .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date))
                    .map((campaign) => {
                      const journalist = journalists.find((j) => j.id === campaign.journalist_id);
                      return (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {journalist?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">{campaign.subject}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Clock className="w-4 h-4" />
                              {new Date(campaign.follow_up_date).toLocaleDateString()}
                            </div>
                            <Button size="sm">Send Now</Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <JournalistFinderModal open={showFinderModal} onClose={() => setShowFinderModal(false)} />

      <ComposeOutreachModal
        open={showComposeModal}
        onClose={() => {
          setShowComposeModal(false);
          setSelectedJournalist(null);
        }}
        journalist={selectedJournalist}
        journalists={journalists}
      />
    </div>
  );
}
