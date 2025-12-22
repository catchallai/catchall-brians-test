import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Search, Trash2, Edit } from "lucide-react";
import InviteMemberModal from './InviteMemberModal';
import EditMemberModal from './EditMemberModal';

export default function TeamManagement() {
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list('-joined_date', 100),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const filteredMembers = members.filter(m =>
    m.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    m.role_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || 'N/A';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-semibold">Team Members</h2>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-violet-100 text-violet-600">
                    {member.user_name?.[0] || member.user_email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {member.user_name || member.user_email}
                  </h4>
                  <p className="text-sm text-gray-500">{member.user_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{member.role_name}</Badge>
                    {member.brand_id && (
                      <Badge variant="secondary">{getBrandName(member.brand_id)}</Badge>
                    )}
                    <Badge className={
                      member.status === 'active' ? 'bg-green-100 text-green-700' :
                      member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingMember(member)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(member.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredMembers.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No team members found</p>
          </Card>
        )}
      </div>

      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
      />

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          open={!!editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}
    </div>
  );
}