import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Users, Target, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import CampaignModal from '@/components/modals/CampaignModal';
import ContactCard from '@/components/crm/ContactCard';
import KeywordRankCard from '@/components/seo/KeywordRankCard';
import BacklinkItem from '@/components/seo/BacklinkItem';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
};

const typeLabels = {
  email: '📧 Email',
  social_media: '📱 Social Media',
  ppc: '💰 PPC / Ads',
  content: '📝 Content',
  seo: '🔍 SEO',
  event: '🎪 Event',
  referral: '🤝 Referral',
  other: '📌 Other',
};

export default function CampaignDetail() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('id');

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 200),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 500),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 500),
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowModal(false);
    },
  });

  const campaign = campaigns.find((c) => c.id === campaignId);

  if (!campaign) {
    return (
      <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="text-center py-16">
          <p className="text-gray-500">Campaign not found</p>
          <Link to={createPageUrl('Campaigns')}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const linkedContacts = contacts.filter((c) => campaign.contact_ids?.includes(c.id));
  const linkedDeals = deals.filter((d) => campaign.deal_ids?.includes(d.id));
  const linkedKeywords = keywords.filter((k) => campaign.keyword_ids?.includes(k.id));
  const linkedBacklinks = backlinks.filter((b) => campaign.backlink_ids?.includes(b.id));

  const wonDeals = linkedDeals.filter((d) => d.stage === 'won');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const pipelineValue = linkedDeals
    .filter((d) => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const budgetProgress = campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0;
  const leadsProgress =
    campaign.target_leads > 0 ? (linkedContacts.length / campaign.target_leads) * 100 : 0;
  const revenueProgress =
    campaign.target_revenue > 0 ? (totalRevenue / campaign.target_revenue) * 100 : 0;

  const formatCurrency = (value) => {
    if (!value) {
      return '$0';
    }
    return `$${value.toLocaleString()}`;
  };

  const getCompany = (companyId) => companies.find((c) => c.id === companyId);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            to={createPageUrl('Campaigns')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeLabels[campaign.type]?.split(' ')[0]}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                {campaign.start_date && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(campaign.start_date), 'MMM d')}
                    {campaign.end_date &&
                      ` - ${format(new Date(campaign.end_date), 'MMM d, yyyy')}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Campaign
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{linkedContacts.length}</p>
            <p className="text-sm text-gray-500">Leads Generated</p>
            {campaign.target_leads > 0 && (
              <Progress value={Math.min(leadsProgress, 100)} className="h-1 mt-2" />
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{linkedDeals.length}</p>
            <p className="text-sm text-gray-500">Deals ({wonDeals.length} won)</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-gray-500">Revenue Closed</p>
            {campaign.target_revenue > 0 && (
              <Progress value={Math.min(revenueProgress, 100)} className="h-1 mt-2" />
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(pipelineValue)}</p>
            <p className="text-sm text-gray-500">In Pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Card */}
      {campaign.budget > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Budget Utilization</h3>
              <span className="text-sm text-gray-500">
                {formatCurrency(campaign.spent || 0)} / {formatCurrency(campaign.budget)}
              </span>
            </div>
            <Progress value={budgetProgress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-500">{budgetProgress.toFixed(0)}% used</span>
              <span className="text-gray-500">
                {formatCurrency(campaign.budget - (campaign.spent || 0))} remaining
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for linked items */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts ({linkedContacts.length})</TabsTrigger>
          <TabsTrigger value="deals">Deals ({linkedDeals.length})</TabsTrigger>
          <TabsTrigger value="keywords">Keywords ({linkedKeywords.length})</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks ({linkedBacklinks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          {linkedContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  company={getCompany(contact.company_id)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-500">
                No contacts linked to this campaign
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deals">
          {linkedDeals.length > 0 ? (
            <div className="space-y-3">
              {linkedDeals.map((deal) => (
                <Card key={deal.id} className="border-0 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                      <Badge
                        className={`mt-1 text-xs ${
                          deal.stage === 'won'
                            ? 'bg-emerald-100 text-emerald-700'
                            : deal.stage === 'lost'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {deal.stage}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-500">
                No deals linked to this campaign
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keywords">
          {linkedKeywords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedKeywords.map((keyword) => (
                <KeywordRankCard key={keyword.id} keyword={keyword} />
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-500">
                No keywords linked to this campaign
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backlinks">
          {linkedBacklinks.length > 0 ? (
            <div className="space-y-3">
              {linkedBacklinks.map((backlink) => (
                <BacklinkItem key={backlink.id} backlink={backlink} />
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-500">
                No backlinks linked to this campaign
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <CampaignModal
        open={showModal}
        onClose={() => setShowModal(false)}
        campaign={campaign}
        contacts={contacts}
        deals={deals}
        keywords={keywords}
        backlinks={backlinks}
        onSave={(data) => updateMutation.mutate({ id: campaign.id, data })}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
