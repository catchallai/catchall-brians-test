import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Users,
  Target,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Loader2,
} from 'lucide-react';
import SocialLeadCard from '@/components/social/SocialLeadCard';
import SocialLeadModal from '@/components/modals/SocialLeadModal';
import ContactModal from '@/components/modals/ContactModal';
import EmptyState from '@/components/ui/EmptyState';

export default function SocialLeads() {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: socialLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['social-leads'],
    queryFn: () => base44.entities.SocialLead.list('-created_date', 100),
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
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['listening-mentions'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 500),
  });

  const [isScanning, setIsScanning] = useState(false);

  const createLeadMutation = useMutation({
    mutationFn: (data) =>
      editingLead
        ? base44.entities.SocialLead.update(editingLead.id, data)
        : base44.entities.SocialLead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-leads'] });
      setShowLeadModal(false);
      setEditingLead(null);
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data) => {
      const contact = await base44.entities.Contact.create(data);
      // Update the lead to link to the new contact
      if (convertingLead) {
        await base44.entities.SocialLead.update(convertingLead.id, {
          contact_id: contact.id,
          status: 'converted',
        });
      }
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-leads'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowContactModal(false);
      setConvertingLead(null);
    },
  });

  // AI-powered lead scanning from social mentions
  const scanForLeadsMutation = useMutation({
    mutationFn: async () => {
      setIsScanning(true);

      // Get mentions not yet converted to leads
      const existingLeadMentionIds = socialLeads
        .filter((l) => l.mention_id)
        .map((l) => l.mention_id);

      const unprocessedMentions = mentions.filter(
        (m) =>
          !existingLeadMentionIds.includes(m.id) &&
          (m.sentiment === 'positive' ||
            m.is_influencer ||
            m.influence_score >= 50 ||
            m.author_followers >= 1000)
      );

      if (unprocessedMentions.length === 0) {
        return { newLeads: 0, message: 'No new potential leads found' };
      }

      // Analyze mentions for lead potential
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these social media mentions and identify potential sales leads.
        
For each mention, determine:
1. Lead score (0-100) based on buying intent, engagement level, and influence
2. Intent signals (e.g., "asking for pricing", "comparing solutions", "expressing pain point", "seeking recommendations")
3. Whether this is a qualified lead worth pursuing

Mentions to analyze:
${unprocessedMentions
  .slice(0, 20)
  .map(
    (m, i) => `
${i + 1}. Platform: ${m.platform}
   Author: @${m.author} (${m.author_followers || 0} followers)
   Content: "${m.content}"
   Sentiment: ${m.sentiment}
   Engagement: ${(m.likes || 0) + (m.comments || 0) + (m.shares || 0)} total
`
  )
  .join('\n')}

Return analysis for leads with score >= 40 only.`,
        response_json_schema: {
          type: 'object',
          properties: {
            leads: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  mention_index: { type: 'number' },
                  lead_score: { type: 'number' },
                  intent_signals: { type: 'array', items: { type: 'string' } },
                  interaction_type: { type: 'string' },
                  recommended_action: { type: 'string' },
                  qualification_reason: { type: 'string' },
                },
              },
            },
          },
        },
      });

      // Create leads for qualified mentions
      let createdCount = 0;
      for (const lead of analysis.leads || []) {
        const mention = unprocessedMentions[lead.mention_index - 1];
        if (mention && lead.lead_score >= 40) {
          await base44.entities.SocialLead.create({
            platform: mention.platform,
            social_handle: mention.author,
            profile_url: mention.author_url || '',
            interaction_type: lead.interaction_type || 'mention',
            interaction_content: mention.content,
            mention_id: mention.id,
            status: 'new',
            lead_score: lead.lead_score,
            intent_signals: lead.intent_signals,
            source: 'ai_scan',
            ai_analysis: {
              recommended_action: lead.recommended_action,
              qualification_reason: lead.qualification_reason,
              scanned_at: new Date().toISOString(),
            },
          });
          createdCount++;
        }
      }

      // Create notification
      if (createdCount > 0) {
        await base44.entities.Notification.create({
          type: 'social_mention',
          title: `${createdCount} new leads discovered`,
          message: `AI scan found ${createdCount} potential leads from social media mentions.`,
          priority: createdCount >= 5 ? 'high' : 'medium',
          link: 'SocialLeads',
        });
      }

      return { newLeads: createdCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-leads'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsScanning(false);
    },
    onError: () => setIsScanning(false),
  });

  const handleConvertToContact = (lead) => {
    setConvertingLead(lead);
    setShowContactModal(true);
  };

  const getContact = (id) => contacts.find((c) => c.id === id);
  const getCompany = (id) => companies.find((c) => c.id === id);
  const getDeal = (id) => deals.find((d) => d.id === id);

  const filteredLeads = socialLeads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      lead.social_handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.interaction_content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || lead.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const stats = {
    total: socialLeads.length,
    new: socialLeads.filter((l) => l.status === 'new').length,
    qualified: socialLeads.filter((l) => l.status === 'qualified').length,
    converted: socialLeads.filter((l) => l.status === 'converted').length,
    aiDiscovered: socialLeads.filter((l) => l.source === 'ai_scan').length,
  };

  // Get linked mention for a lead
  const getMention = (mentionId) => mentions.find((m) => m.id === mentionId);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social Leads</h1>
          <p className="text-gray-500 mt-1">
            Capture and manage leads from social media interactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => scanForLeadsMutation.mutate()}
            disabled={isScanning}
            className="gap-2"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isScanning ? 'Scanning...' : 'AI Scan for Leads'}
          </Button>
          <Button
            onClick={() => {
              setEditingLead(null);
              setShowLeadModal(true);
            }}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            <p className="text-sm text-gray-500">New</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-violet-600">{stats.qualified}</p>
            <p className="text-sm text-gray-500">Qualified</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
            <p className="text-sm text-gray-500">Converted</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{stats.aiDiscovered}</p>
            <p className="text-sm text-gray-500">AI Discovered</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      {loadingLeads ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No social leads"
          description="Capture leads from social media interactions to grow your pipeline."
          actionLabel="Add Lead"
          onAction={() => {
            setEditingLead(null);
            setShowLeadModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <SocialLeadCard
              key={lead.id}
              lead={lead}
              contact={getContact(lead.contact_id)}
              company={getCompany(lead.company_id)}
              deal={getDeal(lead.deal_id)}
              mention={getMention(lead.mention_id)}
              onClick={() => {
                setEditingLead(lead);
                setShowLeadModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Social Lead Modal */}
      <SocialLeadModal
        open={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        contacts={contacts}
        companies={companies}
        deals={deals}
        onSave={(data) => createLeadMutation.mutate(data)}
        onConvertToContact={handleConvertToContact}
        isLoading={createLeadMutation.isPending}
      />

      {/* Contact Modal for conversion */}
      <ContactModal
        open={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setConvertingLead(null);
        }}
        contact={
          convertingLead
            ? {
                first_name: convertingLead.social_handle,
                source: convertingLead.platform,
                notes: `Converted from social lead. Original interaction: ${convertingLead.interaction_content || 'N/A'}`,
              }
            : null
        }
        companies={companies}
        onSave={(data) => createContactMutation.mutate(data)}
        isLoading={createContactMutation.isPending}
      />
    </div>
  );
}
