import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, DollarSign, Edit, Upload, Package } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import ProductModal from '@/components/modals/ProductModal';
import ImportDialog from '@/components/ui/ImportDialog';
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
import Pagination from '@/components/ui-custom/Pagination';

export default function ProductsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setEditingProduct(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setEditingProduct(null);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (products) => base44.entities.Product.bulkCreate(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowImport(false);
    },
  });

  const handleSave = (data) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImport = (data) => {
    bulkCreateMutation.mutate(data);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || product.product_type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Products" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Products
              </h1>
              <p className="text-sm text-gray-500 mt-1">Organize and store your product data</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImport(true)}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button
                className="gap-2 bg-violet-600 hover:bg-violet-700"
                size="sm"
                onClick={() => {
                  setEditingProduct(null);
                  setShowModal(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Create a product
              </Button>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto">
              <div className="mb-8">
                <svg width="200" height="140" viewBox="0 0 200 140" fill="none" className="mx-auto">
                  <rect
                    x="60"
                    y="20"
                    width="80"
                    height="100"
                    rx="4"
                    fill="#E0E7FF"
                    stroke="#6366F1"
                    strokeWidth="2"
                  />
                  <circle cx="100" cy="50" r="15" fill="#6366F1" />
                  <path
                    d="M100 40 L100 60 M90 50 L110 50"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <rect x="70" y="75" width="60" height="4" rx="2" fill="#6366F1" opacity="0.4" />
                  <rect x="70" y="85" width="40" height="4" rx="2" fill="#6366F1" opacity="0.4" />
                  <circle cx="160" cy="100" r="25" fill="#10B981" />
                  <path
                    d="M160 90 Q160 95, 165 100 L175 85"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Create products and simplify your billing workflow
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 text-left max-w-lg mb-6">
                <p className="flex gap-2">
                  <span className="text-violet-600">→</span> Organize and store your product data so
                  your sales team can easily sell and get paid
                </p>
                <p className="flex gap-2">
                  <span className="text-violet-600">→</span> Add and reuse your products for sending
                  deals, quotes, invoices, and payment links to customers
                </p>
                <p className="flex gap-2">
                  <span className="text-violet-600">→</span> Configure quantity-based pricing tiers
                  and easily access in-depth sales performance reporting of products and services in
                  your library
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowModal(true);
                  }}
                  className="gap-2 bg-orange-500 hover:bg-orange-600"
                >
                  Create a product
                </Button>
                <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
                  Import
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Package className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {product.name}
                            </h3>
                            {product.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {product.product_type}
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-500">
                            {product.sku && <span>SKU: {product.sku}</span>}
                            {product.category && <span>• {product.category}</span>}
                            {product.inventory_tracking && (
                              <span>• Stock: {product.quantity_in_stock}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-center gap-1 text-gray-500 text-xs justify-end">
                            <DollarSign className="w-3 h-3" />
                            Price
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${product.price?.toFixed(2) || '0.00'}
                          </div>
                          {product.pricing_model === 'recurring' && (
                            <div className="text-xs text-gray-500">
                              per {product.billing_frequency}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(product);
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
                    totalItems={filteredProducts.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProductModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
        product={editingProduct}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityName="Product"
        sampleFields={['name', 'description', 'sku', 'price', 'product_type']}
      />
    </div>
  );
}
