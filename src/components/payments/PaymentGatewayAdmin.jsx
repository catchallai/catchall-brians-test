import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Settings,
  AlertCircle,
  CreditCard,
  Zap,
  Shield,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const GATEWAY_PROVIDERS = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCard,
    description: 'Accept credit cards, Apple Pay, Google Pay',
    color: 'text-purple-600',
    methods: ['card', 'apple_pay', 'google_pay', 'ach', 'sepa'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: DollarSign,
    description: 'PayPal and Venmo payments',
    color: 'text-blue-600',
    methods: ['paypal', 'venmo'],
  },
  {
    id: 'square',
    name: 'Square',
    icon: Shield,
    description: 'In-person and online payments',
    color: 'text-green-600',
    methods: ['card', 'apple_pay', 'google_pay', 'cash_app'],
  },
  {
    id: 'authorize_net',
    name: 'Authorize.Net',
    icon: Shield,
    description: 'Enterprise payment gateway',
    color: 'text-red-600',
    methods: ['card', 'echeck'],
  },
  {
    id: 'braintree',
    name: 'Braintree',
    icon: Zap,
    description: 'PayPal-owned payment processor',
    color: 'text-indigo-600',
    methods: ['card', 'paypal', 'venmo', 'apple_pay', 'google_pay'],
  },
];

export default function PaymentGatewayAdmin() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: gateways = [] } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: async () => {
      return await base44.entities.PaymentGatewayConfig.list();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.PaymentGatewayConfig.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      setShowConfigModal(false);
      setEditingGateway(null);
      setFormData({});
      toast.success('Gateway configured successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.PaymentGatewayConfig.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      toast.success('Gateway updated successfully');
    },
  });

  const handleToggleGateway = async (gateway) => {
    updateMutation.mutate({
      id: gateway.id,
      data: { is_enabled: !gateway.is_enabled },
    });
  };

  const handleSetDefault = async (gateway) => {
    // Disable all other defaults first
    for (const gw of gateways) {
      if (gw.id !== gateway.id && gw.is_default) {
        await base44.entities.PaymentGatewayConfig.update(gw.id, { is_default: false });
      }
    }
    // Set this as default
    updateMutation.mutate({
      id: gateway.id,
      data: { is_default: true },
    });
  };

  const handleConfigureGateway = (providerId) => {
    const provider = GATEWAY_PROVIDERS.find((p) => p.id === providerId);
    const existingGateway = gateways.find((g) => g.gateway_name === providerId);

    if (existingGateway) {
      setEditingGateway(existingGateway);
      setFormData(existingGateway);
    } else {
      setFormData({
        gateway_name: providerId,
        display_name: provider.name,
        is_enabled: false,
        test_mode: true,
        supported_methods: provider.methods,
        supported_currencies: ['USD'],
      });
    }
    setShowConfigModal(true);
  };

  const handleSave = () => {
    if (editingGateway) {
      updateMutation.mutate({ id: editingGateway.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const configuredGatewayIds = gateways.map((g) => g.gateway_name);
  const enabledGateways = gateways.filter((g) => g.is_enabled);
  const totalTransactions = 0; // Would come from Payment entity
  const totalRevenue = 0; // Would come from Payment entity

  return (
    <div className="space-y-6">
      {/* Admin Check */}
      {user?.role !== 'admin' && (
        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only administrators can manage payment gateway settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Gateways</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {enabledGateways.length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Gateways</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {gateways.length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {totalTransactions.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Gateways */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Available Payment Gateways</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GATEWAY_PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              const configured = configuredGatewayIds.includes(provider.id);
              const gateway = gateways.find((g) => g.gateway_name === provider.id);

              return (
                <Card key={provider.id} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gray-100 dark:bg-gray-800 rounded-lg`}>
                          <Icon className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {provider.name}
                          </h3>
                          {configured && gateway?.is_enabled && (
                            <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                              Active
                            </Badge>
                          )}
                          {configured && !gateway?.is_enabled && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Configured
                            </Badge>
                          )}
                        </div>
                      </div>
                      {gateway?.is_default && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {provider.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {provider.methods.slice(0, 3).map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method.replace('_', ' ')}
                        </Badge>
                      ))}
                      {provider.methods.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{provider.methods.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {configured ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Enable Gateway
                          </span>
                          <Switch
                            checked={gateway?.is_enabled}
                            onCheckedChange={() => handleToggleGateway(gateway)}
                            disabled={user?.role !== 'admin'}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleConfigureGateway(provider.id)}
                            disabled={user?.role !== 'admin'}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                          {gateway?.is_enabled && !gateway?.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(gateway)}
                              disabled={user?.role !== 'admin'}
                            >
                              Set Default
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleConfigureGateway(provider.id)}
                        disabled={user?.role !== 'admin'}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGateway ? 'Configure' : 'Add'} {formData.display_name} Gateway
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.display_name || ''}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., Stripe Payments"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mode</Label>
                <Select
                  value={formData.test_mode ? 'test' : 'live'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, test_mode: value === 'test' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test Mode</SelectItem>
                    <SelectItem value="live">Live Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_enabled || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                  />
                  <Label>Enable Gateway</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>API Key / Public Key</Label>
              <Input
                type="password"
                value={formData.api_key || ''}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Enter your API key"
              />
            </div>

            <div>
              <Label>Secret Key / Private Key</Label>
              <Input
                type="password"
                value={formData.secret_key || ''}
                onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                placeholder="Enter your secret key"
              />
            </div>

            <div>
              <Label>Webhook Secret (Optional)</Label>
              <Input
                type="password"
                value={formData.webhook_secret || ''}
                onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                placeholder="Enter webhook secret for real-time updates"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Transaction Fee (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.fees?.percentage || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fees: { ...formData.fees, percentage: parseFloat(e.target.value) },
                    })
                  }
                  placeholder="2.9"
                />
              </div>

              <div>
                <Label>Fixed Fee ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.fees?.fixed_amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fees: { ...formData.fees, fixed_amount: parseFloat(e.target.value) },
                    })
                  }
                  placeholder="0.30"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Security Notice</p>
                  <p>
                    API keys and secrets are encrypted before storage. Never share your credentials.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.display_name || !formData.api_key || !formData.secret_key}
              >
                {editingGateway ? 'Update' : 'Add'} Gateway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
