import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Calendar, DollarSign, Edit, TrendingUp } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import SubscriptionModal from '@/components/modals/SubscriptionModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Pagination from '@/components/ui-custom/Pagination';

export default function SubscriptionsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowModal(false);
      setEditingSubscription(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowModal(false);
      setEditingSubscription(null);
    },
  });

  const handleSave = (data) => {
    if (editingSubscription) {
      updateMutation.mutate({ id: editingSubscription.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.subscription_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesFrequency = frequencyFilter === 'all' || sub.billing_frequency === frequencyFilter;
    return matchesSearch && matchesStatus && matchesFrequency;
  });

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.active;
  };

  const totalMRR = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .reduce((sum, s) => sum + (s.mrr || 0), 0);

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Subscriptions" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Subscriptions
              </h1>
              <p className="text-sm text-gray-500 mt-1">Automate recurring billing from your CRM</p>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
              onClick={() => {
                setEditingSubscription(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create setup today
            </Button>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequency</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading subscriptions...</div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
              <div className="mb-8">
                <svg width="220" height="180" viewBox="0 0 220 180" fill="none" className="mx-auto">
                  <rect
                    x="140"
                    y="30"
                    width="150"
                    height="120"
                    rx="8"
                    fill="#10B981"
                    transform="translate(-50, 0)"
                  />
                  <rect
                    x="145"
                    y="35"
                    width="140"
                    height="110"
                    rx="6"
                    fill="white"
                    transform="translate(-50, 0)"
                  />

                  <circle cx="95" cy="90" r="35" fill="white" stroke="#10B981" strokeWidth="3" />
                  <path
                    d="M85 90 L92 97 L105 84"
                    stroke="#10B981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <text x="105" y="62" fontSize="12" fill="#6B7280" fontWeight="500">
                    Your payment link
                  </text>
                  <text x="105" y="77" fontSize="11" fill="#6B7280">
                    is ready to be sent
                  </text>

                  <rect x="105" y="95" width="70" height="8" rx="2" fill="#E5E7EB" />
                  <rect x="105" y="108" width="50" height="8" rx="2" fill="#E5E7EB" />

                  <circle cx="195" cy="45" r="6" fill="#FCD34D" />
                  <circle cx="208" cy="52" r="4" fill="#FCD34D" opacity="0.6" />
                  <circle cx="185" cy="55" r="5" fill="#FCD34D" opacity="0.4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Create Subscriptions to automate recurring billing
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 text-left max-w-lg mb-6">
                <p className="flex gap-2">
                  <span className="text-teal-600">→</span> Easily manage subscriptions from your CRM
                  and generate reports to understand your recurring revenue
                </p>
                <p className="flex gap-2">
                  <span className="text-teal-600">→</span> Simplify payment collection with
                  automatic reminders and saved payment methods
                </p>
                <p className="flex gap-2">
                  <span className="text-teal-600">→</span> No hidden charges and only pay
                  transaction fees to collect online payment
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingSubscription(null);
                  setShowModal(true);
                }}
                className="gap-2 bg-orange-500 hover:bg-orange-600"
              >
                Create setup today
              </Button>
            </div>
          ) : (
            <>
              {totalMRR > 0 && (
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 p-6 rounded-xl">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-medium mb-2">
                      <TrendingUp className="w-4 h-4" />
                      Total MRR
                    </div>
                    <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">
                      ${totalMRR.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium mb-2">
                      <RefreshCw className="w-4 h-4" />
                      Active
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {subscriptions.filter((s) => s.status === 'active').length}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium mb-2">
                      <DollarSign className="w-4 h-4" />
                      Total ARR
                    </div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      ${(totalMRR * 12).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {paginatedSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {subscription.subscription_name}
                          </h3>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {subscription.billing_frequency}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500">
                          {subscription.next_billing_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Next billing:{' '}
                              {format(new Date(subscription.next_billing_date), 'MMM d, yyyy')}
                            </div>
                          )}
                          {subscription.mrr > 0 && <span>MRR: ${subscription.mrr.toFixed(2)}</span>}
                          {subscription.auto_renewal && (
                            <span className="text-green-600">Auto-renew ✓</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center gap-1 text-gray-500 text-xs justify-end">
                            <DollarSign className="w-3 h-3" />
                            Amount
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${subscription.amount?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-500">
                            per {subscription.billing_frequency}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSubscription(subscription);
                            setShowModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredSubscriptions.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SubscriptionModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSubscription(null);
        }}
        onSave={handleSave}
        subscription={editingSubscription}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
