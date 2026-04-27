import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Megaphone } from 'lucide-react';
import CampaignCard from '@/components/campaigns/CampaignCard';
import CampaignModal from '@/components/modals/CampaignModal';
import EmptyState from '@/components/ui/EmptyState';

export default function Campaigns() {
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 200),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowModal(false);
      setEditingCampaign(null);
    },
  });

  const handleSave = (data) => {
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setShowModal(true);
  };

  const getCampaignMetrics = (campaign) => {
    const linkedContacts = contacts.filter((c) => campaign.contact_ids?.includes(c.id));
    const linkedDeals = deals.filter((d) => campaign.deal_ids?.includes(d.id));
    const wonDeals = linkedDeals.filter((d) => d.stage === 'won');
    const revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    return {
      leadsCount: linkedContacts.length,
      dealsCount: linkedDeals.length,
      revenue,
    };
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      !searchTerm || campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-500 mt-1">
            {campaigns.length} campaigns • {activeCampaigns} active • ${totalSpent.toLocaleString()}{' '}
            spent
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCampaign(null);
            setShowModal(true);
          }}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="ppc">PPC / Ads</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="seo">SEO</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create marketing campaigns to track performance and link them to contacts, deals, and SEO efforts."
          actionLabel="Create Campaign"
          onAction={() => {
            setEditingCampaign(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => {
            const metrics = getCampaignMetrics(campaign);
            return (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                leadsCount={metrics.leadsCount}
                dealsCount={metrics.dealsCount}
                revenue={metrics.revenue}
                onClick={() => handleEdit(campaign)}
              />
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CampaignModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCampaign(null);
        }}
        campaign={editingCampaign}
        contacts={contacts}
        deals={deals}
        keywords={keywords}
        backlinks={backlinks}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
