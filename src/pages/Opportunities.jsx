import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Grid3x3,
  List,
  Filter,
  Upload,
  Search,
  DollarSign,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import OpportunityCard from '@/components/crm/OpportunityCard';
import OpportunityModal from '@/components/modals/OpportunityModal';
import PipelineKanban from '@/components/crm/PipelineKanban';
import BulkActionsPanel from '@/components/crm/BulkActionsPanel';
import ExportDataMenu from '@/components/crm/ExportDataMenu';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/components/hooks/useDebounce';
import { toast } from 'sonner';
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

  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 1000),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.create(data),
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
      toast.success(
        `Imported ${result.imported} opportunities${result.errors > 0 ? ` (${result.errors} errors)` : ''}`
      );
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
    return opportunities.filter((opp) => {
      const matchesSearch =
        !debouncedSearch ||
        opp.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        opp.contact_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        opp.contact_email?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStage = stageFilter === 'all' || opp.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [opportunities, debouncedSearch, stageFilter]);

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  const renderOpportunitiesTable = (data) => (
    <Card className="glass-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Opportunity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Stage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Source
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((opportunity) => {
              const stageLabels = {
                new_lead: 'New Lead',
                email_list: 'Email List',
                media_inquiry: 'Media Inquiry',
                reservation_request: 'Reservation Request',
                no_response: 'No Response',
                contacted: 'Contacted',
                closed: 'Closed',
                not_interested: 'Not Interested',
              };

              const stageColors = {
                new_lead: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                email_list:
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                media_inquiry: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                reservation_request:
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                no_response: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
                contacted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
                closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                not_interested:
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
              };

              return (
                <tr
                  key={opportunity.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {opportunity.title}
                      </p>
                      {opportunity.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                          {opportunity.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {opportunity.contact_name || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {opportunity.contact_email ? (
                      <a
                        href={`mailto:${opportunity.contact_email}`}
                        className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        {opportunity.contact_email}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {opportunity.contact_phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {opportunity.contact_phone}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`${stageColors[opportunity.stage] || 'bg-gray-100 text-gray-700'} text-xs`}
                    >
                      {stageLabels[opportunity.stage] || opportunity.stage}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {opportunity.value ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {opportunity.value.toFixed(2)}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {opportunity.source || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(opportunity)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(opportunity)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Opportunities
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Track leads from various sources • {filteredOpportunities.length} opportunities • $
            {totalValue.toFixed(2)} total value
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 text-sm"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <ExportDataMenu
            data={filteredOpportunities}
            entityName="Opportunities"
            fields={[
              { key: 'title', label: 'Opportunity Name' },
              { key: 'contact_name', label: 'Contact Name' },
              { key: 'contact_email', label: 'Email' },
              { key: 'contact_phone', label: 'Phone' },
              { key: 'stage', label: 'Stage' },
              { key: 'value', label: 'Value' },
              { key: 'source', label: 'Source' },
              { key: 'notes', label: 'Notes' },
            ]}
          />
          <Button
            onClick={() => {
              setEditingOpportunity(null);
              setShowModal(true);
            }}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add opportunity
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="open" className="space-y-6">
        <TabsList>
          <TabsTrigger value="open">Open Opportunities</TabsTrigger>
          <TabsTrigger value="needs_follow_up">Needs Follow Up</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
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
              variant={showFilters ? 'default' : 'outline'}
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
          ) : filteredOpportunities.filter((o) => !['closed', 'not_interested'].includes(o.stage))
              .length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No open opportunities"
              description="All opportunities are either closed or not interested."
              actionLabel="Add Opportunity"
              onAction={() => {
                setEditingOpportunity(null);
                setShowModal(true);
              }}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOpportunities
                .filter((o) => !['closed', 'not_interested'].includes(o.stage))
                .map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onEdit={() => handleEdit(opportunity)}
                    onDelete={() => setDeleteConfirm(opportunity)}
                  />
                ))}
            </div>
          ) : (
            renderOpportunitiesTable(
              filteredOpportunities.filter((o) => !['closed', 'not_interested'].includes(o.stage))
            )
          )}
        </TabsContent>

        <TabsContent value="needs_follow_up" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search opportunities needing follow up"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filteredOpportunities.filter((o) =>
              ['no_response', 'new_lead', 'email_list', 'media_inquiry'].includes(o.stage)
            ).length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No opportunities need follow up"
              description="Opportunities requiring follow up will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOpportunities
                .filter((o) =>
                  ['no_response', 'new_lead', 'email_list', 'media_inquiry'].includes(o.stage)
                )
                .map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onEdit={() => handleEdit(opportunity)}
                    onDelete={() => setDeleteConfirm(opportunity)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search in progress opportunities"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : filteredOpportunities.filter((o) =>
              ['contacted', 'reservation_request'].includes(o.stage)
            ).length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No opportunities in progress"
              description="Opportunities that are being actively worked on will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOpportunities
                .filter((o) => ['contacted', 'reservation_request'].includes(o.stage))
                .map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onEdit={() => handleEdit(opportunity)}
                    onDelete={() => setDeleteConfirm(opportunity)}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
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

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-xl" />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <EmptyState
              icon={Grid3x3}
              title="No opportunities yet"
              description="Start tracking opportunities by creating your first one."
              actionLabel="Add Opportunity"
              onAction={() => {
                setEditingOpportunity(null);
                setShowModal(true);
              }}
            />
          ) : viewMode === 'grid' ? (
            <PipelineKanban
              opportunities={opportunities}
              onEdit={handleEdit}
              onDelete={(opp) => setDeleteConfirm(opp)}
            />
          ) : (
            renderOpportunitiesTable(opportunities)
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkActionsPanel
            opportunities={opportunities}
            onDelete={(id) => deleteMutation.mutate(id)}
            onUpdateStage={(id, stage) => updateMutation.mutate({ id, data: { stage } })}
            isLoading={deleteMutation.isPending || updateMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <OpportunityModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingOpportunity(null);
        }}
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
          {
            'Opportunity Name': 'New Lead',
            'Contact Name': 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
            stage: '🚨New Lead',
            'Lead Value': '1000',
            source: 'Website',
            Notes: 'Interested in product',
            tags: 'hot,qualified',
          },
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
