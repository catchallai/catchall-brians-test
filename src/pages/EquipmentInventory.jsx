import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  TrendingDown,
  AlertCircle,
  DollarSign,
  Edit,
  Trash2,
  QrCode,
  Upload,
  Download,
  Shield,
  Loader2,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCodeGenerator from '@/components/equipment/QRCodeGenerator';
import MaintenanceHistory from '@/components/equipment/MaintenanceHistory';
import CheckoutSystem from '@/components/equipment/CheckoutSystem';
import { toast } from 'sonner';

export default function EquipmentInventory() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEquipment, setQREquipment] = useState(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'IT',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    current_value: '',
    condition: 'Good',
    location: '',
    assigned_to: '',
    warranty_expiry: '',
    maintenance_schedule: 'As Needed',
    status: 'Active',
    notes: '',
    insurance_policy: '',
    insurance_expiry: '',
    insurance_provider: '',
    photo_urls: [],
  });

  const queryClient = useQueryClient();

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'IT',
      serial_number: '',
      purchase_date: '',
      purchase_price: '',
      current_value: '',
      condition: 'Good',
      location: '',
      assigned_to: '',
      warranty_expiry: '',
      maintenance_schedule: 'As Needed',
      status: 'Active',
      notes: '',
    });
    setEditingEquipment(null);
  };

  const handleEdit = (item) => {
    setEditingEquipment(item);
    setFormData(item);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      return;
    }

    setUploadingPhotos(true);
    const urls = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }

    setFormData((prev) => ({
      ...prev,
      photo_urls: [...(prev.photo_urls || []), ...urls],
    }));
    setUploadingPhotos(false);
    toast.success(`${files.length} photo(s) uploaded`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Category',
      'Serial',
      'Status',
      'Condition',
      'Value',
      'Location',
      'Assigned To',
    ];
    const rows = equipment.map((e) => [
      e.name,
      e.category,
      e.serial_number || '',
      e.status,
      e.condition,
      e.current_value || '',
      e.location || '',
      e.assigned_to || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const filteredEquipment = equipment.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      item.assigned_to?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = equipment.reduce((sum, item) => sum + (item.current_value || 0), 0);
  const needsMaintenance = equipment.filter((item) => {
    if (!item.next_maintenance) {
      return false;
    }
    const daysUntil = Math.floor(
      (new Date(item.next_maintenance) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30;
  }).length;

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'Good':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Fair':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Poor':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Needs Repair':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'In Repair':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Retired':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Disposed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            Equipment Inventory
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your company assets and equipment
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {equipment.length}
                </p>
              </div>
              <Package className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Needs Maintenance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {needsMaintenance}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Depreciation</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $
                  {equipment
                    .reduce(
                      (sum, item) => sum + ((item.purchase_price || 0) - (item.current_value || 0)),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Equipment List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search equipment..."
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <Badge className={`text-xs border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                      <Badge className={`text-xs border ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {item.serial_number && (
                        <div>
                          <p className="text-gray-500">Serial #</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.serial_number}
                          </p>
                        </div>
                      )}
                      {item.assigned_to && (
                        <div>
                          <p className="text-gray-500">Assigned To</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.assigned_to}
                          </p>
                        </div>
                      )}
                      {item.location && (
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.location}
                          </p>
                        </div>
                      )}
                      {item.current_value && (
                        <div>
                          <p className="text-gray-500">Value</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ${item.current_value.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEquipment(item);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQREquipment(item);
                        setShowQRModal(true);
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipment Name*</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category*</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Vehicles">Vehicles</SelectItem>
                    <SelectItem value="Machinery">Machinery</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Serial Number</Label>
                <Input
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="In Repair">In Repair</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                    <SelectItem value="Disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                />
              </div>
              <div>
                <Label>Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Assigned To</Label>
                <Input
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Insurance Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Insurance Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Policy Number</Label>
                  <Input
                    value={formData.insurance_policy}
                    onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input
                    value={formData.insurance_provider}
                    onChange={(e) =>
                      setFormData({ ...formData, insurance_provider: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label>Insurance Expiry</Label>
                <Input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                />
              </div>
            </div>

            {/* Photos Section */}
            <div className="border-t pt-4">
              <Label>Equipment Photos</Label>
              <div className="mt-2 space-y-3">
                <label className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  {uploadingPhotos ? (
                    <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Upload photos</p>
                    </div>
                  )}
                </label>
                {formData.photo_urls?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.photo_urls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                        <button
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              photo_urls: prev.photo_urls.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                {editingEquipment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Detail Modal */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEquipment?.name}</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="checkout">Checkout</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {selectedEquipment.photo_urls?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedEquipment.photo_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt=""
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium">{selectedEquipment.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Serial Number</p>
                    <p className="font-medium">{selectedEquipment.serial_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Value</p>
                    <p className="font-medium">
                      ${selectedEquipment.current_value?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Condition</p>
                    <Badge className={getConditionColor(selectedEquipment.condition)}>
                      {selectedEquipment.condition}
                    </Badge>
                  </div>
                </div>

                {/* Insurance Info */}
                {selectedEquipment.insurance_policy && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">Insurance</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Policy #</p>
                          <p className="font-medium">{selectedEquipment.insurance_policy}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Provider</p>
                          <p className="font-medium">{selectedEquipment.insurance_provider}</p>
                        </div>
                        {selectedEquipment.insurance_expiry && (
                          <div>
                            <p className="text-gray-600">Expiry</p>
                            <p className="font-medium">
                              {new Date(selectedEquipment.insurance_expiry).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="maintenance">
                <MaintenanceHistory equipmentId={selectedEquipment.id} />
              </TabsContent>

              <TabsContent value="checkout">
                <CheckoutSystem equipment={selectedEquipment} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <QRCodeGenerator
        equipment={qrEquipment}
        open={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQREquipment(null);
        }}
      />
    </div>
  );
}
