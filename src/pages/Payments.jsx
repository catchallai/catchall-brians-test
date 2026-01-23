import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, DollarSign, TrendingUp, Filter, X, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from '@/components/ui/EmptyState';
import PaymentModal from '@/components/modals/PaymentModal';
import InvoiceModal from '@/components/modals/InvoiceModal';

export default function Payments() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['payments', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Payment.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Invoice.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id });
    },
    enabled: !!user?.current_business_id,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Payment.create({
        ...data,
        business_id: user?.current_business_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowPaymentModal(false);
      setEditingPayment(null);
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Invoice.create({
        ...data,
        business_id: user?.current_business_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowInvoiceModal(false);
      setEditingInvoice(null);
    },
  });

  const handlePaymentSave = (data) => {
    if (editingPayment) {
      base44.entities.Payment.update(editingPayment.id, data);
    } else {
      createPaymentMutation.mutate(data);
    }
  };

  const handleInvoiceSave = (data) => {
    if (editingInvoice) {
      base44.entities.Invoice.update(editingInvoice.id, data);
    } else {
      createInvoiceMutation.mutate(data);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paid_by?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paymentMethodColors = {
    credit_card: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    debit_card: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    bank_transfer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    paypal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    stripe: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    check: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    cash: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-500 mt-1">Manage invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditingInvoice(null); setShowInvoiceModal(true); }} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
          <Button onClick={() => { setEditingPayment(null); setShowPaymentModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus className="w-4 h-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${pendingPayments.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{invoices.length}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
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
                Filters
              </Button>
            </div>

            {showFilters && (
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filter Options</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </Card>
            )}
          </div>

          {loadingPayments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No payments yet"
              description="Record your first payment transaction."
              actionLabel="Record Payment"
              onAction={() => { setEditingPayment(null); setShowPaymentModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="p-5 glass-card hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        ${payment.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </h3>
                      <p className="text-sm text-gray-500">{payment.paid_by || 'N/A'}</p>
                    </div>
                    <Badge className={statusColors[payment.status]}>
                      {payment.status}
                    </Badge>
                  </div>

                  <Badge className={paymentMethodColors[payment.payment_method]}>
                    {payment.payment_method.replace('_', ' ')}
                  </Badge>

                  {payment.transaction_id && (
                    <p className="text-xs text-gray-500 mt-2">ID: {payment.transaction_id}</p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setEditingPayment(payment);
                      setShowPaymentModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {loadingInvoices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No invoices yet"
              description="Create your first invoice to get started."
              actionLabel="New Invoice"
              onAction={() => { setEditingInvoice(null); setShowInvoiceModal(true); }}
            />
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="p-5 glass-card hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </h3>
                        <Badge className={statusColors[invoice.status]}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{invoice.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${invoice.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </p>
                      <p className="text-xs text-gray-500">
                        Paid: ${invoice.amount_paid.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingInvoice(invoice);
                        setShowInvoiceModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }}
        payment={editingPayment}
        contacts={contacts}
        invoices={invoices}
        onSave={handlePaymentSave}
        isLoading={createPaymentMutation.isPending}
      />

      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => { setShowInvoiceModal(false); setEditingInvoice(null); }}
        invoice={editingInvoice}
        contacts={contacts}
        onSave={handleInvoiceSave}
        isLoading={createInvoiceMutation.isPending}
      />
    </div>
  );
}