import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target } from "lucide-react";
import DealCard from '@/components/crm/DealCard';
import DealModal from '@/components/modals/DealModal';
import EmptyState from '@/components/ui/EmptyState';

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-50' },
  { id: 'proposal', label: 'Proposal', color: 'bg-violet-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-50' },
  { id: 'won', label: 'Won', color: 'bg-emerald-50' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50' },
];

export default function Deals() {
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setShowModal(false);
      setEditingDeal(null);
    },
  });

  const handleSave = (data) => {
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setShowModal(true);
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
      <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
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
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="text-gray-500 mt-1">Drag and drop deals to update their stage</p>
        </div>
        <Button onClick={() => { setEditingDeal(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Add Deal
        </Button>
      </div>

      {/* Pipeline */}
      {deals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No deals yet"
          description="Start tracking your sales pipeline by adding your first deal."
          actionLabel="Add Deal"
          onAction={() => { setEditingDeal(null); setShowModal(true); }}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className={`min-w-[300px] max-w-[300px] rounded-xl ${stage.color} p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                  <p className="text-sm text-gray-500">
                    {getDealsForStage(stage.id).length} deals • {formatCurrency(getStageValue(stage.id))}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {getDealsForStage(stage.id).map((deal) => (
                  <div key={deal.id} onClick={() => handleEdit(deal)}>
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
          ))}
        </div>
      )}

      {/* Modal */}
      <DealModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingDeal(null); }}
        deal={editingDeal}
        contacts={contacts}
        companies={companies}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}