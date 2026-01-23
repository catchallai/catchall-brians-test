import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target } from "lucide-react";
import DealCard from '@/components/crm/DealCard';
import DealModal from '@/components/modals/DealModal';
import DealDetailModal from '@/components/crm/DealDetailModal';
import PipelineModal from '@/components/modals/PipelineModal';
import EmptyState from '@/components/ui/EmptyState';
import SalesFunnel from '@/components/crm/SalesFunnel';
import StageDistribution from '@/components/crm/StageDistribution';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/toast-provider';

const DEFAULT_STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-50' },
  { id: 'proposal', label: 'Proposal', color: 'bg-violet-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-50' },
  { id: 'won', label: 'Won', color: 'bg-emerald-50' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50' },
];

const STAGE_COLORS = [
  'bg-gray-100', 'bg-blue-50', 'bg-violet-50', 'bg-amber-50', 
  'bg-emerald-50', 'bg-pink-50', 'bg-cyan-50', 'bg-orange-50'
];

export default function Deals() {
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showDealDetail, setShowDealDetail] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      return await base44.entities.Pipeline.list();
    },
    enabled: !!user,
  });

  const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];

  const { data: allDeals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Deal.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const deals = allDeals;

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id }, '-created_date', 500);
    },
    enabled: !!user?.current_business_id,
  });

  const contacts = allContacts;

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Company.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const companies = allCompanies;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create({
      ...data,
      business_id: user?.current_business_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setShowDealModal(false);
      setEditingDeal(null);
      toast.success('Deal created successfully');
    },
    onError: () => toast.error('Failed to create deal'),
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setShowDealModal(false);
      setEditingDeal(null);
      toast.success('Deal updated successfully');
    },
    onError: () => toast.error('Failed to update deal'),
  });

  const deleteDealMutation = useMutation({
    mutationFn: (id) => base44.entities.Deal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
    },
    onError: () => toast.error('Failed to delete deal'),
  });

  const createPipelineMutation = useMutation({
    mutationFn: async (data) => {
      const pipeline = await base44.entities.Pipeline.create({
        ...data,
        is_default: pipelines.length === 0
      });
      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setShowPipelineModal(false);
    },
  });

  const handleSaveDeal = (data) => {
    if (editingDeal) {
      updateDealMutation.mutate({ id: editingDeal.id, data });
    } else {
      createDealMutation.mutate(data);
    }
  };

  const handleViewDeal = (deal) => {
    setSelectedDealId(deal.id);
    setShowDealDetail(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setShowDealModal(true);
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stage !== stage) {
      updateMutation.mutate({ id: draggedDeal.id, data: { ...draggedDeal, stage } });
    }
    setDraggedDeal(null);
  };

  const getContact = (contactId) => contacts.find(c => c.id === contactId);

  const getDealsForStage = (stageId) => deals.filter(d => d.stage === stageId);

  const getStageValue = (stageId) => {
    return getDealsForStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  if (loadingDeals) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="min-w-[280px] h-[500px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Sales Pipeline</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage active deals through your sales process • Drag to update stage</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDealModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4" />
            Add Deal
          </Button>
          <Button onClick={() => setShowPipelineModal(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Customize Pipeline
          </Button>
        </div>
      </div>

      {/* Funnel & Distribution */}
      {deals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesFunnel deals={deals} />
          <StageDistribution deals={deals} />
        </div>
      )}

      {/* Pipeline */}
      {deals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No pipelines yet"
          description="Create a pipeline to start managing deals."
        />
      ) : (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(defaultPipeline?.stages || DEFAULT_STAGES).map((stage, index) => {
            const stageId = stage.id;
            const stageName = stage.name || stage.label;
            const stageColor = stage.color || STAGE_COLORS[index % STAGE_COLORS.length];
            return (
            <div
              key={stageId}
              className={`min-w-[260px] sm:min-w-[300px] max-w-[260px] sm:max-w-[300px] rounded-xl ${stageColor} p-3 sm:p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stageId)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{stageName}</h3>
                  <p className="text-sm text-gray-500">
                    {getDealsForStage(stageId).length} deals • {formatCurrency(getStageValue(stageId))}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {getDealsForStage(stageId).map((deal) => (
                  <div key={deal.id} onClick={() => handleViewDeal(deal)}>
                    <DealCard
                      deal={deal}
                      contact={getContact(deal.contact_id)}
                      onDragStart={handleDragStart}
                      onDragEnd={() => setDraggedDeal(null)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Deal Modal */}
      <DealModal
        open={showDealModal}
        onClose={() => { setShowDealModal(false); setEditingDeal(null); }}
        deal={editingDeal}
        contacts={contacts}
        companies={companies}
        onSave={handleSaveDeal}
        isLoading={createDealMutation.isPending || updateDealMutation.isPending}
      />

      {/* Deal Detail Modal */}
      <DealDetailModal
        open={showDealDetail}
        onClose={() => { setShowDealDetail(false); setSelectedDealId(null); }}
        dealId={selectedDealId}
        onEdit={(deal) => {
          setShowDealDetail(false);
          handleEditDeal(deal);
        }}
        onDelete={(deal) => {
          setShowDealDetail(false);
          setDeleteConfirm(deal);
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteDealMutation.mutate(deleteConfirm.id)}
        title="Delete Deal"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        confirmLabel="Delete"
        isLoading={deleteDealMutation.isPending}
      />

      {/* Pipeline Modal */}
      <PipelineModal
        open={showPipelineModal}
        onClose={() => setShowPipelineModal(false)}
        onSave={(data) => createPipelineMutation.mutate(data)}
        isLoading={createPipelineMutation.isPending}
      />
    </div>
  );
}