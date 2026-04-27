import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar, MapPin, Users, ExternalLink, Edit } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import MarketingEventModal from '@/components/modals/MarketingEventModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

export default function MarketingEventsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['marketing-events'],
    queryFn: () => base44.entities.MarketingEvent.list('-start_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-events'] });
      setShowModal(false);
      setEditingEvent(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MarketingEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-events'] });
      setShowModal(false);
      setEditingEvent(null);
    },
  });

  const handleSave = (data) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.event_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.draft;
  };

  const getFormatIcon = (format) => {
    if (format === 'virtual') {
      return '💻';
    }
    if (format === 'in_person') {
      return '🏢';
    }
    return '🔀';
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Marketing Events" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Marketing Events
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage webinars, conferences, and events</p>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
              onClick={() => {
                setEditingEvent(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="trade_show">Trade Show</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events yet"
              description="Create your first marketing event to start tracking registrations and attendance."
              actionLabel="New Event"
              onAction={() => {
                setEditingEvent(null);
                setShowModal(true);
              }}
            />
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => {
                const attendanceRate =
                  event.registration_count > 0
                    ? Math.round((event.attended_count / event.registration_count) * 100)
                    : 0;

                return (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{getFormatIcon(event.format)}</span>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {event.name}
                          </h3>
                          <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {event.event_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {event.start_date
                              ? format(new Date(event.start_date), 'MMM d, yyyy h:mm a')
                              : 'TBD'}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.registration_count || 0} registered
                            {event.capacity && ` / ${event.capacity}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="text-xs text-gray-500">Attendance</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {attendanceRate}%
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingEvent(event);
                              setShowModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {event.meeting_url && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={event.meeting_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MarketingEventModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSave}
        event={editingEvent}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
