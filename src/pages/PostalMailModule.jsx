import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, MapPin, Calendar, Edit, CheckCircle2 } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import PostalMailModal from '@/components/modals/PostalMailModal';
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
import { format } from 'date-fns';
import Pagination from '@/components/ui-custom/Pagination';

export default function PostalMailModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMail, setEditingMail] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: postalMail = [], isLoading } = useQuery({
    queryKey: ['postal-mail'],
    queryFn: () => base44.entities.PostalMail.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PostalMail.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postal-mail'] });
      setShowModal(false);
      setEditingMail(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PostalMail.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postal-mail'] });
      setShowModal(false);
      setEditingMail(null);
    },
  });

  const handleSave = (data) => {
    if (editingMail) {
      updateMutation.mutate({ id: editingMail.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredMail = postalMail.filter((mail) => {
    const matchesSearch =
      mail.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mail.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || mail.mail_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || mail.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMail.length / itemsPerPage);
  const paginatedMail = filteredMail.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      returned: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.draft;
  };

  const getDirectionIcon = (direction) => {
    return direction === 'inbound' ? '📥' : '📤';
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Postal Mail" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Postal Mail
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Keep track of all postal communications logged to your CRM
              </p>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
              onClick={() => {
                setEditingMail(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Mail
            </Button>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="letter">Letter</SelectItem>
              <SelectItem value="postcard">Postcard</SelectItem>
              <SelectItem value="package">Package</SelectItem>
              <SelectItem value="catalog">Catalog</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading postal mail...</div>
          ) : filteredMail.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-8">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto"
                >
                  {/* Envelope base */}
                  <rect
                    x="30"
                    y="60"
                    width="140"
                    height="100"
                    rx="8"
                    fill="#E0E7FF"
                    stroke="#6366F1"
                    strokeWidth="2"
                  />

                  {/* Envelope flap */}
                  <path d="M30 60 L100 110 L170 60" stroke="#6366F1" strokeWidth="2" fill="none" />
                  <path
                    d="M30 60 L100 110 L170 60 L170 70 L100 120 L30 70 Z"
                    fill="#C7D2FE"
                    opacity="0.7"
                  />

                  {/* Check mark circle */}
                  <circle cx="150" cy="140" r="25" fill="#10B981" />
                  <path
                    d="M140 140 L147 147 L160 132"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                See all of your postal mail in one place
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                <p>• Keep track of all postal communications logged to your CRM</p>
                <p>
                  • Stay organized by filtering postal mail by date or associated records for a
                  clear and concise overview
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingMail(null);
                  setShowModal(true);
                }}
                className="gap-2 mt-6 bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Log Your First Postal Mail
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedMail.map((mail) => (
                  <div
                    key={mail.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{getDirectionIcon(mail.direction)}</span>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {mail.subject}
                          </h3>
                          <Badge className={getStatusColor(mail.status)}>{mail.status}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {mail.mail_type}
                          </Badge>
                        </div>
                        {mail.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {mail.content}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {mail.recipient_name && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              To: {mail.recipient_name}
                            </div>
                          )}
                          {mail.recipient_address?.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {mail.recipient_address.city}, {mail.recipient_address.state}
                            </div>
                          )}
                          {mail.sent_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(mail.sent_date), 'MMM d, yyyy')}
                            </div>
                          )}
                          {mail.tracking_number && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              {mail.tracking_number}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMail(mail);
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
                    totalItems={filteredMail.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PostalMailModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingMail(null);
        }}
        onSave={handleSave}
        mail={editingMail}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
