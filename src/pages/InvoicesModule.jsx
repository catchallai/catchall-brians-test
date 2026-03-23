import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, FileText, ExternalLink } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import InvoiceModal from '@/components/modals/InvoiceModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function InvoicesModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals-for-invoices'],
    queryFn: () => base44.entities.Deal.filter({ stage: 'won' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowModal(false);
      setSelectedDeal(null);
      setEditingInvoice(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowModal(false);
      setSelectedDeal(null);
      setEditingInvoice(null);
    },
  });

  const handleSave = (data) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCreateFromDeal = (deal) => {
    setSelectedDeal(deal);
    setShowModal(true);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-cyan-100 text-cyan-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Invoices" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Invoices
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage invoices and billing</p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 bg-violet-600 hover:bg-violet-700" size="sm">
                    <Plus className="w-4 h-4" />
                    New Invoice
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedDeal(null);
                      setEditingInvoice(null);
                      setShowModal(true);
                    }}
                  >
                    Create Blank Invoice
                  </DropdownMenuItem>
                  {deals.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                        From Won Deals
                      </div>
                      {deals.slice(0, 5).map((deal) => (
                        <DropdownMenuItem key={deal.id} onClick={() => handleCreateFromDeal(deal)}>
                          {deal.title} (${deal.value?.toLocaleString()})
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Create your first invoice from a won deal or start from scratch."
              actionLabel="New Invoice"
              onAction={() => {
                setSelectedDeal(null);
                setEditingInvoice(null);
                setShowModal(true);
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {invoice.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {invoice.title}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Issued: {invoice.issued_date || 'N/A'}</span>
                        {invoice.due_date && <span>Due: {invoice.due_date}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${invoice.total_amount?.toLocaleString()}
                      </div>
                      {invoice.amount_paid > 0 && (
                        <div className="text-xs text-green-600">
                          ${invoice.amount_paid.toLocaleString()} paid
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingInvoice(invoice);
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <InvoiceModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDeal(null);
          setEditingInvoice(null);
        }}
        onSave={handleSave}
        invoice={editingInvoice}
        deal={selectedDeal}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
