import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Check, X, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ProposalModal from '@/components/modals/ProposalModal';
import ProposalTemplateLibrary from '@/components/sales/ProposalTemplateLibrary';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Clock },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: Eye },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: Check },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: X },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700', icon: Clock },
};

export default function Proposals() {
  const [showModal, setShowModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const queryClient = useQueryClient();

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      data.id
        ? base44.entities.Proposal.update(data.id, data)
        : base44.entities.Proposal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setShowModal(false);
      setEditingProposal(null);
    },
  });

  const getContactName = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
      value || 0
    );
  };

  const handleTemplateSelect = (template) => {
    setEditingProposal({
      ...template,
      content: template.content,
    });
    setShowModal(true);
    setShowTemplates(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Proposals & Quotes
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Track and manage sales proposals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowTemplates(!showTemplates)}
            variant="outline"
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Templates
          </Button>
          <Button
            onClick={() => {
              setEditingProposal(null);
              setShowModal(true);
            }}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Create Proposal
          </Button>
        </div>
      </div>

      {/* Templates */}
      {showTemplates && (
        <Card className="glass-card col-span-full">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Proposal Templates
            </h2>
            <ProposalTemplateLibrary onSelectTemplate={handleTemplateSelect} />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(proposals.reduce((sum, p) => sum + (p.total_value || 0), 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Accepted</p>
            <p className="text-2xl font-bold text-green-600">
              {proposals.filter((p) => p.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-blue-600">
              {proposals.filter((p) => ['sent', 'viewed'].includes(p.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Win Rate</p>
            <p className="text-2xl font-bold text-violet-600">
              {proposals.length > 0
                ? Math.round(
                    (proposals.filter((p) => p.status === 'accepted').length / proposals.length) *
                      100
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No proposals yet"
          description="Create professional proposals to close more deals faster."
          actionLabel="Create Proposal"
          onAction={() => {
            setEditingProposal(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map((proposal) => {
            const statusInfo = STATUS_CONFIG[proposal.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={proposal.id}
                onClick={() => {
                  setEditingProposal(proposal);
                  setShowModal(true);
                }}
                className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{proposal.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {getContactName(proposal.contact_id)}
                      </p>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <p className="text-xs text-violet-600 dark:text-violet-400">Total Value</p>
                    <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                      {formatCurrency(proposal.total_value)}
                    </p>
                  </div>

                  {proposal.view_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>Viewed {proposal.view_count} times</span>
                    </div>
                  )}

                  {proposal.valid_until && (
                    <div className="text-sm text-gray-500">
                      Valid until: {new Date(proposal.valid_until).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ProposalModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProposal(null);
        }}
        proposal={editingProposal}
        contacts={contacts}
        deals={deals}
        onSave={(data) => saveMutation.mutate(data)}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}
