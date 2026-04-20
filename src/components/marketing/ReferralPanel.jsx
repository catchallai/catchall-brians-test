import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Plus, UserPlus, Gift, Trophy, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  converted: 'bg-emerald-100 text-emerald-700',
  rewarded: 'bg-violet-100 text-violet-700',
};

export default function ReferralPanel({ referrals, contacts }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(null);
  const [formData, setFormData] = useState({
    referrer_contact_id: '',
    reward_type: 'discount',
    reward_value: 10,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => {
      const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return base44.entities.Referral.create({ ...data, referral_code: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setShowModal(false);
      toast.success('Referral code created');
    },
  });

  const getContact = (id) => contacts.find((c) => c.id === id);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  // Stats
  const totalReferrals = referrals.length;
  const converted = referrals.filter(
    (r) => r.status === 'converted' || r.status === 'rewarded'
  ).length;
  const conversionRate = totalReferrals > 0 ? ((converted / totalReferrals) * 100).toFixed(0) : 0;
  const totalValue = referrals.reduce((sum, r) => {
    if (r.status === 'converted' || r.status === 'rewarded') {
      return sum + (r.reward_value || 0);
    }
    return sum;
  }, 0);

  // Top referrers
  const referrerCounts = referrals.reduce((acc, r) => {
    acc[r.referrer_contact_id] = (acc[r.referrer_contact_id] || 0) + 1;
    return acc;
  }, {});
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ contact: getContact(id), count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Referral Program</h2>
          <p className="text-sm text-gray-500">Track referrals and reward top referrers</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Referral Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <UserPlus className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReferrals}</p>
            <p className="text-sm text-gray-500">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{converted}</p>
            <p className="text-sm text-gray-500">Converted</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{conversionRate}%</p>
            <p className="text-sm text-gray-500">Conversion Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Gift className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue}</p>
            <p className="text-sm text-gray-500">Rewards Given</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Referrers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No referrers yet</p>
            ) : (
              <div className="space-y-3">
                {topReferrers.map(({ contact, count }, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700'
                          : idx === 1
                            ? 'bg-gray-100 text-gray-700'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">{contact?.email}</p>
                    </div>
                    <Badge variant="outline">{count} referrals</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No referrals yet</p>
            ) : (
              <div className="space-y-3">
                {referrals.slice(0, 5).map((ref) => {
                  const referrer = getContact(ref.referrer_contact_id);
                  return (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {referrer ? `${referrer.first_name} ${referrer.last_name}` : 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {ref.referral_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => copyCode(ref.referral_code)}
                          >
                            {copied === ref.referral_code ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Badge className={STATUS_COLORS[ref.status]}>{ref.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Referrer (Customer)</Label>
              <Select
                value={formData.referrer_contact_id}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, referrer_contact_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts
                    .filter((c) => c.status === 'customer')
                    .map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <Select
                  value={formData.reward_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, reward_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount %</SelectItem>
                    <SelectItem value="credit">Account Credit</SelectItem>
                    <SelectItem value="gift">Gift Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reward Value</Label>
                <Input
                  type="number"
                  value={formData.reward_value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reward_value: parseInt(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.referrer_contact_id}
                className="flex-1"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
