import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Mail, Phone, Calendar, MessageSquare, Filter, X } from "lucide-react";
import EmptyState from '@/components/ui/EmptyState';
import CommunicationModal from '@/components/modals/CommunicationModal';

export default function Communications() {
  const [showModal, setShowModal] = useState(false);
  const [editingComm, setEditingComm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['communications', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Communication.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id }, '-created_date', 500);
    },
    enabled: !!user?.current_business_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Communication.create({
        ...data,
        business_id: user?.current_business_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      setShowModal(false);
      setEditingComm(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Communication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      setShowModal(false);
      setEditingComm(null);
    },
  });

  const handleSave = (data) => {
    if (editingComm) {
      updateMutation.mutate({ id: editingComm.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredComms = useMemo(() => {
    return communications.filter(comm => {
      const matchesSearch = !searchTerm || 
        comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || comm.communication_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [communications, searchTerm, typeFilter, statusFilter]);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'meeting': return Calendar;
      case 'sms': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const typeColors = {
    email: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    call: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    meeting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    sms: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    message: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    opened: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communications</h1>
          <p className="text-gray-500 mt-1">{communications.length} communications total</p>
        </div>
        <Button onClick={() => { setEditingComm(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Log Communication
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filter Options</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}
      </div>

      {/* Communications Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredComms.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No communications yet"
          description="Start logging your communications with contacts."
          actionLabel="Log Communication"
          onAction={() => { setEditingComm(null); setShowModal(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComms.map((comm) => {
            const TypeIcon = getTypeIcon(comm.communication_type);
            return (
              <Card key={comm.id} className="p-5 glass-card hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                      <TypeIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {comm.subject || `${comm.communication_type} - ${comm.contact_email}`}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{comm.contact_email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-3 flex-wrap">
                  <Badge className={typeColors[comm.communication_type]}>
                    {comm.communication_type}
                  </Badge>
                  <Badge className={statusColors[comm.status]}>
                    {comm.status}
                  </Badge>
                </div>

                {comm.duration_minutes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Duration: {comm.duration_minutes} minutes
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  {new Date(comm.created_date).toLocaleDateString()}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    setEditingComm(comm);
                    setShowModal(true);
                  }}
                >
                  Edit
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CommunicationModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingComm(null); }}
        communication={editingComm}
        contacts={contacts}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}