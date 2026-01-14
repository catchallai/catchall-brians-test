import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Users, Upload, Download, Trash2, RotateCcw, List, Grid3x3 } from "lucide-react";
import ContactCard from '@/components/crm/ContactCard';
import ContactModal from '@/components/modals/ContactModal';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import BulkActions from '@/components/ui/BulkActions';
import ImportDialog from '@/components/ui/ImportDialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDebounce } from '@/components/hooks/useDebounce';
import { exportToCSV } from '@/components/utils/exportData';
import { useToast } from '@/components/ui/toast-provider';
import { logActivity, ActivityActions } from '@/components/utils/activityLogger';

const ITEMS_PER_PAGE = 25;

export default function Contacts() {
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allContacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter({ business_id: user.current_business_id }, '-created_date', 1000);
    },
    enabled: !!user?.current_business_id,
  });

  const contacts = allContacts.filter(c => showDeleted ? c.deleted : !c.deleted);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Company.filter({ business_id: user.current_business_id }, '-created_date', 100);
    },
    enabled: !!user?.current_business_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const contact = await base44.entities.Contact.create({
        ...data,
        business_id: user?.current_business_id,
      });
      await logActivity(ActivityActions.CREATE, 'Contact', contact.id, `${data.first_name} ${data.last_name}`);
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowModal(false);
      toast.success('Contact created successfully');
    },
    onError: () => toast.error('Failed to create contact'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowModal(false);
      setEditingContact(null);
      toast.success('Contact updated successfully');
    },
    onError: () => toast.error('Failed to update contact'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Contact.update(id, {
          deleted: true,
          deleted_at: new Date().toISOString()
        });
        await logActivity(ActivityActions.DELETE, 'Contact', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      toast.success('Contacts moved to trash');
    },
    onError: () => toast.error('Failed to delete contacts'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      for (const contact of contacts) {
        await base44.entities.Contact.update(contact.id, {
          deleted: true,
          deleted_at: new Date().toISOString()
        });
      }
      await logActivity(ActivityActions.DELETE, 'Contact', null, null, { count: contacts.length });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowDeleteConfirm(false);
      toast.success('All contacts moved to trash');
    },
    onError: () => toast.error('Failed to delete all contacts'),
  });

  const restoreMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Contact.update(id, {
          deleted: false,
          deleted_at: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedIds([]);
      toast.success('Contacts restored successfully');
    },
    onError: () => toast.error('Failed to restore contacts'),
  });

  const importMutation = useMutation({
    mutationFn: async (data) => {
      const getFieldValue = (row, ...fieldNames) => {
        for (const name of fieldNames) {
          // Try exact match
          if (row[name]) return row[name];
          // Try case-insensitive match
          const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
          if (key && row[key]) return row[key];
        }
        return '';
      };

      // Get existing companies
      const existingCompanies = await base44.entities.Company.list('-created_date', 1000);
      const companyMap = {};
      existingCompanies.forEach(c => {
        companyMap[c.name.toLowerCase()] = c.id;
      });

      // Extract unique company names from import data
      const uniqueCompanyNames = [...new Set(
        data.map(row => getFieldValue(row, 'company_name', 'Firm', 'Company', 'Company Name', 'firm', 'organization'))
          .filter(name => name && name.trim())
      )];

      // Create new companies that don't exist
      for (const companyName of uniqueCompanyNames) {
        const nameLower = companyName.toLowerCase();
        if (!companyMap[nameLower]) {
          const newCompany = await base44.entities.Company.create({
            name: companyName,
            business_id: user?.current_business_id,
          });
          companyMap[nameLower] = newCompany.id;
        }
      }

      // Create contacts with company_id and business_id
      for (const row of data) {
        const companyName = getFieldValue(row, 'company_name', 'Firm', 'Company', 'Company Name', 'firm', 'organization');
        const contactData = {
          business_id: user?.current_business_id,
          company_name: companyName,
          company_id: companyName ? companyMap[companyName.toLowerCase()] : null,
          first_name: getFieldValue(row, 'first_name', 'First Name', 'firstName', 'first', 'name'),
          last_name: getFieldValue(row, 'last_name', 'Last Name', 'lastName', 'last', 'surname'),
          email: getFieldValue(row, 'email', 'Email', 'e-mail', 'Email Address'),
          phone: getFieldValue(row, 'phone', 'Phone', 'Phone 1', 'Phone Number', 'telephone', 'mobile'),
          status: getFieldValue(row, 'status', 'Status') || 'lead',
          job_title: getFieldValue(row, 'job_title', 'Job Title', 'Title', 'jobTitle', 'title', 'position', 'role'),
          linkedin_url: getFieldValue(row, 'linkedin_url', 'Linkedin', 'LinkedIn', 'LinkedIn URL', 'linkedin'),
          notes: getFieldValue(row, 'notes', 'Notes', 'note', 'comments'),
          source: getFieldValue(row, 'source', 'Source') || 'import',
        };

        // Only create if we have at least email or both first name and last name
        if (contactData.email || (contactData.first_name && contactData.last_name)) {
          await base44.entities.Contact.create(contactData);
        }
      }
      await logActivity(ActivityActions.IMPORT, 'Contact', null, null, { count: data.length });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Contacts imported successfully');
    },
    onError: () => toast.error('Failed to import contacts'),
  });

  const handleSave = (data) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleExport = async () => {
    const dataToExport = selectedIds.length > 0 
      ? contacts.filter(c => selectedIds.includes(c.id))
      : filteredContacts;
    
    exportToCSV(dataToExport, 'contacts', [
      { key: 'company_name', label: 'Firm' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'job_title', label: 'Title' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone 1' },
      { key: 'linkedin_url', label: 'Linkedin' },
      { key: 'notes', label: 'Notes' },
    ]);
    await logActivity(ActivityActions.EXPORT, 'Contact', null, null, { count: dataToExport.length });
    toast.success('Contacts exported');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !debouncedSearch || 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        contact.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, debouncedSearch, statusFilter]);

  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getCompany = (companyId) => companies.find(c => c.id === companyId);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{contacts.length} contacts total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2 text-sm" size="sm">
            <Upload className="w-4 h-4" />
            <span className="hidden xs:inline">Import</span>
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2 text-sm" size="sm">
            <Download className="w-4 h-4" />
            <span className="hidden xs:inline">Export</span>
          </Button>
          {contacts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="gap-2 text-sm text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" 
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xs:inline">Delete All</span>
            </Button>
          )}
          <Button onClick={() => { setEditingContact(null); setShowModal(true); }} className="gap-2 bg-violet-600 hover:bg-violet-700 flex-1 sm:flex-none" size="sm">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
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
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-3"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showDeleted ? "default" : "outline"}
          onClick={() => setShowDeleted(!showDeleted)}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {showDeleted ? 'Active Contacts' : 'Trash'}
        </Button>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact List */}
      {loadingContacts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Start building your network by adding your first contact, or import from a CSV file."
          actionLabel="Add Contact"
          onAction={() => { setEditingContact(null); setShowModal(true); }}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedContacts.map((contact) => (
                <div key={contact.id} className="relative group">
                  <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Checkbox
                      checked={selectedIds.includes(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      className="bg-white"
                    />
                  </div>
                  <ContactCard
                    contact={contact}
                    company={getCompany(contact.company_id)}
                    onClick={() => handleEdit(contact)}
                    isSelected={selectedIds.includes(contact.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedContacts.map((contact) => {
                const company = getCompany(contact.company_id);
                return (
                  <div 
                    key={contact.id} 
                    className="glass-card p-4 rounded-xl hover:shadow-md transition-shadow cursor-pointer group flex items-center gap-4"
                    onClick={() => handleEdit(contact)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                      <div className="sm:col-span-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{contact.job_title}</div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {company?.name || contact.company_name || '-'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.email}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.phone || '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredContacts.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.length}
        totalCount={filteredContacts.length}
        isAllSelected={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
        onSelectAll={() => setSelectedIds(filteredContacts.map(c => c.id))}
        onDeselectAll={() => setSelectedIds([])}
        onDelete={showDeleted ? undefined : () => setShowDeleteConfirm(true)}
        onExport={handleExport}
      >
        {showDeleted && selectedIds.length > 0 && (
          <Button
            onClick={() => restoreMutation.mutate(selectedIds)}
            disabled={restoreMutation.isPending}
            className="gap-2 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <RotateCcw className="w-4 h-4" />
            Restore ({selectedIds.length})
          </Button>
        )}
      </BulkActions>

      {/* Modal */}
      <ContactModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingContact(null); }}
        contact={editingContact}
        companies={companies}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={(data) => importMutation.mutateAsync(data)}
        entityName="Contacts"
        requiredFields={['first_name', 'email']}
        optionalFields={['company_name', 'last_name', 'job_title', 'phone', 'linkedin_url', 'notes']}
        sampleData={[
          { company_name: 'Acme Corp', first_name: 'John', last_name: 'Doe', job_title: 'CEO', email: 'john@example.com', phone: '555-1234', linkedin_url: 'https://linkedin.com/in/johndoe', notes: 'Met at conference' },
          { company_name: 'Tech Inc', first_name: 'Jane', last_name: 'Smith', job_title: 'CTO', email: 'jane@example.com', phone: '555-5678', linkedin_url: 'https://linkedin.com/in/janesmith', notes: 'Interested in product demo' },
        ]}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => selectedIds.length > 0 ? deleteMutation.mutate(selectedIds) : deleteAllMutation.mutate()}
        title={selectedIds.length > 0 ? "Delete Contacts" : "Delete All Contacts"}
        description={selectedIds.length > 0 
          ? `Are you sure you want to delete ${selectedIds.length} contact(s)? This action cannot be undone.`
          : `Are you sure you want to delete ALL ${contacts.length} contacts? This action cannot be undone.`
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending || deleteAllMutation.isPending}
      />
    </div>
  );
}