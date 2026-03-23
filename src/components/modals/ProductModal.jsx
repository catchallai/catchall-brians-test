import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';

export default function ProductModal({ open, onClose, onSave, product, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    product_type: 'physical',
    price: 0,
    cost: 0,
    currency: 'USD',
    pricing_model: 'one_time',
    billing_frequency: 'one_time',
    inventory_tracking: false,
    quantity_in_stock: 0,
    low_stock_threshold: 10,
    category: '',
    is_active: true,
    image_url: '',
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        product_type: 'physical',
        price: 0,
        cost: 0,
        currency: 'USD',
        pricing_model: 'one_time',
        billing_frequency: 'one_time',
        inventory_tracking: false,
        quantity_in_stock: 0,
        low_stock_threshold: 10,
        category: '',
        is_active: true,
        image_url: '',
      });
    }
  }, [product, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Create a Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="Product SKU"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) => handleChange('product_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => handleChange('image_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
                <Label>Active (available for sale)</Label>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Unit Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricing_model">Pricing Model</Label>
                  <Select
                    value={formData.pricing_model}
                    onValueChange={(value) => handleChange('pricing_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="usage_based">Usage-based</SelectItem>
                      <SelectItem value="tiered">Tiered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.pricing_model === 'recurring' && (
                  <div className="space-y-2">
                    <Label htmlFor="billing_frequency">Billing Frequency</Label>
                    <Select
                      value={formData.billing_frequency}
                      onValueChange={(value) => handleChange('billing_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {formData.cost > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Margin</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    ${(formData.price - formData.cost).toFixed(2)} profit per unit
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.inventory_tracking}
                  onCheckedChange={(checked) => handleChange('inventory_tracking', checked)}
                />
                <Label>Track inventory for this product</Label>
              </div>

              {formData.inventory_tracking && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
                      <Input
                        id="quantity_in_stock"
                        type="number"
                        value={formData.quantity_in_stock}
                        onChange={(e) =>
                          handleChange('quantity_in_stock', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) =>
                          handleChange('low_stock_threshold', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  {formData.quantity_in_stock <= formData.low_stock_threshold && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        ⚠️ Low Stock Warning
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Current stock is at or below the threshold. Consider reordering.
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : product ? 'Update' : 'Create'} Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
