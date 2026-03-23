import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import TicketModal from '@/components/modals/TicketModal';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import Pagination from '@/components/ui-custom/Pagination';

export default function TicketsModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Ticket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowModal(false);
      setEditingTicket(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Ticket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowModal(false);
      setEditingTicket(null);
    },
  });

  const handleSave = (data) => {
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.ticket_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      let matchesTab = true;
      if (activeTab === 'my_open_tickets') {
        matchesTab = ticket.status !== 'Closed';
      } else if (activeTab === 'unassigned') {
        matchesTab = !ticket.owner_name;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
  };

  const filteredTickets = getFilteredTickets();
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      New: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Waiting on Contact': 'bg-orange-100 text-orange-800',
      'Waiting on Us': 'bg-purple-100 text-purple-800',
      Closed: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors['New'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors['Medium'];
  };

  const getTabCount = (tab) => {
    if (tab === 'all') {
      return tickets.length;
    }
    if (tab === 'my_open_tickets') {
      return tickets.filter((t) => t.status !== 'Closed').length;
    }
    if (tab === 'unassigned') {
      return tickets.filter((t) => !t.owner_name).length;
    }
    return 0;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Ticket" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Tickets
              </h1>
            </div>
            <Button
              className="gap-2 bg-teal-600 hover:bg-teal-700"
              size="sm"
              onClick={() => {
                setEditingTicket(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </Button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="bg-transparent border-0 h-auto p-0 gap-6">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 pb-3"
              >
                All tickets {getTabCount('all')}
              </TabsTrigger>
              <TabsTrigger
                value="my_open_tickets"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 pb-3"
              >
                My open tickets {getTabCount('my_open_tickets')}
              </TabsTrigger>
              <TabsTrigger
                value="unassigned"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-0 pb-3"
              >
                Unassigned tickets {getTabCount('unassigned')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Waiting on Contact">Waiting on Contact</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-8">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="mx-auto">
                  <rect
                    x="50"
                    y="60"
                    width="100"
                    height="80"
                    rx="8"
                    fill="#E0E7FF"
                    stroke="#6366F1"
                    strokeWidth="2"
                  />
                  <circle cx="100" cy="100" r="25" fill="white" stroke="#6366F1" strokeWidth="2" />
                  <path
                    d="M100 90 L100 105 M100 112 L100 115"
                    stroke="#6366F1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M85 75 L95 65 M115 75 L105 65"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Keep track of issues with your customers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Close tickets as you assign them to a team so they know what to work on first or the
                right time.
              </p>
              <Button
                onClick={() => {
                  setEditingTicket(null);
                  setShowModal(true);
                }}
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4" />
                Create Your First Ticket
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {ticket.ticket_name}
                          </h3>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        {ticket.ticket_description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {ticket.ticket_description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>#{ticket.ticket_number}</span>
                          {ticket.pipeline && <span>• {ticket.pipeline}</span>}
                          {ticket.owner_name && <span>• Owner: {ticket.owner_name}</span>}
                          {ticket.source && <span>• {ticket.source}</span>}
                          {ticket.create_date && (
                            <span>
                              • Created {format(new Date(ticket.create_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTicket(ticket);
                          setShowModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredTickets.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TicketModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTicket(null);
        }}
        onSave={handleSave}
        ticket={editingTicket}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
