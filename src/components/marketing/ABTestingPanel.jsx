import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, FlaskConical, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ABTestingPanel() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    test_type: 'subject_line',
    variant_a: { value: '', sent: 0, opens: 0, clicks: 0 },
    variant_b: { value: '', sent: 0, opens: 0, clicks: 0 },
    sample_size: 100,
  });
  const queryClient = useQueryClient();

  const { data: tests = [] } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: () => base44.entities.EmailABTest.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.EmailABTest.create({ ...data, status: 'draft', winner: 'pending' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      setShowModal(false);
      toast.success('A/B test created');
    },
  });

  const getWinnerStats = (test) => {
    const aRate = test.variant_a?.sent > 0 ? (test.variant_a.opens / test.variant_a.sent) * 100 : 0;
    const bRate = test.variant_b?.sent > 0 ? (test.variant_b.opens / test.variant_b.sent) * 100 : 0;
    return { aRate: aRate.toFixed(1), bRate: bRate.toFixed(1), winner: aRate > bRate ? 'a' : 'b' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">A/B Testing</h2>
          <p className="text-sm text-gray-500">Test subject lines, send times, and content</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New A/B Test
        </Button>
      </div>

      <div className="grid gap-4">
        {tests.length === 0 ? (
          <Card className="glass-card rounded-2xl">
            <CardContent className="py-12 text-center">
              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No A/B Tests</h3>
              <p className="text-gray-500 mb-4">
                Test different variations to optimize performance
              </p>
              <Button onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => {
            const stats = getWinnerStats(test);
            return (
              <Card key={test.id} className="glass-card rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{test.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {test.test_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge
                      className={
                        test.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : test.status === 'running'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {test.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border-2 ${stats.winner === 'a' && test.status === 'completed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Variant A</Badge>
                        {stats.winner === 'a' && test.status === 'completed' && (
                          <Trophy className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">
                        {test.variant_a?.value || 'Not set'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.aRate}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {test.variant_a?.opens || 0} opens / {test.variant_a?.sent || 0} sent
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-lg border-2 ${stats.winner === 'b' && test.status === 'completed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Variant B</Badge>
                        {stats.winner === 'b' && test.status === 'completed' && (
                          <Trophy className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">
                        {test.variant_b?.value || 'Not set'}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.bRate}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {test.variant_b?.opens || 0} opens / {test.variant_b?.sent || 0} sent
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create A/B Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Test Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Email Subject Test"
              />
            </div>
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select
                value={formData.test_type}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, test_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject_line">Subject Line</SelectItem>
                  <SelectItem value="send_time">Send Time</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Variant A</Label>
              <Input
                value={formData.variant_a.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    variant_a: { ...prev.variant_a, value: e.target.value },
                  }))
                }
                placeholder="First variation"
              />
            </div>
            <div className="space-y-2">
              <Label>Variant B</Label>
              <Input
                value={formData.variant_b.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    variant_b: { ...prev.variant_b, value: e.target.value },
                  }))
                }
                placeholder="Second variation"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
