import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target } from "lucide-react";
import DealCard from '@/components/crm/DealCard';
import PipelineModal from '@/components/modals/PipelineModal';
import EmptyState from '@/components/ui/EmptyState';
import SalesFunnel from '@/components/crm/SalesFunnel';
import StageDistribution from '@/components/crm/StageDistribution';

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
  const [draggedDeal, setDraggedDeal] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Pipeline.filter({ business_id: user.current_business_id });
    },
    enabled: !!user?.current_business_id,
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

  const createPipelineMutation = useMutation({
    mutationFn: async (data) => {
      const pipeline = await base44.entities.Pipeline.create({
        ...data,
        business_id: user?.current_business_id,
        is_default: pipelines.length === 0
      });
      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setShowPipelineModal(false);
    },
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Pipeline</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Drag and drop deals to update their stage</p>
        </div>
        <Button onClick={() => setShowPipelineModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Create Pipeline
        </Button>
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
          title="No deals yet"
          description="Deals will appear here when they are created."
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
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    contact={getContact(deal.contact_id)}
                    onDragStart={handleDragStart}
                    onDragEnd={() => setDraggedDeal(null)}
                  />
                ))}
              </div>
            </div>
          );
          })}
        </div>
      )}

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