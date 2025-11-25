import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Users, UserPlus, Target, CheckCircle, XCircle,
  MessageSquare, TrendingUp
} from "lucide-react";
import SocialLeadCard from '@/components/social/SocialLeadCard';
import SocialLeadModal from '@/components/modals/SocialLeadModal';
import ContactModal from '@/components/modals/ContactModal';
import ActivityModal from '@/components/modals/ActivityModal';
import EmptyState from '@/components/ui/EmptyState';

export default function SocialLeads() {
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
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

  const createLeadMutation = useMutation({
    mutationFn: (data) => editingLead 
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
          status: 'converted'
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

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowActivityModal(false);
    },
  });

  const handleConvertToContact = (lead) => {
    setConvertingLead(lead);
    setShowContactModal(true);
  };

  const getContact = (id) => contacts.find(c => c.id === id);
  const getCompany = (id) => companies.find(c => c.id === id);
  const getDeal = (id) => deals.find(d => d.id === id);

  const filteredLeads = socialLeads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.social_handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.interaction_content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || lead.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const stats = {
    total: socialLeads.length,
    new: socialLeads.filter(l => l.status === 'new').length,
    qualified: socialLeads.filter(l => l.status === 'qualified').length,
    converted: socialLeads.filter(l => l.status === 'converted').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Leads</h1>
          <p className="text-gray-500 mt-1">Capture and manage leads from social media interactions</p>
        </div>
        <Button onClick={() => { setEditingLead(null); setShowLeadModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            <p className="text-sm text-gray-500">New</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-violet-600">{stats.qualified}</p>
            <p className="text-sm text-gray-500">Qualified</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
            <p className="text-sm text-gray-500">Converted</p>
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
          onAction={() => { setEditingLead(null); setShowLeadModal(true); }}
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
              onClick={() => { setEditingLead(lead); setShowLeadModal(true); }}
            />
          ))}
        </div>
      )}

      {/* Social Lead Modal */}
      <SocialLeadModal
        open={showLeadModal}
        onClose={() => { setShowLeadModal(false); setEditingLead(null); }}
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
        onClose={() => { setShowContactModal(false); setConvertingLead(null); }}
        contact={convertingLead ? {
          first_name: convertingLead.social_handle,
          source: convertingLead.platform,
          notes: `Converted from social lead. Original interaction: ${convertingLead.interaction_content || 'N/A'}`
        } : null}
        companies={companies}
        onSave={(data) => createContactMutation.mutate(data)}
        isLoading={createContactMutation.isPending}
      />
    </div>
  );
}