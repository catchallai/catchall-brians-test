import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditMemberModal({ member, open, onClose }) {
  const [roleId, setRoleId] = useState(member.role_id);
  const [brandId, setBrandId] = useState(member.brand_id || '');
  const [status, setStatus] = useState(member.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    setRoleId(member.role_id);
    setBrandId(member.brand_id || '');
    setStatus(member.status);
  }, [member]);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.update(member.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    const selectedRole = roles.find(r => r.id === roleId);
    updateMutation.mutate({
      role_id: roleId,
      role_name: selectedRole?.name,
      brand_id: brandId || null,
      status
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {member.user_email}
            </div>
          </div>

          <div>
            <Label>Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Brand</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No brand</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}