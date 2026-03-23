import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Mail, Phone, Target } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import SequenceModal from '@/components/modals/SequenceModal';

export default function SalesSequences() {
  const [showModal, setShowModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const queryClient = useQueryClient();

  const { data: sequences = [] } = useQuery({
    queryKey: ['sales-sequences'],
    queryFn: () => base44.entities.SalesSequence.list('-created_date', 100),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['sequence-enrollments'],
    queryFn: () => base44.entities.SequenceEnrollment.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      data.id
        ? base44.entities.SalesSequence.update(data.id, data)
        : base44.entities.SalesSequence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-sequences'] });
      setShowModal(false);
      setEditingSequence(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SalesSequence.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-sequences'] });
    },
  });

  const getEnrollmentCount = (sequenceId) => {
    return enrollments.filter((e) => e.sequence_id === sequenceId).length;
  };

  const getActiveEnrollments = (sequenceId) => {
    return enrollments.filter((e) => e.sequence_id === sequenceId && e.status === 'active').length;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Sales Sequences
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Multi-touch outreach cadences</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Create Sequence
        </Button>
      </div>

      {sequences.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No sequences yet"
          description="Create automated multi-touch sequences to engage prospects consistently."
          actionLabel="Create Sequence"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((seq) => (
            <Card key={seq.id} className="glass-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{seq.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{seq.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={seq.is_active ? 'default' : 'outline'}
                    onClick={() =>
                      toggleActiveMutation.mutate({ id: seq.id, is_active: !seq.is_active })
                    }
                  >
                    {seq.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>{seq.steps?.filter((s) => s.type === 'email').length || 0} emails</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span>{seq.steps?.filter((s) => s.type === 'call').length || 0} calls</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Total Enrolled</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {getEnrollmentCount(seq.id)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400">Active</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">
                      {getActiveEnrollments(seq.id)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant={seq.is_active ? 'default' : 'secondary'}>
                    {seq.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  {seq.completion_rate && (
                    <span className="text-gray-500">{seq.completion_rate}% completion</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SequenceModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSequence(null);
        }}
        sequence={editingSequence}
        onSave={(data) => saveMutation.mutate(data)}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}
