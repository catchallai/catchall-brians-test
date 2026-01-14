import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Grid3x3, List, Filter, Upload, Download, Search, X } from "lucide-react";
import OpportunityCard from '@/components/crm/OpportunityCard';
import OpportunityModal from '@/components/modals/OpportunityModal';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/components/hooks/useDebounce';
import { useToast } from '@/components/ui/toast-provider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImportDialog from '@/components/ui/ImportDialog';

export default function Opportunities() {
  const [showModal, setShowModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Opportunity.filter({ business_id: user.current_business_id }, '-created_date', 1000);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id }, '-created_date', 1000);
    },
    enabled: !!user?.current_business_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.create({
      ...data,
      business_id: user?.current_business_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowModal(false);
      toast.success('Opportunity created successfully');
    },
    onError: () => toast.error('Failed to create opportunity'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowModal(false);
      setEditingOpportunity(null);
      toast.success('Opportunity updated successfully');
    },
    onError: () => toast.error('Failed to update opportunity'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Opportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setDeleteConfirm(null);
      toast.success('Opportunity deleted successfully');
    },
    onError: () => toast.error('Failed to delete opportunity'),
  });

  const importMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('importOpportunities', { data });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success(`Imported ${result.imported} opportunities${result.errors > 0 ? ` (${result.errors} errors)` : ''}`);
      setShowImport(false);
    },
    onError: () => toast.error('Failed to import opportunities'),
  });

  const handleSave = (data) => {
    if (editingOpportunity) {
      updateMutation.mutate({ id: editingOpportunity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (opportunity) => {
    setEditingOpportunity(opportunity);
    setShowModal(true);
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      const matchesSearch = !debouncedSearch || 
        opp.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        opp.contact_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        opp.contact_email?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStage = stageFilter === 'all' || opp.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [opportunities, debouncedSearch, stageFilter]);

  const opportunitiesByStage = useMemo(() => {
    const grouped = {
      new_lead: [],
      email_list: [],
      media_inquiry: [],
      reservation_request: [],
      no_response: [],
      contacted: [],
      closed: [],
      not_interested: [],
    };
    filteredOpportunities.forEach(opp => {
      if (grouped[opp.stage]) {
        grouped[opp.stage].push(opp);
      }
    });
    return grouped;
  }, [filteredOpportunities]);

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Opportunities</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {filteredOpportunities.length} opportunities • ${totalValue.toFixed(2)} total value
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 text-sm" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2 text-sm" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => { setEditingOpportunity(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4" />
            Add opportunity
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search Opportunities"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="new_lead">New Lead</SelectItem>
                <SelectItem value="email_list">Email List</SelectItem>
                <SelectItem value="media_inquiry">Media Inquiry</SelectItem>
                <SelectItem value="reservation_request">Reservation Request</SelectItem>
                <SelectItem value="no_response">No Response</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No opportunities yet"
              description="Start tracking opportunities by creating your first one."
              actionLabel="Add Opportunity"
              onAction={() => { setEditingOpportunity(null); setShowModal(true); }}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onEdit={() => handleEdit(opportunity)}
                  onDelete={() => setDeleteConfirm(opportunity)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(opportunitiesByStage).map(([stage, opps]) => (
                opps.length > 0 && (
                  <div key={stage}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 capitalize">
                      {stage.replace('_', ' ')} ({opps.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {opps.map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          onEdit={() => handleEdit(opportunity)}
                          onDelete={() => setDeleteConfirm(opportunity)}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipelines">
          <EmptyState
            icon={Grid3x3}
            title="Pipeline view coming soon"
            description="Manage your opportunity pipelines and stages."
          />
        </TabsContent>

        <TabsContent value="bulk">
          <EmptyState
            icon={Grid3x3}
            title="Bulk actions coming soon"
            description="Perform bulk operations on multiple opportunities."
          />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <OpportunityModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingOpportunity(null); }}
        opportunity={editingOpportunity}
        contacts={contacts}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={(data) => importMutation.mutateAsync(data)}
        entityName="Opportunities"
        requiredFields={['Opportunity Name', 'email']}
        optionalFields={['Contact Name', 'phone', 'stage', 'Lead Value', 'source', 'Notes', 'tags']}
        sampleData={[
          { 'Opportunity Name': 'New Lead', 'Contact Name': 'John Doe', email: 'john@example.com', phone: '555-1234', stage: '🚨New Lead', 'Lead Value': '1000', source: 'Website', Notes: 'Interested in product', tags: 'hot,qualified' },
        ]}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        title="Delete Opportunity"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}