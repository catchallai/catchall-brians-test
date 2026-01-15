import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, Building2, Target, FileText, Mail, Calendar, Zap, TrendingUp, ArrowRight
} from "lucide-react";

export default function CRMDashboard() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date', 200),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const isLoading = loadingContacts || loadingCompanies || loadingOpportunities || loadingDeals;

  const stats = {
    contacts: {
      total: contacts.length,
      leads: contacts.filter(c => c.status === 'lead').length,
      customers: contacts.filter(c => c.status === 'customer').length,
    },
    companies: companies.length,
    opportunities: {
      total: opportunities.length,
      open: opportunities.filter(o => o.status === 'open').length,
    },
    pipeline: deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length,
  };

  const quickLinks = [
    { name: 'Contacts', icon: Users, page: 'Contacts', count: stats.contacts.total, color: 'blue' },
    { name: 'Companies', icon: Building2, page: 'Companies', count: stats.companies, color: 'violet' },
    { name: 'Opportunities', icon: Target, page: 'Opportunities', count: stats.opportunities.total, color: 'emerald' },
    { name: 'Pipeline', icon: Target, page: 'Deals', count: stats.pipeline, color: 'amber' },
    { name: 'Email Marketing', icon: Mail, page: 'EmailMarketing', color: 'cyan' },
    { name: 'Activities', icon: Calendar, page: 'Activities', color: 'pink' },
    { name: 'Automation', icon: Zap, page: 'Automation', color: 'indigo' },
    { name: 'Marketing Hub', icon: TrendingUp, page: 'MarketingHub', color: 'green' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">CRM</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customer relationship management overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.contacts.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.contacts.leads} leads, {stats.contacts.customers} customers</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Companies</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.companies}</p>
              </div>
              <Building2 className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opportunities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.opportunities.total}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.opportunities.open} open</p>
              </div>
              <Target className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Pipeline</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pipeline}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.page} to={createPageUrl(link.page)}>
                <Card className="glass-card hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-${link.color}-100 dark:bg-${link.color}-900/40 flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${link.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{link.name}</h3>
                          {link.count !== undefined && (
                            <p className="text-sm text-gray-500">{link.count} items</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}