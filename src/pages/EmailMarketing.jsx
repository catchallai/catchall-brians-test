import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Mail, Send, FileText, Users, Eye, MousePointer, 
  AlertCircle, Loader2, CheckCircle 
} from "lucide-react";
import EmailTemplateCard from '@/components/email/EmailTemplateCard';
import EmailCampaignCard from '@/components/email/EmailCampaignCard';
import EmailTemplateModal from '@/components/modals/EmailTemplateModal';
import EmailCampaignModal from '@/components/modals/EmailCampaignModal';
import EmptyState from '@/components/ui/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EmailMarketing() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [sendConfirm, setSendConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 100),
  });

  const { data: emailCampaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => base44.entities.EmailCampaign.list('-created_date', 100),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 200),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowTemplateModal(false);
      setEditingTemplate(null);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowTemplateModal(false);
      setEditingTemplate(null);
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowCampaignModal(false);
      setEditingCampaign(null);
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setShowCampaignModal(false);
      setEditingCampaign(null);
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (emailCampaign) => {
      const template = templates.find(t => t.id === emailCampaign.template_id);
      const recipientContacts = contacts.filter(c => emailCampaign.contact_ids?.includes(c.id));
      
      // Update campaign status to sending
      await base44.entities.EmailCampaign.update(emailCampaign.id, { status: 'sending' });
      
      let sentCount = 0;
      for (const contact of recipientContacts) {
        const personalizedSubject = template.subject
          .replace(/\{\{first_name\}\}/g, contact.first_name || '')
          .replace(/\{\{last_name\}\}/g, contact.last_name || '');
        
        const personalizedBody = template.body
          .replace(/\{\{first_name\}\}/g, contact.first_name || '')
          .replace(/\{\{last_name\}\}/g, contact.last_name || '');
        
        await base44.integrations.Core.SendEmail({
          to: contact.email,
          subject: personalizedSubject,
          body: personalizedBody,
        });
        
        await base44.entities.EmailLog.create({
          email_campaign_id: emailCampaign.id,
          contact_id: contact.id,
          recipient_email: contact.email,
          status: 'sent',
        });
        
        sentCount++;
      }
      
      await base44.entities.EmailCampaign.update(emailCampaign.id, {
        status: 'sent',
        sent_date: new Date().toISOString(),
        total_sent: sentCount,
      });
      
      return { sentCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setSendConfirm(null);
    },
  });

  const handleSaveTemplate = (data) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleSaveCampaign = (data) => {
    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createCampaignMutation.mutate(data);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowCampaignModal(true);
  };

  const totalSent = emailCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
  const totalOpened = emailCampaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
  const totalClicked = emailCampaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);
  const overallOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const overallClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  const isLoading = loadingTemplates || loadingCampaigns;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
        <p className="text-gray-500 mt-1">Create templates and send email campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
            <p className="text-sm text-gray-500">Emails Sent</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{overallOpenRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Open Rate</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <MousePointer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{overallClickRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Click Rate</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            <p className="text-sm text-gray-500">Templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingCampaign(null); setShowCampaignModal(true); }} 
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              disabled={templates.length === 0}
            >
              <Plus className="w-4 h-4" />
              New Email Campaign
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : emailCampaigns.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No email campaigns"
              description={templates.length === 0 
                ? "Create an email template first, then create your campaign."
                : "Create your first email campaign to start reaching your contacts."
              }
              actionLabel={templates.length > 0 ? "Create Campaign" : undefined}
              onAction={templates.length > 0 ? () => { setEditingCampaign(null); setShowCampaignModal(true); } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emailCampaigns.map((emailCampaign) => (
                <div key={emailCampaign.id} className="relative">
                  <EmailCampaignCard
                    emailCampaign={emailCampaign}
                    template={templates.find(t => t.id === emailCampaign.template_id)}
                    onClick={() => handleEditCampaign(emailCampaign)}
                  />
                  {emailCampaign.status === 'draft' && emailCampaign.contact_ids?.length > 0 && (
                    <Button
                      size="sm"
                      className="absolute bottom-4 right-4 gap-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={(e) => { e.stopPropagation(); setSendConfirm(emailCampaign); }}
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }} 
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No email templates"
              description="Create reusable email templates for your campaigns."
              actionLabel="Create Template"
              onAction={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <EmailTemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleEditTemplate(template)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EmailTemplateModal
        open={showTemplateModal}
        onClose={() => { setShowTemplateModal(false); setEditingTemplate(null); }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
      />

      <EmailCampaignModal
        open={showCampaignModal}
        onClose={() => { setShowCampaignModal(false); setEditingCampaign(null); }}
        emailCampaign={editingCampaign}
        templates={templates}
        campaigns={campaigns}
        contacts={contacts}
        onSave={handleSaveCampaign}
        isLoading={createCampaignMutation.isPending || updateCampaignMutation.isPending}
      />

      {/* Send Confirmation Dialog */}
      <AlertDialog open={!!sendConfirm} onOpenChange={() => setSendConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Email Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send emails to {sendConfirm?.contact_ids?.length || 0} contacts. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendCampaignMutation.mutate(sendConfirm)}
              disabled={sendCampaignMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {sendCampaignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}