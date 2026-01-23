import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Linkedin, Calendar, Building2, BriefcaseIcon, Edit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ContactModal from '@/components/modals/ContactModal';
import ActivityFeed from '@/components/collaboration/ActivityFeed';

const urlParams = new URLSearchParams(window.location.search);
const contactId = urlParams.get('id');

export default function ContactDetail() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

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
        <Button onClick={() => setShowEditModal(true)} className="gap-2">
          <Edit2 className="w-4 h-4" />
          Edit Contact
        </Button>
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

          {/* Associated Companies */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Associated Companies ({associatedCompanies.length})
            </h2>
            {associatedCompanies.length > 0 ? (
              <div className="space-y-3">
                {associatedCompanies.map((company) => (
                  <Link
                    key={company.id}
                    to={createPageUrl('Companies')}
                    className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                    {company.industry && (
                      <div className="text-sm text-gray-500">{company.industry}</div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No associated companies</p>
            )}
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Notes</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{contact.notes}</p>
            </Card>
          )}

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
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{contact.status}</p>
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
    </div>
  );
}