import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Target, BarChart3, Zap, Search, Layout, List as ListIcon } from 'lucide-react';
import DealModal from '@/components/modals/DealModal';
import DealDetailModal from '@/components/crm/DealDetailModal';
import PipelineModal from '@/components/modals/PipelineModal';
import EmptyState from '@/components/ui/EmptyState';
import SalesFunnel from '@/components/crm/SalesFunnel';
import StageDistribution from '@/components/crm/StageDistribution';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import DealKanbanBoard from '@/components/sales/DealKanbanBoard';
import DealForecasting from '@/components/sales/DealForecasting';
import DealAutomationRules from '@/components/sales/DealAutomationRules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DEFAULT_STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-50' },
  { id: 'proposal', label: 'Proposal', color: 'bg-violet-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-50' },
  { id: 'won', label: 'Won', color: 'bg-emerald-50' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50' },
];

const STAGE_COLORS = [
  'bg-gray-100',
  'bg-blue-50',
  'bg-violet-50',
  'bg-amber-50',
  'bg-emerald-50',
  'bg-pink-50',
  'bg-cyan-50',
  'bg-orange-50',
];

export default function Deals() {
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showDealDetail, setShowDealDetail] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');
  const [viewMode, setViewMode] = useState('kanban'); // kanban or list
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const queryClient = useQueryClient();

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

  const defaultPipeline = pipelines.find((p) => p.is_default) || pipelines[0];

  const { data: allDeals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  // Real-time subscription
  React.useEffect(() => {
    const unsubscribe = base44.entities.Deal.subscribe((_event) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const deals = allDeals;

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const contacts = allContacts;

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const companies = allCompanies;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setShowDealModal(false);
      setEditingDeal(null);
      toast.success('Deal created successfully');
    },
    onError: () => toast.error('Failed to create deal'),
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const oldDeal = deals.find((d) => d.id === id);
      const result = await base44.entities.Deal.update(id, data);

      // Create notification if stage changed
      if (oldDeal && oldDeal.stage !== data.stage) {
        try {
          await base44.functions.invoke('createNotification', {
            user_email: user?.email,
            type: 'deal_update',
            title: `Deal status changed: ${data.title}`,
            body: `Moved from ${oldDeal.stage} to ${data.stage}`,
            related_entity_type: 'Deal',
            related_entity_id: id,
            actor_email: user?.email,
            actor_name: user?.full_name,
            action_url: `/deals?id=${id}`,
          });
        } catch (_err) {
          console.log('Notification creation skipped');
        }
      }

      return result;
    },
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
        is_default: pipelines.length === 0,
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

  const getContact = (contactId) => contacts.find((c) => c.id === contactId);

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      !searchTerm ||
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getContact(deal.contact_id)?.first_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = filterStage === 'all' || deal.stage === filterStage;
    return matchesSearch && matchesStage;
  });

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Sales Pipeline
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage active deals through your sales process
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDealModal(true)}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              Add Deal
            </Button>
            <Button onClick={() => setShowPipelineModal(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Customize
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {(defaultPipeline?.stages || DEFAULT_STAGES).map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('kanban')}
            >
              <Layout className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {deals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No deals yet"
          description="Create your first deal to start managing your pipeline."
        />
      ) : viewMode === 'list' ? (
        // List View
        <Card className="glass-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => {
                const contact = getContact(deal.contact_id);
                const stage = (defaultPipeline?.stages || DEFAULT_STAGES).find(
                  (s) => s.id === deal.stage
                );
                return (
                  <TableRow
                    key={deal.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      {contact?.first_name} {contact?.last_name}
                    </TableCell>
                    <TableCell>{stage?.label || deal.stage}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(deal.value)}</TableCell>
                    <TableCell>{deal.probability || 0}%</TableCell>
                    <TableCell>
                      {deal.expected_close_date
                        ? new Date(deal.expected_close_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewDeal(deal)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        // Kanban View
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="kanban" className="gap-2">
              <Target className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Zap className="w-4 h-4" />
              Automation
            </TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-6">
            {/* Funnel & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <SalesFunnel deals={filteredDeals} />
              <StageDistribution deals={filteredDeals} />
            </div>

            {/* Kanban Board */}
            <DealKanbanBoard
              deals={filteredDeals}
              stages={defaultPipeline?.stages || DEFAULT_STAGES}
              stageColors={STAGE_COLORS}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onViewDeal={handleViewDeal}
              onEditDeal={handleEditDeal}
              getContact={getContact}
            />
          </TabsContent>

          {/* Forecast View */}
          <TabsContent value="forecast" className="mt-6">
            <DealForecasting deals={filteredDeals} />
          </TabsContent>

          {/* Automation View */}
          <TabsContent value="automation" className="mt-6">
            <DealAutomationRules businessId={user?.current_business_id} />
          </TabsContent>
        </Tabs>
      )}

      {/* Deal Modal */}
      <DealModal
        open={showDealModal}
        onClose={() => {
          setShowDealModal(false);
          setEditingDeal(null);
        }}
        deal={editingDeal}
        contacts={contacts}
        companies={companies}
        onSave={handleSaveDeal}
        isLoading={createDealMutation.isPending || updateDealMutation.isPending}
      />

      {/* Deal Detail Modal */}
      <DealDetailModal
        open={showDealDetail}
        onClose={() => {
          setShowDealDetail(false);
          setSelectedDealId(null);
        }}
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
