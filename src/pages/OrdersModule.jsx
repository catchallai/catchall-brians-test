import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Package, DollarSign, Edit, Truck, Calendar } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import OrderModal from '@/components/modals/OrderModal';
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

export default function OrdersModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-order_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowModal(false);
      setEditingOrder(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowModal(false);
      setEditingOrder(null);
    },
  });

  const handleSave = (data) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
  };

  const getPaymentColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Orders" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Orders
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track the status of your orders through the default order pipeline
              </p>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
              onClick={() => {
                setEditingOrder(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-8">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto"
                >
                  {/* Clipboard */}
                  <rect
                    x="50"
                    y="30"
                    width="100"
                    height="140"
                    rx="8"
                    fill="#E0E7FF"
                    stroke="#6366F1"
                    strokeWidth="2"
                  />
                  <rect x="70" y="20" width="60" height="20" rx="4" fill="#6366F1" />

                  {/* Lines representing order items */}
                  <line
                    x1="65"
                    y1="60"
                    x2="135"
                    y2="60"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="65"
                    y1="80"
                    x2="135"
                    y2="80"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="65"
                    y1="100"
                    x2="135"
                    y2="100"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="65"
                    y1="120"
                    x2="120"
                    y2="120"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Shopping cart */}
                  <circle cx="150" cy="160" r="30" fill="#10B981" opacity="0.9" />
                  <path d="M140 155h20l2 8h-24l2-8zm4-5l-2 5h16l-2-5h-12z" fill="white" />
                  <circle cx="145" cy="168" r="2" fill="white" />
                  <circle cx="155" cy="168" r="2" fill="white" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                See all of your orders in one place
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                <p>• Track the status of your orders through the default order pipeline</p>
                <p>• Get started by syncing your orders from one of our supported apps</p>
              </div>
              <Button
                onClick={() => {
                  setEditingOrder(null);
                  setShowModal(true);
                }}
                className="gap-2 mt-6 bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Create Your First Order
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {order.order_number}
                          </h3>
                          {order.order_name && (
                            <span className="text-gray-500">• {order.order_name}</span>
                          )}
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          <Badge className={getPaymentColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {order.order_date
                              ? format(new Date(order.order_date), 'MMM d, yyyy')
                              : 'No date'}
                          </div>
                          {order.tracking_number && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-4 h-4" />
                              {order.tracking_number}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {order.line_items?.length || 0} items
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <DollarSign className="w-3 h-3" />
                            Total
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${order.total_amount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingOrder(order);
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
                    totalItems={filteredOrders.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <OrderModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingOrder(null);
        }}
        onSave={handleSave}
        order={editingOrder}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
