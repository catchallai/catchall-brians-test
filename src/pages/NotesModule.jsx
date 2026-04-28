import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pin, Edit, Trash2, Calendar, User } from 'lucide-react';
import ContactsSidebar from '@/components/crm/ContactsSidebar';
import NoteModal from '@/components/modals/NoteModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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

export default function NotesModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [associatedFilter, setAssociatedFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => base44.entities.Note.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Note.create({
        ...data,
        owner_email: user?.email,
        owner_name: user?.full_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setShowModal(false);
      setEditingNote(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Note.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setShowModal(false);
      setEditingNote(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }) => base44.entities.Note.update(id, { is_pinned: !isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleSave = (data) => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (noteId) => {
    setDeleteConfirmId(noteId);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssociated =
      associatedFilter === 'all' || note.associated_with === associatedFilter;
    const matchesCreatedBy = createdByFilter === 'all' || note.owner_email === createdByFilter;
    return matchesSearch && matchesAssociated && matchesCreatedBy;
  });

  // Sort: pinned first, then by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) {
      return -1;
    }
    if (!a.is_pinned && b.is_pinned) {
      return 1;
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const totalPages = Math.ceil(sortedNotes.length / itemsPerPage);
  const paginatedNotes = sortedNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueOwners = [...new Set(notes.map((n) => n.owner_email).filter(Boolean))];

  const getAssociatedColor = (type) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      contact: 'bg-blue-100 text-blue-800',
      company: 'bg-purple-100 text-purple-800',
      deal: 'bg-green-100 text-green-800',
      ticket: 'bg-orange-100 text-orange-800',
      task: 'bg-cyan-100 text-cyan-800',
      meeting: 'bg-indigo-100 text-indigo-800',
      call: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || colors.general;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <ContactsSidebar activeModule="Notes" />
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Notes
              </h1>
              <p className="text-sm text-gray-500 mt-1">Keep track of notes created in your CRM</p>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              size="sm"
              onClick={() => {
                setEditingNote(null);
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={associatedFilter} onValueChange={setAssociatedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Associated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="deal">Deal</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
              <SelectItem value="call">Call</SelectItem>
            </SelectContent>
          </Select>
          <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Created by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueOwners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading notes...</div>
          ) : sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <img
                src="https://illustrations.popsy.co/amber/taking-notes.svg"
                alt="Notes"
                className="w-48 h-48 mb-6 opacity-80"
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                See all of your notes in one place
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                <p>
                  • Keep track of notes created in your CRM, giving you a comprehensive view of
                  important updates
                </p>
                <p>
                  • Filter notes by creation date or last modified date to quickly find the
                  information you need
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingNote(null);
                  setShowModal(true);
                }}
                className="gap-2 mt-6 bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Create Your First Note
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {note.is_pinned && (
                            <Pin className="w-4 h-4 text-violet-600 fill-violet-600" />
                          )}
                          {note.title && (
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {note.title}
                            </h3>
                          )}
                          <Badge className={getAssociatedColor(note.associated_with)}>
                            {note.associated_with}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {note.owner_name || note.owner_email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(note.created_date), 'MMM d, yyyy h:mm a')}
                          </div>
                          {note.last_modified_date &&
                            note.last_modified_date !== note.created_date && (
                              <span className="text-gray-400">
                                • Modified {format(new Date(note.last_modified_date), 'MMM d')}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            togglePinMutation.mutate({ id: note.id, isPinned: note.is_pinned })
                          }
                          className={note.is_pinned ? 'text-violet-600' : ''}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNote(note);
                            setShowModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(note.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                    totalItems={sortedNotes.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <NoteModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingNote(null);
        }}
        onSave={handleSave}
        note={editingNote}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        title="Delete this note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
