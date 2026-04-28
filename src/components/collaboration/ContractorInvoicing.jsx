import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ContractorInvoicing() {
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['contractor-invoices'],
    queryFn: () => base44.entities.ContractorInvoice.list('-invoice_date', 50),
  });

  const { data: timesheets = [] } = useQuery({
    queryKey: ['approved-timesheets'],
    queryFn: async () => {
      const all = await base44.entities.ContractorTimesheet.list('-approved_date', 100);
      return all.filter((t) => t.status === 'approved');
    },
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-created_date', 100),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractorInvoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-invoices'] });
    },
  });

  const generateInvoice = (contractor) => {
    const contractorTimesheets = timesheets.filter((t) => t.contractor_id === contractor.id);

    if (contractorTimesheets.length === 0) {
      toast.warning('No approved timesheets for this contractor');
      return;
    }

    const lineItems = contractorTimesheets.map((ts) => ({
      description: `${ts.project_name} (${format(new Date(ts.period_start), 'MMM d')} - ${format(new Date(ts.period_end), 'MMM d')})`,
      hours: ts.hours_logged,
      rate: ts.hourly_rate,
      amount: ts.hours_logged * ts.hourly_rate,
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const invoiceNumber = `INV-${Date.now()}`;

    createInvoiceMutation.mutate({
      invoice_number: invoiceNumber,
      contractor_id: contractor.id,
      contractor_name: contractor.name,
      timesheet_ids: contractorTimesheets.map((t) => t.id),
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      line_items: lineItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'draft',
    });

    // Mark timesheets as invoiced
    contractorTimesheets.forEach((ts) => {
      base44.entities.ContractorTimesheet.update(ts.id, { status: 'paid' });
    });
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  const contractorsWithTimesheets = contractors.filter((c) =>
    timesheets.some((t) => t.contractor_id === c.id)
  );

  return (
    <div className="space-y-6">
      {/* Generate Invoice */}
      <Card className="glass-card rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Generate Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contractorsWithTimesheets.map((contractor) => {
              const contractorTimesheets = timesheets.filter(
                (t) => t.contractor_id === contractor.id
              );
              const totalOwed = contractorTimesheets.reduce(
                (sum, t) => sum + t.hours_logged * t.hourly_rate,
                0
              );

              return (
                <div
                  key={contractor.id}
                  className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {contractor.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {contractorTimesheets.length} approved timesheets
                  </div>
                  <div className="text-lg font-bold text-green-600 mb-2">
                    ${totalOwed.toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateInvoice(contractor)}
                    className="w-full"
                    disabled={createInvoiceMutation.isPending}
                  >
                    Generate Invoice
                  </Button>
                </div>
              );
            })}
          </div>

          {contractorsWithTimesheets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No contractors with approved timesheets</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {invoice.invoice_number}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.contractor_name}
                    </div>
                  </div>
                  <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-gray-500 text-xs">Invoice Date</div>
                    <div className="font-medium">
                      {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Due Date</div>
                    <div className="font-medium">
                      {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Total</div>
                    <div className="font-bold text-green-600">${invoice.total.toFixed(2)}</div>
                  </div>
                </div>

                {invoice.line_items && (
                  <div className="text-xs text-gray-500 mb-3">
                    {invoice.line_items.length} line items
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3 mr-1" />
                    Download PDF
                  </Button>
                  {invoice.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        base44.entities.ContractorInvoice.update(invoice.id, { status: 'sent' });
                        queryClient.invalidateQueries({ queryKey: ['contractor-invoices'] });
                      }}
                    >
                      Mark as Sent
                    </Button>
                  )}
                  {invoice.status === 'sent' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        base44.entities.ContractorInvoice.update(invoice.id, {
                          status: 'paid',
                          paid_date: new Date().toISOString().split('T')[0],
                        });
                        queryClient.invalidateQueries({ queryKey: ['contractor-invoices'] });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No invoices generated yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
