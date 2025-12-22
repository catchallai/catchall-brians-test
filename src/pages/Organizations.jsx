import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, Settings } from "lucide-react";
import OrganizationModal from '@/components/modals/OrganizationModal';
import EmptyState from '@/components/ui/EmptyState';

export default function Organizations() {
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date', 100),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const filtered = organizations.filter(org =>
    org.name?.toLowerCase().includes(search.toLowerCase()) ||
    org.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const getMemberCount = (orgId) => 
    teamMembers.filter(m => m.organization_id === orgId).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-500 mt-1">Manage client organizations you provide CatchAll services to</p>
        </div>
        <Button onClick={() => { setEditingOrg(null); setShowModal(true); }} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          New Organization
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first client organization to start managing their CatchAll services."
          actionLabel="New Organization"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((org) => (
            <Card
              key={org.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => { setEditingOrg(org); setShowModal(true); }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: org.primary_color || '#7c3aed' }}
                >
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    org.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-sm text-gray-500">{org.slug}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={
                      org.status === 'active' ? 'bg-green-100 text-green-700' :
                      org.status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {org.status}
                    </Badge>
                    <Badge variant="outline">{org.plan}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                <span>{getMemberCount(org.id)} team members</span>
                {org.domain && <span>{org.domain}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <OrganizationModal
        organization={editingOrg}
        open={showModal}
        onClose={() => { setShowModal(false); setEditingOrg(null); }}
      />
    </div>
  );
}