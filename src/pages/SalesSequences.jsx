import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Mail, Phone, Target, Edit, TrendingUp, Users, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import SequenceModal from '@/components/modals/SequenceModal';
import SequenceStats from '@/components/sales/SequenceStats';

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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sales Sequences
            </h1>
            <p className="text-gray-500 mt-1">Automated multi-touch outreach campaigns</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            Create Sequence
          </Button>
        </div>

        {sequences.length > 0 && <SequenceStats sequences={sequences} enrollments={enrollments} />}
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
           {sequences.map((seq) => {
             const emailCount = seq.steps?.filter((s) => s.type === 'email').length || 0;
             const callCount = seq.steps?.filter((s) => s.type === 'call').length || 0;
             const totalEnrolled = getEnrollmentCount(seq.id);
             const activeEnrolled = getActiveEnrollments(seq.id);

             return (
               <Card 
                 key={seq.id} 
                 className={`group relative overflow-hidden transition-all duration-300 ${
                   seq.is_active 
                     ? 'bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700'
                     : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
                 }`}
               >
                 <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-emerald-500/5 to-transparent transition-opacity duration-300" />

                 <CardHeader className="relative">
                   <div className="flex items-start justify-between">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <CardTitle className="text-lg truncate">{seq.name}</CardTitle>
                         <Badge 
                           variant={seq.is_active ? 'default' : 'secondary'}
                           className={seq.is_active ? 'bg-emerald-600' : ''}
                         >
                           {seq.is_active ? 'Active' : 'Paused'}
                         </Badge>
                       </div>
                       <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{seq.description}</p>
                     </div>
                     <div className="flex gap-1 ml-2">
                       <Button
                         size="sm"
                         variant="ghost"
                         className="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                         onClick={() => {
                           setEditingSequence(seq);
                           setShowModal(true);
                         }}
                       >
                         <Edit className="w-4 h-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         className={seq.is_active ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : ''}
                         onClick={() =>
                           toggleActiveMutation.mutate({ id: seq.id, is_active: !seq.is_active })
                         }
                       >
                         {seq.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                       </Button>
                     </div>
                   </div>
                 </CardHeader>

                 <CardContent className="relative space-y-4">
                   <div className="flex items-center gap-4 text-sm font-medium">
                     <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                       <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                       <span className="text-blue-700 dark:text-blue-300">{emailCount} email{emailCount !== 1 ? 's' : ''}</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                       <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                       <span className="text-purple-700 dark:text-purple-300">{callCount} call{callCount !== 1 ? 's' : ''}</span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                       <div className="flex items-center gap-1.5 mb-1">
                         <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                         <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Enrolled</p>
                       </div>
                       <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                         {totalEnrolled}
                       </p>
                     </div>
                     <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                       <div className="flex items-center gap-1.5 mb-1">
                         <TrendingUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                         <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Active</p>
                       </div>
                       <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                         {activeEnrolled}
                       </p>
                     </div>
                   </div>

                   {seq.completion_rate && (
                     <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                       <Clock className="w-4 h-4" />
                       <span>{seq.completion_rate}% completion rate</span>
                     </div>
                   )}
                 </CardContent>
               </Card>
             );
           })}
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