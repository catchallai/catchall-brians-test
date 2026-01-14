import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Mail, Send, FileText, Users, Eye, MousePointer, 
  AlertCircle, Loader2, CheckCircle, BarChart3, TrendingUp,
  List, Grid3x3 
} from "lucide-react";
import EmailTemplateCard from '@/components/email/EmailTemplateCard';
import EmailCampaignCard from '@/components/email/EmailCampaignCard';
import EmailTemplateModal from '@/components/modals/EmailTemplateModal';
import EmailCampaignModal from '@/components/modals/EmailCampaignModal';
import DripCampaignModal from '@/components/modals/DripCampaignModal';
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
  const [editingDripCampaign, setEditingDripCampaign] = useState(null);
  const [showDripModal, setShowDripModal] = useState(false);
  const [sendConfirm, setSendConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 100),
  });

  // Create default templates if none exist
  React.useEffect(() => {
    if (!loadingTemplates && templates.length === 0) {
      const defaultTemplates = [
        {
          name: 'Welcome Email',
          subject: 'Welcome to {{company_name}}!',
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Welcome aboard, {{first_name}}!</h1>
  <p>We're thrilled to have you join us. Here's what you can expect:</p>
  <ul>
    <li>Regular updates on new features</li>
    <li>Exclusive tips and best practices</li>
    <li>Priority customer support</li>
  </ul>
  <p>Need help getting started? Check out our <a href="{{help_url}}" style="color: #7c3aed;">help center</a>.</p>
  <p style="margin-top: 30px;">Best regards,<br>The {{company_name}} Team</p>
</div>`,
          category: 'welcome',
          layout: 'branded'
        },
        {
          name: 'Product Update',
          subject: 'New Features Available for {{product_name}}',
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Exciting Product Updates!</h1>
  <p>Hi {{first_name}},</p>
  <p>We've just released some amazing new features we think you'll love:</p>
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">What's New</h3>
    <ul>
      <li><strong>Feature 1:</strong> Brief description here</li>
      <li><strong>Feature 2:</strong> Brief description here</li>
      <li><strong>Feature 3:</strong> Brief description here</li>
    </ul>
  </div>
  <p><a href="{{product_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Learn More</a></p>
  <p style="margin-top: 30px;">Happy to help,<br>{{company_name}}</p>
</div>`,
          category: 'announcement',
          layout: 'branded'
        },
        {
          name: 'Newsletter',
          subject: '{{month}} Newsletter - Top Stories & Updates',
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">{{company_name}} Newsletter</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">{{month}} {{year}}</p>
  </div>
  <div style="padding: 20px;">
    <h2 style="color: #7c3aed;">This Month's Highlights</h2>
    
    <div style="margin: 30px 0;">
      <h3>Article Title 1</h3>
      <p>Brief summary of the article content goes here...</p>
      <a href="{{article_1_url}}" style="color: #7c3aed;">Read more →</a>
    </div>
    
    <div style="margin: 30px 0;">
      <h3>Article Title 2</h3>
      <p>Brief summary of the article content goes here...</p>
      <a href="{{article_2_url}}" style="color: #7c3aed;">Read more →</a>
    </div>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 30px;">
      <p style="margin: 0;"><strong>Quick Tip:</strong> Share your pro tip or insight here.</p>
    </div>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>© {{year}} {{company_name}}. All rights reserved.</p>
  </div>
</div>`,
          category: 'newsletter',
          layout: 'newsletter'
        },
        {
          name: 'Follow-Up',
          subject: 'Following up on our conversation',
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi {{first_name}},</p>
  <p>I wanted to follow up on our recent conversation about {{topic}}.</p>
  <p>Based on what we discussed, I think {{solution}} would be a great fit for your needs because:</p>
  <ul>
    <li>Benefit point 1</li>
    <li>Benefit point 2</li>
    <li>Benefit point 3</li>
  </ul>
  <p>Would you be available for a quick call this week to discuss next steps? You can <a href="{{calendar_link}}" style="color: #7c3aed;">book a time here</a>.</p>
  <p>Looking forward to hearing from you!</p>
  <p style="margin-top: 30px;">Best regards,<br>{{sender_name}}<br>{{company_name}}</p>
</div>`,
          category: 'follow_up',
          layout: 'minimal'
        },
        {
          name: 'Promotional Offer',
          subject: 'Special Offer: {{discount}}% Off {{product_name}}',
          body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 36px;">Special Offer Inside!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Exclusive for {{first_name}}</p>
  </div>
  <div style="padding: 30px 20px; text-align: center;">
    <div style="background: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #f59e0b; margin: 0; font-size: 48px;">{{discount}}% OFF</h2>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Use code: <strong>{{promo_code}}</strong></p>
    </div>
    <p style="font-size: 16px; color: #6b7280;">Valid until {{expiry_date}}</p>
    <p style="margin: 30px 0;"><a href="{{shop_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">Shop Now</a></p>
    <p style="font-size: 14px; color: #9ca3af;">This offer is exclusive to our valued customers.</p>
  </div>
</div>`,
          category: 'promotional',
          layout: 'promotional'
        }
      ];

      defaultTemplates.forEach(template => {
        base44.entities.EmailTemplate.create(template);
      });
    }
  }, [templates, loadingTemplates]);

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

  const { data: dripCampaigns = [], isLoading: loadingDrips } = useQuery({
    queryKey: ['drip-campaigns'],
    queryFn: () => base44.entities.EmailDripCampaign.list('-created_date', 100),
  });

  const { data: emailLogs = [] } = useQuery({
    queryKey: ['email-logs'],
    queryFn: () => base44.entities.EmailLog.list('-created_date', 1000),
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
      // Update campaign status to sending
      await base44.entities.EmailCampaign.update(emailCampaign.id, { status: 'sending' });
      
      // Call Resend backend function
      const response = await base44.functions.invoke('sendCampaignEmail', {
        campaignId: emailCampaign.id
      });
      
      return response.data;
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

  const createDripMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailDripCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drip-campaigns'] });
      setShowDripModal(false);
      setEditingDripCampaign(null);
    },
  });

  const updateDripMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailDripCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drip-campaigns'] });
      setShowDripModal(false);
      setEditingDripCampaign(null);
    },
  });

  const toggleDripMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EmailDripCampaign.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drip-campaigns'] });
    },
  });

  const handleSaveDrip = (data) => {
    if (editingDripCampaign) {
      updateDripMutation.mutate({ id: editingDripCampaign.id, data });
    } else {
      createDripMutation.mutate(data);
    }
  };

  const totalSent = emailCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
  const totalOpened = emailCampaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
  const totalClicked = emailCampaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);
  const overallOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const overallClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  const isLoading = loadingTemplates || loadingCampaigns || loadingDrips;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
        <p className="text-gray-500 mt-1">Create templates and send email campaigns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
            <p className="text-sm text-gray-500">Emails Sent</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{overallOpenRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Open Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <MousePointer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{overallClickRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Click Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
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
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="drips">Drip Campaigns</TabsTrigger>
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

        <TabsContent value="statistics" className="space-y-6">
          {/* Engagement Summary */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Opens</span>
                    <span className="font-medium text-gray-900 dark:text-white">{totalOpened}</span>
                  </div>
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-violet-500" 
                      style={{ width: `${totalSent > 0 ? (totalOpened / totalSent) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Clicks</span>
                    <span className="font-medium text-gray-900 dark:text-white">{totalClicked}</span>
                  </div>
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${totalSent > 0 ? (totalClicked / totalSent) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Bounced</span>
                    <span className="font-medium text-gray-900 dark:text-white">{emailCampaigns.reduce((sum, c) => sum + (c.total_bounced || 0), 0)}</span>
                  </div>
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${totalSent > 0 ? (emailCampaigns.reduce((sum, c) => sum + (c.total_bounced || 0), 0) / totalSent) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{emailCampaigns.length}</div>
                  <div className="text-sm text-gray-500">Campaigns Sent</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalOpened}</div>
                  <div className="text-sm text-gray-500">Total Opens</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalClicked}</div>
                  <div className="text-sm text-gray-500">Total Clicks</div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{emailCampaigns.reduce((sum, c) => sum + (c.total_bounced || 0), 0)}</div>
                  <div className="text-sm text-gray-500">Bounces</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Open Rate Chart */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Open Rate Over Time</h3>
                <div className="text-3xl font-bold text-violet-600">{overallOpenRate.toFixed(2)}%</div>
              </div>
              <div className="h-64 flex items-end justify-between gap-2">
                {emailCampaigns.slice(0, 10).reverse().map((campaign, idx) => {
                  const campaignOpenRate = campaign.total_sent > 0 ? (campaign.total_opened / campaign.total_sent) * 100 : 0;
                  return (
                    <div key={campaign.id} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-violet-500 rounded-t-lg hover:bg-violet-600 transition-colors cursor-pointer relative group"
                        style={{ height: `${campaignOpenRate * 2.5}%`, minHeight: campaignOpenRate > 0 ? '4px' : '0' }}
                        title={`${campaign.name}: ${campaignOpenRate.toFixed(1)}%`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {campaignOpenRate.toFixed(1)}%
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left mt-2">{campaign.name?.slice(0, 8)}...</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Emails */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Emails</h3>
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
              </div>
              
              {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Campaign</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Sent</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Opens</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Open Rate</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Clicks</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Click Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailCampaigns
                      .filter(c => c.total_sent > 0)
                      .sort((a, b) => {
                        const aRate = (a.total_opened / a.total_sent) * 100;
                        const bRate = (b.total_opened / b.total_sent) * 100;
                        return bRate - aRate;
                      })
                      .slice(0, 10)
                      .map((campaign) => {
                        const openRate = campaign.total_sent > 0 ? (campaign.total_opened / campaign.total_sent) * 100 : 0;
                        const clickRate = campaign.total_sent > 0 ? (campaign.total_clicked / campaign.total_sent) * 100 : 0;
                        return (
                          <tr key={campaign.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                              <div className="text-xs text-gray-500">{templates.find(t => t.id === campaign.template_id)?.name}</div>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{campaign.total_sent}</td>
                            <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{campaign.total_opened}</td>
                            <td className="text-right py-3 px-4">
                              <span className="text-emerald-600 font-medium">{openRate.toFixed(1)}%</span>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-900 dark:text-white">{campaign.total_clicked}</td>
                            <td className="text-right py-3 px-4">
                              <span className="text-blue-600 font-medium">{clickRate.toFixed(1)}%</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {emailCampaigns.filter(c => c.total_sent > 0).length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No campaign data yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Send some campaigns to see statistics</p>
                  </div>
                )}
              </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emailCampaigns
                  .filter(c => c.total_sent > 0)
                  .sort((a, b) => {
                    const aRate = (a.total_opened / a.total_sent) * 100;
                    const bRate = (b.total_opened / b.total_sent) * 100;
                    return bRate - aRate;
                  })
                  .slice(0, 10)
                  .map((campaign) => {
                    const openRate = campaign.total_sent > 0 ? (campaign.total_opened / campaign.total_sent) * 100 : 0;
                    const clickRate = campaign.total_sent > 0 ? (campaign.total_clicked / campaign.total_sent) * 100 : 0;
                    return (
                      <Card key={campaign.id} className="glass-card hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h4>
                            <p className="text-xs text-gray-500">{templates.find(t => t.id === campaign.template_id)?.name}</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sent:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{campaign.total_sent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Opens:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{campaign.total_opened}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Open Rate:</span>
                              <span className="font-medium text-emerald-600">{openRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Clicks:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{campaign.total_clicked}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Click Rate:</span>
                              <span className="font-medium text-blue-600">{clickRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                {emailCampaigns.filter(c => c.total_sent > 0).length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No campaign data yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Send some campaigns to see statistics</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drips" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingDripCampaign(null); setShowDripModal(true); }} 
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New Drip Campaign
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : dripCampaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No drip campaigns"
              description="Create automated email sequences that nurture contacts over time."
              actionLabel="Create Drip Campaign"
              onAction={() => { setEditingDripCampaign(null); setShowDripModal(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dripCampaigns.map((drip) => (
                <Card key={drip.id} className="glass-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditingDripCampaign(drip); setShowDripModal(true); }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{drip.name}</h3>
                          <p className="text-xs text-gray-500">{drip.emails?.length || 0} emails</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={drip.status === 'active' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDripMutation.mutate({
                            id: drip.id,
                            status: drip.status === 'active' ? 'paused' : 'active'
                          });
                        }}
                        className="text-xs"
                      >
                        {drip.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trigger:</span>
                        <span className="text-gray-900 dark:text-white">{drip.trigger_type?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Enrolled:</span>
                        <span className="text-gray-900 dark:text-white">{drip.enrolled_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed:</span>
                        <span className="text-gray-900 dark:text-white">{drip.completed_count || 0}</span>
                      </div>
                      {(drip.open_rate > 0 || drip.click_rate > 0) && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Open Rate:</span>
                            <span className="text-emerald-600">{drip.open_rate?.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Click Rate:</span>
                            <span className="text-blue-600">{drip.click_rate?.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

      <DripCampaignModal
        open={showDripModal}
        onClose={() => { setShowDripModal(false); setEditingDripCampaign(null); }}
        dripCampaign={editingDripCampaign}
        templates={templates}
        onSave={handleSaveDrip}
        isLoading={createDripMutation.isPending || updateDripMutation.isPending}
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