import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Plus, Search, Users, Upload, Download, Trash2, RotateCcw, List, Grid3x3, Filter, X, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import ContactCard from '@/components/crm/ContactCard';
import ContactModal from '@/components/modals/ContactModal';
import ContactDetailPanel from '@/components/crm/ContactDetailPanel';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import BulkActions from '@/components/ui/BulkActions';
import ImportDialog from '@/components/ui/ImportDialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ContactBulkActionsPanel from '@/components/crm/ContactBulkActionsPanel';
import ContactDeduplicationTool from '@/components/crm/ContactDeduplicationTool';
import BulkOwnerAssignment from '@/components/crm/BulkOwnerAssignment';
import { useDebounce } from '@/components/hooks/useDebounce';
import { exportToCSV } from '@/components/utils/exportData';
import { useToast } from '@/components/ui/toast-provider';
import { logActivity, ActivityActions } from '@/components/utils/activityLogger';

const ITEMS_PER_PAGE = 50;

export default function Contacts() {
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    companyName: '',
    email: '',
    firstName: '',
    lastName: '',
    tag: '',
    city: '',
    country: '',
    source: 'all',
    jobTitle: '',
  });
  const [sortBy, setSortBy] = useState('created_date');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('contactsVisibleColumns');
    return saved ? JSON.parse(saved) : {
      name: true,
      phone: true,
      email: true,
      created: true,
      lastActivity: true,
      tags: true,
      status: true,
      company: true,
      title: true,
      tier: false,
      category: false,
      country: false,
      primaryRoleTitle: false,
      primaryRoleName: false,
      secondaryRoleTitle: false,
      secondaryRoleName: false,
    };
  });
  const queryClient = useQueryClient();
  const toast = useToast();

  // Update localStorage whenever columns change
  React.useEffect(() => {
    localStorage.setItem('contactsVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedFilters = useDebounce(filters, 300);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allContacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  // Real-time subscription for changes
  React.useEffect(() => {
    const unsubscribe = base44.entities.Contact.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const contacts = allContacts.filter(c => showDeleted ? c.deleted : !c.deleted && !c.duplicate_of_id);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 100),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const contact = await base44.entities.Contact.create(data);
      await logActivity(ActivityActions.CREATE, 'Contact', contact.id, `${data.first_name} ${data.last_name}`);
      
      // Create notification for contact addition
      try {
        await base44.functions.invoke('createNotification', {
          user_email: user?.email,
          type: 'contact_added',
          title: `New contact created: ${data.first_name} ${data.last_name}`,
          body: data.company_name || data.job_title || 'Contact added to your database',
          related_entity_type: 'Contact',
          related_entity_id: contact.id,
          actor_email: user?.email,
          actor_name: user?.full_name,
          action_url: `/contacts?id=${contact.id}`,
        });
      } catch (err) {
        console.log('Notification creation skipped');
      }
      
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
          // Find first contact with this company to extract company details
          const contactWithCompany = data.find(row => {
            const name = getFieldValue(row, 'company_name', 'Firm', 'Company', 'Company Name', 'firm', 'organization');
            return name && name.toLowerCase() === nameLower;
          });
          
          const newCompany = await base44.entities.Company.create({
            name: companyName,
            tier: contactWithCompany ? getFieldValue(contactWithCompany, 'tier', 'Tier') : null,
            category: contactWithCompany ? getFieldValue(contactWithCompany, 'category', 'Category') : null,
            country: contactWithCompany ? getFieldValue(contactWithCompany, 'country', 'Country / Region', 'Country') : null,
            hq_city: contactWithCompany ? getFieldValue(contactWithCompany, 'hq_city', 'HQ City') : null,
            website: contactWithCompany ? getFieldValue(contactWithCompany, 'website', 'Website') : null,
            contact_page_url: contactWithCompany ? getFieldValue(contactWithCompany, 'contact_page_url', 'Contact Page URL') : null,
            general_emails: contactWithCompany && getFieldValue(contactWithCompany, 'general_emails', 'General Emails') ? [getFieldValue(contactWithCompany, 'general_emails', 'General Emails')] : [],
            general_phones: contactWithCompany && getFieldValue(contactWithCompany, 'general_phones', 'General Phones') ? [getFieldValue(contactWithCompany, 'general_phones', 'General Phones')] : [],
            contact_sources_urls: contactWithCompany && getFieldValue(contactWithCompany, 'contact_sources_urls', 'Contact Source URLs') ? [getFieldValue(contactWithCompany, 'contact_sources_urls', 'Contact Source URLs')] : [],
            loi_summary: contactWithCompany ? getFieldValue(contactWithCompany, 'loi_summary', 'LOI / MOU Summary') : null,
            loi_source_urls: contactWithCompany && getFieldValue(contactWithCompany, 'loi_source_urls', 'LOI / MOU Source URLs') ? [getFieldValue(contactWithCompany, 'loi_source_urls', 'LOI / MOU Source URLs')] : [],
            notes_angle: contactWithCompany ? getFieldValue(contactWithCompany, 'notes_angle', 'Notes / Angle') : null,
          });
          companyMap[nameLower] = newCompany.id;
        }
      }

      // Create contacts with company_id
       let successCount = 0;
       const failedContacts = [];

       for (const row of data) {
         const companyName = getFieldValue(row, 'company_name', 'Firm', 'Company', 'Company Name', 'firm', 'organization');
         const firstName = getFieldValue(row, 'first_name', 'First Name', 'firstName', 'first', 'name');
         const lastName = getFieldValue(row, 'last_name', 'Last Name', 'lastName', 'last', 'surname');
         const email = getFieldValue(row, 'email', 'Email', 'e-mail', 'Email Address', 'Work Email');

         // Only create if we have at least email or both first name and last name
         if (!email && !(firstName && lastName)) {
           failedContacts.push({
             row,
             reason: 'Missing required fields (need email or both first/last name)'
           });
           continue;
         }

         const contactData = {
           company_name: companyName,
           company_id: companyName ? companyMap[companyName.toLowerCase()] : null,
           first_name: firstName,
           last_name: lastName,
           email: email,
           phone: getFieldValue(row, 'phone', 'Phone', 'Phone 1', 'Phone Number', 'telephone', 'mobile', 'Phone 1'),
           status: getFieldValue(row, 'status', 'Status') || 'lead',
           job_title: getFieldValue(row, 'job_title', 'Job Title', 'Title', 'jobTitle', 'title', 'position', 'role'),
           linkedin_url: getFieldValue(row, 'linkedin_url', 'Linkedin', 'LinkedIn', 'LinkedIn URL', 'linkedin'),
           source: getFieldValue(row, 'source', 'Source') || 'import',
           tier: getFieldValue(row, 'tier', 'Tier'),
           category: getFieldValue(row, 'category', 'Category'),
           country: getFieldValue(row, 'country', 'Country / Region', 'Country'),
           hq_city: getFieldValue(row, 'hq_city', 'HQ City'),
           website: getFieldValue(row, 'website', 'Website'),
           contact_page_url: getFieldValue(row, 'contact_page_url', 'Contact Page URL'),
           general_emails: getFieldValue(row, 'general_emails', 'General Emails') ? [getFieldValue(row, 'general_emails', 'General Emails')] : [],
           general_phones: getFieldValue(row, 'general_phones', 'General Phones') ? [getFieldValue(row, 'general_phones', 'General Phones')] : [],
           contact_sources_urls: getFieldValue(row, 'contact_sources_urls', 'Contact Source URLs') ? [getFieldValue(row, 'contact_sources_urls', 'Contact Source URLs')] : [],
           role_1_title: getFieldValue(row, 'role_1_title', 'Primary Role - Title'),
           role_1_name: getFieldValue(row, 'role_1_name', 'Primary Role - Name'),
           role_1_email: getFieldValue(row, 'role_1_email', 'Primary Role - Email'),
           role_1_phone: getFieldValue(row, 'role_1_phone', 'Primary Role - Phone'),
           role_1_source_url: getFieldValue(row, 'role_1_source_url', 'Primary Role - Source URL'),
           role_2_title: getFieldValue(row, 'role_2_title', 'Secondary Role - Title'),
           role_2_name: getFieldValue(row, 'role_2_name', 'Secondary Role - Name'),
           role_2_email: getFieldValue(row, 'role_2_email', 'Secondary Role - Email'),
           role_2_phone: getFieldValue(row, 'role_2_phone', 'Secondary Role - Phone'),
           role_2_source_url: getFieldValue(row, 'role_2_source_url', 'Secondary Role - Source URL'),
           signer_title: getFieldValue(row, 'signer_title', 'Signer - Title'),
           signer_name: getFieldValue(row, 'signer_name', 'Signer - Name'),
           signer_email: getFieldValue(row, 'signer_email', 'Signer - Email'),
           signer_phone: getFieldValue(row, 'signer_phone', 'Signer - Phone'),
           signer_source_url: getFieldValue(row, 'signer_source_url', 'Signer - Source URL'),
           loi_summary: getFieldValue(row, 'loi_summary', 'LOI / MOU Summary'),
           loi_source_urls: getFieldValue(row, 'loi_source_urls', 'LOI / MOU Source URLs') ? [getFieldValue(row, 'loi_source_urls', 'LOI / MOU Source URLs')] : [],
           notes_angle: getFieldValue(row, 'notes_angle', 'Notes / Angle'),
           notes: getFieldValue(row, 'notes', 'Notes', 'note', 'comments'),
         };

         try {
           await base44.entities.Contact.create(contactData);
           successCount++;
         } catch (err) {
           failedContacts.push({
             row,
             reason: err.message || 'Unknown error'
           });
         }
       }

       await logActivity(ActivityActions.IMPORT, 'Contact', null, null, { count: successCount });
       return { successCount, totalRows: data.length, failedContacts };
      },
      onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      if (result.failedContacts?.length > 0) {
        toast.success(`Imported ${result.successCount} of ${result.totalRows} contacts. ${result.failedContacts.length} failed - check console for details.`);
        console.log('Failed contacts:', result.failedContacts);
      } else {
        toast.success(`Successfully imported ${result.successCount} of ${result.totalRows} contacts`);
      }
      },
    onError: (error) => toast.error('Failed to import contacts: ' + (error?.message || 'Unknown error')),
  });

  const handleSave = async (data) => {
    // Create or update company if company_name is provided
    if (data.company_name && !data.company_id) {
      const existingCompany = companies.find(c => c.name.toLowerCase() === data.company_name.toLowerCase());
      if (existingCompany) {
        data.company_id = existingCompany.id;
      } else {
        // Create new company with contact data
        const newCompany = await base44.entities.Company.create({
          name: data.company_name,
          tier: data.tier || null,
          category: data.category || null,
          country: data.country || null,
          hq_city: data.hq_city || null,
          website: data.website || null,
          contact_page_url: data.contact_page_url || null,
          general_emails: data.general_emails || [],
          general_phones: data.general_phones || [],
          contact_sources_urls: data.contact_sources_urls || [],
          loi_summary: data.loi_summary || null,
          loi_source_urls: data.loi_source_urls || [],
          notes_angle: data.notes_angle || null,
        });
        data.company_id = newCompany.id;
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      }
    }

    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (contact, viewOnly = false) => {
    if (viewOnly) {
      setSelectedContact(contact);
      setShowDetailPanel(true);
    } else {
      setEditingContact(contact);
      setShowModal(true);
    }
  };

  const handleExport = async () => {
    const dataToExport = selectedIds.length > 0 
      ? contacts.filter(c => selectedIds.includes(c.id))
      : filteredContacts;
    
    exportToCSV(dataToExport, 'contacts', [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone 1' },
      { key: 'job_title', label: 'Title' },
      { key: 'linkedin_url', label: 'LinkedIn' },
      { key: 'status', label: 'Status' },
      { key: 'source', label: 'Source' },
      { key: 'company_name', label: 'Firm' },
      { key: 'tier', label: 'Tier' },
      { key: 'category', label: 'Category' },
      { key: 'country', label: 'Country / Region' },
      { key: 'hq_city', label: 'HQ City' },
      { key: 'website', label: 'Website' },
      { key: 'contact_page_url', label: 'Contact Page URL' },
      { key: 'general_emails', label: 'General Emails' },
      { key: 'general_phones', label: 'General Phones' },
      { key: 'contact_sources_urls', label: 'Contact Source URLs' },
      { key: 'role_1_title', label: 'Primary Role - Title' },
      { key: 'role_1_name', label: 'Primary Role - Name' },
      { key: 'role_1_email', label: 'Primary Role - Email' },
      { key: 'role_1_phone', label: 'Primary Role - Phone' },
      { key: 'role_1_source_url', label: 'Primary Role - Source URL' },
      { key: 'role_2_title', label: 'Secondary Role - Title' },
      { key: 'role_2_name', label: 'Secondary Role - Name' },
      { key: 'role_2_email', label: 'Secondary Role - Email' },
      { key: 'role_2_phone', label: 'Secondary Role - Phone' },
      { key: 'role_2_source_url', label: 'Secondary Role - Source URL' },
      { key: 'signer_title', label: 'Signer - Title' },
      { key: 'signer_name', label: 'Signer - Name' },
      { key: 'signer_email', label: 'Signer - Email' },
      { key: 'signer_phone', label: 'Signer - Phone' },
      { key: 'signer_source_url', label: 'Signer - Source URL' },
      { key: 'loi_summary', label: 'LOI / MOU Summary' },
      { key: 'loi_source_urls', label: 'LOI / MOU Source URLs' },
      { key: 'notes_angle', label: 'Notes / Angle' },
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
    let filtered = contacts.filter(contact => {
      const matchesSearch = !debouncedSearch || 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        contact.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      
      const matchesCompany = !debouncedFilters.companyName || 
        contact.company_name?.toLowerCase().includes(debouncedFilters.companyName.toLowerCase());
      
      const matchesEmail = !debouncedFilters.email || 
        contact.email?.toLowerCase().includes(debouncedFilters.email.toLowerCase());
      
      const matchesFirstName = !debouncedFilters.firstName || 
        contact.first_name?.toLowerCase().includes(debouncedFilters.firstName.toLowerCase());
      
      const matchesLastName = !debouncedFilters.lastName || 
        contact.last_name?.toLowerCase().includes(debouncedFilters.lastName.toLowerCase());
      
      const matchesJobTitle = !debouncedFilters.jobTitle ||
        contact.job_title?.toLowerCase().includes(debouncedFilters.jobTitle.toLowerCase());
      
      const matchesTag = !debouncedFilters.tag || 
        contact.tags?.some(tag => tag.toLowerCase().includes(debouncedFilters.tag.toLowerCase()));
      
      const matchesCity = !debouncedFilters.city || 
        contact.city?.toLowerCase().includes(debouncedFilters.city.toLowerCase());
      
      const matchesCountry = !debouncedFilters.country || 
        contact.country?.toLowerCase().includes(debouncedFilters.country.toLowerCase());
      
      const matchesSource = debouncedFilters.source === 'all' || contact.source === debouncedFilters.source;
      
      return matchesSearch && matchesStatus && matchesCompany && matchesEmail && 
             matchesFirstName && matchesLastName && matchesTag && matchesCity && 
             matchesCountry && matchesSource && matchesJobTitle;
    });

    // Sort by selected field
    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      } else if (sortBy === 'company') {
        return (a.company_name || '').localeCompare(b.company_name || '');
      } else if (sortBy === 'created_date') {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      return 0;
    });
  }, [contacts, debouncedSearch, statusFilter, debouncedFilters, sortBy]);

  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getCompany = (companyId) => companies.find(c => c.id === companyId);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, debouncedFilters]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen">
      {/* Duplicate Detection Banner */}
      {allContacts.some(c => c.duplicate_of_id) && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">
            ⚠️ {allContacts.filter(c => c.duplicate_of_id).length} duplicate contacts detected. Use deduplication tool below to merge.
          </p>
        </div>
      )}

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
      <div className="space-y-4">
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
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            variant={showDeleted ? "default" : "outline"}
            onClick={() => setShowDeleted(!showDeleted)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {showDeleted ? 'Active' : 'Trash'}
          </Button>
          {viewMode === 'list' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.name}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, name: checked})}
                >
                  Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.company}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, company: checked})}
                >
                  Company
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.phone}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, phone: checked})}
                >
                  Phone
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.email}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, email: checked})}
                >
                  Email
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.title}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, title: checked})}
                >
                  Job Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.created}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, created: checked})}
                >
                  Created
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.lastActivity}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, lastActivity: checked})}
                >
                  Last Activity
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.tags}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, tags: checked})}
                >
                  Tags
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.status}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, status: checked})}
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.tier}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, tier: checked})}
                >
                  Tier
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.category}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, category: checked})}
                >
                  Category
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.country}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, country: checked})}
                >
                  Country
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.primaryRoleTitle}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, primaryRoleTitle: checked})}
                >
                  Primary Role Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.primaryRoleName}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, primaryRoleName: checked})}
                >
                  Primary Role Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.secondaryRoleTitle}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, secondaryRoleTitle: checked})}
                >
                  Secondary Role Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.secondaryRoleName}
                  onCheckedChange={(checked) => setVisibleColumns({...visibleColumns, secondaryRoleName: checked})}
                >
                  Secondary Role Name
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

        {showFilters && (
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                    companyName: '',
                    email: '',
                    firstName: '',
                    lastName: '',
                    tag: '',
                    city: '',
                    country: '',
                    source: 'all',
                    jobTitle: '',
                  })}
                >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Company Name"
                value={filters.companyName}
                onChange={(e) => setFilters({...filters, companyName: e.target.value})}
              />
              <Input
                placeholder="Email"
                value={filters.email}
                onChange={(e) => setFilters({...filters, email: e.target.value})}
              />
              <Input
                placeholder="First Name"
                value={filters.firstName}
                onChange={(e) => setFilters({...filters, firstName: e.target.value})}
              />
              <Input
                placeholder="Last Name"
                value={filters.lastName}
                onChange={(e) => setFilters({...filters, lastName: e.target.value})}
              />
              <Input
                placeholder="Job Title"
                value={filters.jobTitle}
                onChange={(e) => setFilters({...filters, jobTitle: e.target.value})}
              />
              <Input
                placeholder="Tag"
                value={filters.tag}
                onChange={(e) => setFilters({...filters, tag: e.target.value})}
              />
              <Input
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
              />
              <Input
                placeholder="Country"
                value={filters.country}
                onChange={(e) => setFilters({...filters, country: e.target.value})}
              />
              <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_date">Recently Added</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="company">Company (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
                  <Link to={createPageUrl('ContactDetail') + '?id=' + contact.id}>
                    <ContactCard
                      contact={contact}
                      company={getCompany(contact.company_id)}
                      isSelected={selectedIds.includes(contact.id)}
                    />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        <Checkbox
                          checked={selectedIds.length === paginatedContacts.length && paginatedContacts.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds(paginatedContacts.map(c => c.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      {visibleColumns.name && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>}
                      {visibleColumns.company && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Company</th>}
                      {visibleColumns.phone && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Phone</th>}
                      {visibleColumns.email && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Email</th>}
                      {visibleColumns.title && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Title</th>}
                      {visibleColumns.tier && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Tier</th>}
                      {visibleColumns.category && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Category</th>}
                      {visibleColumns.country && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Country</th>}
                      {visibleColumns.primaryRoleTitle && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Primary Role Title</th>}
                      {visibleColumns.primaryRoleName && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Primary Role Name</th>}
                      {visibleColumns.secondaryRoleTitle && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Secondary Role Title</th>}
                      {visibleColumns.secondaryRoleName && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Secondary Role Name</th>}
                      {visibleColumns.created && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Created</th>}
                      {visibleColumns.lastActivity && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Last Activity</th>}
                      {visibleColumns.tags && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Tags</th>}
                      {visibleColumns.status && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedContacts.map((contact) => (
                      <tr 
                        key={contact.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          window.location.href = createPageUrl('ContactDetail') + '?id=' + contact.id;
                        }}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedIds.includes(contact.id)}
                            onCheckedChange={() => toggleSelect(contact.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        {visibleColumns.name && (
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contact.first_name} {contact.last_name}
                            </div>
                          </td>
                        )}
                        {visibleColumns.company && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.company_name || '-'}
                          </td>
                        )}
                        {visibleColumns.phone && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.phone || '-'}
                          </td>
                        )}
                        {visibleColumns.email && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.email}
                          </td>
                        )}
                        {visibleColumns.title && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.job_title || '-'}
                          </td>
                        )}
                        {visibleColumns.tier && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.tier || '-'}
                          </td>
                        )}
                        {visibleColumns.category && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.category || '-'}
                          </td>
                        )}
                        {visibleColumns.country && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.country || '-'}
                          </td>
                        )}
                        {visibleColumns.primaryRoleTitle && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.role_1_title || '-'}
                          </td>
                        )}
                        {visibleColumns.primaryRoleName && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.role_1_name || '-'}
                          </td>
                        )}
                        {visibleColumns.secondaryRoleTitle && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.role_2_title || '-'}
                          </td>
                        )}
                        {visibleColumns.secondaryRoleName && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.role_2_name || '-'}
                          </td>
                        )}
                        {visibleColumns.created && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(contact.created_date).toLocaleDateString()}
                          </td>
                        )}
                        {visibleColumns.lastActivity && (
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : '-'}
                          </td>
                        )}
                        {visibleColumns.tags && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {contact.tags?.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                  {tag}
                                </span>
                              ))}
                              {contact.tags?.length > 2 && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  +{contact.tags.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              contact.status === 'customer' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                              contact.status === 'prospect' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                              contact.status === 'lead' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                              {contact.status}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Deduplication Tool */}
      {!showDeleted && (
        <ContactDeduplicationTool 
          contacts={allContacts} 
          onDeduped={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
        />
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
       <div className="space-y-4">
         <BulkOwnerAssignment 
           selectedIds={selectedIds} 
           contacts={contacts}
           teamMembers={teamMembers}
         />
         <div className="glass-card p-4 rounded-xl space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <span className="font-semibold text-gray-900 dark:text-white">
                 {selectedIds.length} contact{selectedIds.length !== 1 ? 's' : ''} selected
               </span>
             {selectedIds.length < filteredContacts.length && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setSelectedIds(filteredContacts.map(c => c.id))}
                 className="text-sm text-violet-600 hover:text-violet-700"
               >
                 Select all {filteredContacts.length}
               </Button>
             )}
           </div>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setSelectedIds([])}
             className="text-gray-600 hover:text-gray-700"
           >
             <X className="w-4 h-4" />
           </Button>
         </div>

         <div className="flex flex-wrap gap-3 items-center">
           {!showDeleted && (
             <ContactBulkActionsPanel
               selectedContactIds={selectedIds}
               contacts={contacts}
               user={user}
               onComplete={() => setSelectedIds([])}
             />
           )}
           <Button
             variant="outline"
             size="sm"
             onClick={handleExport}
             className="gap-2"
           >
             <Download className="w-4 h-4" />
             Export
           </Button>
           {showDeleted && selectedIds.length > 0 && (
             <Button
               onClick={() => restoreMutation.mutate(selectedIds)}
               disabled={restoreMutation.isPending}
               className="gap-2 bg-green-600 hover:bg-green-700"
               size="sm"
             >
               <RotateCcw className="w-4 h-4" />
               Restore
             </Button>
           )}
           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowDeleteConfirm(true)}
             className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
           >
             Delete
           </Button>
         </div>
         </div>
         </div>
         )}

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
         optionalFields={['company_name', 'last_name', 'job_title', 'phone', 'linkedin_url', 'status', 'source', 'tier', 'category', 'country', 'hq_city', 'website', 'contact_page_url', 'general_emails', 'general_phones', 'contact_sources_urls', 'role_1_title', 'role_1_name', 'role_1_email', 'role_1_phone', 'role_1_source_url', 'role_2_title', 'role_2_name', 'role_2_email', 'role_2_phone', 'role_2_source_url', 'signer_title', 'signer_name', 'signer_email', 'signer_phone', 'signer_source_url', 'loi_summary', 'loi_source_urls', 'notes_angle', 'notes']}
         sampleData={[
           { company_name: 'Acme Corp', first_name: 'John', last_name: 'Doe', job_title: 'CEO', email: 'john@example.com', phone: '555-1234', linkedin_url: 'https://linkedin.com/in/johndoe', status: 'prospect', source: 'cold_outreach', tier: 'Tier 1', category: 'US Fractional', country: 'USA', hq_city: 'New York', website: 'https://acme.com', contact_page_url: 'https://acme.com/contact', general_emails: 'info@acme.com', general_phones: '555-0123', notes: 'Met at conference' },
           { company_name: 'Tech Inc', first_name: 'Jane', last_name: 'Smith', job_title: 'CTO', email: 'jane@example.com', phone: '555-5678', linkedin_url: 'https://linkedin.com/in/janesmith', status: 'lead', source: 'linkedin', tier: 'Tier 2', category: 'Charter', country: 'USA', hq_city: 'San Francisco', website: 'https://techinc.com', general_emails: 'contact@techinc.com', general_phones: '555-0456', notes: 'Interested in product demo' },
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

      {/* Detail Panel */}
      <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedContact && (
            <ContactDetailPanel contactId={selectedContact.id} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}