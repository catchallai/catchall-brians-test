import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Linkedin, Calendar, Building2, BriefcaseIcon, Edit2, MapPin, Globe, Link2, FileText, Users, MessageSquare, Send, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ContactModal from '@/components/modals/ContactModal';
import EmailContactModal from '@/components/modals/EmailContactModal';
import EmailTrackingPanel from '@/components/crm/EmailTrackingPanel';
import ActivityFeed from '@/components/collaboration/ActivityFeed';

const urlParams = new URLSearchParams(window.location.search);
const contactId = urlParams.get('id');

export default function ContactDetail() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contact, isLoading: loadingContact, refetch } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const result = await base44.entities.Contact.filter({ id: contactId });
      return result[0];
    },
    enabled: !!contactId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Company.filter({ business_id: user.current_business_id });
    },
    enabled: !!user?.current_business_id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return [];
      return await base44.entities.Activity.filter({
        entity_type: 'contact',
        entity_id: contact.id,
      }, '-created_date', 50);
    },
    enabled: !!contact?.id,
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['contact-notes', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return [];
      return await base44.entities.ContactNote.filter({ contact_id: contact.id }, '-created_date');
    },
    enabled: !!contact?.id,
  });

  const [newNote, setNewNote] = useState('');
  const [selectedCompanyForAdd, setSelectedCompanyForAdd] = useState('');

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await base44.entities.Task.create(taskData);
    },
    onSuccess: () => {
      setTaskTitle('');
      setShowTaskForm(false);
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
    },
  });

  const associatedCompanies = contact?.company_ids?.length 
    ? companies.filter(c => contact.company_ids.includes(c.id))
    : contact?.company_id 
      ? companies.filter(c => c.id === contact.company_id)
      : [];

  const statusColors = {
    lead: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    customer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    churned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const sourceColors = {
    website: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    referral: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    linkedin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    cold_outreach: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    event: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    import: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  if (loadingContact) {
    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6">
        <Link to={createPageUrl('Contacts')}>
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Contacts
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Contact not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to={createPageUrl('Contacts')}>
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {contact.first_name?.[0]}{contact.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.job_title && (
                <p className="text-gray-500 mt-1">{contact.job_title}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge className={statusColors[contact.status]}>
                  {contact.status}
                </Badge>
                {contact.source && (
                  <Badge className={sourceColors[contact.source]}>
                    {contact.source.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEmailModal(true)} variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            Send Email
          </Button>
          <Button onClick={() => setShowEditModal(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Edit2 className="w-4 h-4" />
            Edit Contact
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            <div className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${contact.email}`} className="text-violet-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${contact.phone}`} className="text-violet-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.linkedin_url && (
                <div className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-gray-400" />
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {contact.last_contacted && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Last contacted: {new Date(contact.last_contacted).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Company Information */}
          {(contact.company_name || contact.website || contact.country || contact.hq_city) && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>
              <div className="space-y-4">
                {contact.company_name && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{contact.company_name}</span>
                  </div>
                )}
                {contact.tier && (
                  <div className="flex items-center gap-3">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                    <Badge variant="secondary">{contact.tier}</Badge>
                  </div>
                )}
                {contact.category && contact.category.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex flex-wrap gap-1">
                      {contact.category.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(contact.country || contact.hq_city) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {[contact.hq_city, contact.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                      {contact.website}
                    </a>
                  </div>
                )}
                {contact.contact_page_url && (
                  <div className="flex items-center gap-3">
                    <Link2 className="w-5 h-5 text-gray-400" />
                    <a href={contact.contact_page_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline text-sm">
                      Contact Page
                    </a>
                  </div>
                )}
                {contact.general_emails && contact.general_emails.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 mb-1">General Emails:</p>
                      {contact.general_emails.map((email, i) => (
                        <a key={i} href={`mailto:${email}`} className="block text-sm text-violet-600 hover:underline">
                          {email}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {contact.general_phones && contact.general_phones.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 mb-1">General Phones:</p>
                      {contact.general_phones.map((phone, i) => (
                        <a key={i} href={`tel:${phone}`} className="block text-sm text-violet-600 hover:underline">
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Key Roles */}
          {(contact.role_1_name || contact.role_2_name || contact.signer_name) && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Key Roles</h2>
              <div className="space-y-6">
                {contact.role_1_name && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {contact.role_1_title || 'Primary Role'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">{contact.role_1_name}</p>
                      {contact.role_1_email && (
                        <a href={`mailto:${contact.role_1_email}`} className="block text-violet-600 hover:underline">
                          {contact.role_1_email}
                        </a>
                      )}
                      {contact.role_1_phone && (
                        <a href={`tel:${contact.role_1_phone}`} className="block text-violet-600 hover:underline">
                          {contact.role_1_phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {contact.role_2_name && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {contact.role_2_title || 'Secondary Role'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">{contact.role_2_name}</p>
                      {contact.role_2_email && (
                        <a href={`mailto:${contact.role_2_email}`} className="block text-violet-600 hover:underline">
                          {contact.role_2_email}
                        </a>
                      )}
                      {contact.role_2_phone && (
                        <a href={`tel:${contact.role_2_phone}`} className="block text-violet-600 hover:underline">
                          {contact.role_2_phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {contact.signer_name && (
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {contact.signer_title || 'Signer / Exec Sponsor'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700 dark:text-gray-300">{contact.signer_name}</p>
                      {contact.signer_email && (
                        <a href={`mailto:${contact.signer_email}`} className="block text-violet-600 hover:underline">
                          {contact.signer_email}
                        </a>
                      )}
                      {contact.signer_phone && (
                        <a href={`tel:${contact.signer_phone}`} className="block text-violet-600 hover:underline">
                          {contact.signer_phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* LOI/MOU Information */}
          {(contact.loi_summary || (contact.loi_source_urls && contact.loi_source_urls.length > 0)) && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                LOI / MOU / Prior Orders
              </h2>
              {contact.loi_summary && (
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 whitespace-pre-wrap">
                  {contact.loi_summary}
                </p>
              )}
              {contact.loi_source_urls && contact.loi_source_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Source URLs:</p>
                  {contact.loi_source_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-violet-600 hover:underline truncate"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Notes & Angle */}
          {contact.notes_angle && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Notes / Angle</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                {contact.notes_angle}
              </p>
            </Card>
          )}

          {/* Contact Sources */}
          {contact.contact_sources_urls && contact.contact_sources_urls.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Contact Sources
              </h2>
              <div className="space-y-2">
                {contact.contact_sources_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-violet-600 hover:underline truncate"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Associated Companies */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Associated Companies ({associatedCompanies.length})
              </h2>
              <Button size="sm" variant="outline" onClick={() => setShowAddCompanyModal(true)} className="gap-1">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            {associatedCompanies.length > 0 ? (
              <div className="space-y-3">
                {associatedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start justify-between group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <Link
                      to={createPageUrl('Companies')}
                      className="flex-1"
                    >
                      <div className="font-medium text-gray-900 dark:text-white hover:text-violet-600">{company.name}</div>
                      {company.industry && (
                        <div className="text-sm text-gray-500">{company.industry}</div>
                      )}
                    </Link>
                    <button
                      onClick={() => {
                        const newCompanyIds = (contact.company_ids || []).filter(id => id !== company.id);
                        base44.entities.Contact.update(contact.id, { company_ids: newCompanyIds });
                        queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                      title="Remove association"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No associated companies</p>
            )}

            {/* Add Company Modal */}
            {showAddCompanyModal && (
              <div className="mt-4 space-y-3">
                <Select value={selectedCompanyForAdd} onValueChange={setSelectedCompanyForAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.filter(c => !associatedCompanies.find(ac => ac.id === c.id)).map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => {
                      if (selectedCompanyForAdd) {
                        const newCompanyIds = [...(contact.company_ids || []), selectedCompanyForAdd];
                        base44.entities.Contact.update(contact.id, { company_ids: newCompanyIds });
                        queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
                        setShowAddCompanyModal(false);
                        setSelectedCompanyForAdd('');
                      }
                    }}
                    disabled={!selectedCompanyForAdd}
                    className="flex-1"
                  >
                    Add Company
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddCompanyModal(false);
                      setSelectedCompanyForAdd('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Notes</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{contact.notes}</p>
            </Card>
          )}

          {/* Email Tracking */}
          <EmailTrackingPanel contactId={contact.id} />

          {/* Activity Feed */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title || activity.activity_type}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No activities yet</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-2">Status</p>
                <Select value={contact.status} onValueChange={(newStatus) => {
                  base44.entities.Contact.update(contact.id, { status: newStatus });
                  queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
                }}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{contact.source || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Added</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(contact.created_date).toLocaleDateString()}
                </p>
              </div>
              {contact.enriched && (
                <div>
                  <p className="text-gray-500">Data Enriched</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(contact.enriched_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {contact.tags?.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <Badge key={tag} className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Follow-up Tasks */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Follow-up Task</h3>
            {showTaskForm ? (
              <div className="space-y-3">
                <textarea
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Create a follow-up task..."
                  className="w-full p-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (taskTitle.trim()) {
                        createTaskMutation.mutate({
                          title: taskTitle,
                          contact_id: contact.id,
                          status: 'open',
                          priority: 'medium',
                        });
                      }
                    }}
                    disabled={!taskTitle.trim()}
                    className="flex-1"
                  >
                    Create Task
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowTaskForm(false);
                      setTaskTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowTaskForm(true)}
              >
                + Create Follow-up Task
              </Button>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Team Notes ({notes.length})
            </h3>
            
            {/* Add Note */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note to share with team..."
                className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
              <Button
                onClick={async () => {
                  if (!newNote.trim()) return;
                  await base44.entities.ContactNote.create({
                    contact_id: contact.id,
                    note: newNote,
                    author_name: user?.full_name || user?.email,
                    author_email: user?.email,
                  });
                  setNewNote('');
                  refetchNotes();
                }}
                disabled={!newNote.trim()}
                className="mt-2 w-full"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>

            {/* Notes List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {note.author_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {note.note}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No notes yet. Add the first note above.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <ContactModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        contact={contact}
        companies={companies}
        onSave={async (data) => {
          await base44.entities.Contact.update(contact.id, data);
          refetch();
          setShowEditModal(false);
        }}
        isLoading={false}
        allowMultipleCompanies={true}
      />

      {/* Email Modal */}
      <EmailContactModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        contact={contact}
        businessId={user?.current_business_id}
      />
    </div>
  );
}