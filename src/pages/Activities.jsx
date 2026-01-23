import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Calendar, List } from "lucide-react";
import ActivityItem from '@/components/crm/ActivityItem';
import ActivityModal from '@/components/modals/ActivityModal';
import ActivityCalendarView from '@/components/crm/ActivityCalendarView';
import EmptyState from '@/components/ui/EmptyState';

export default function Activities() {
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [completedFilter, setCompletedFilter] = useState('pending');
  const [viewMode, setViewMode] = useState('list');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['activities', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Activity.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const activities = allActivities;

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id }, '-created_date', 500);
    },
    enabled: !!user?.current_business_id,
  });

  const contacts = allContacts;

  const { data: allDeals = [] } = useQuery({
    queryKey: ['deals', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Deal.filter({ business_id: user.current_business_id }, '-created_date', 200);
    },
    enabled: !!user?.current_business_id,
  });

  const deals = allDeals;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const activity = await base44.entities.Activity.create({
        ...data,
        business_id: user?.current_business_id,
      });
      return activity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowModal(false);
      setEditingActivity(null);
    },
  });

  const handleSave = (data) => {
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleComplete = (activity) => {
    updateMutation.mutate({ id: activity.id, data: { ...activity, completed: !activity.completed } });
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowModal(true);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesCompleted = completedFilter === 'all' || 
      (completedFilter === 'pending' && !activity.completed) ||
      (completedFilter === 'completed' && activity.completed);
    return matchesSearch && matchesType && matchesCompleted;
  });

  const pendingCount = activities.filter(a => !a.completed).length;
  const completedCount = activities.filter(a => a.completed).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activities</h1>
          <p className="text-gray-500 mt-1">{pendingCount} pending • {completedCount} completed</p>
        </div>
        <Button onClick={() => { setEditingActivity(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          Add Activity
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="h-8 px-3"
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={completedFilter} onValueChange={setCompletedFilter}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="note">Note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Views */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No activities yet"
          description="Keep track of calls, emails, meetings, and tasks here."
          actionLabel="Add Activity"
          onAction={() => { setEditingActivity(null); setShowModal(true); }}
        />
      ) : viewMode === 'calendar' ? (
        <ActivityCalendarView
          activities={filteredActivities}
          onActivityClick={handleEdit}
          onDateClick={(date) => {
            setEditingActivity({ due_date: date.toISOString() });
            setShowModal(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div key={activity.id} onClick={() => handleEdit(activity)} className="cursor-pointer">
              <ActivityItem
                activity={activity}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ActivityModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingActivity(null); }}
        activity={editingActivity}
        contacts={contacts}
        deals={deals}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}