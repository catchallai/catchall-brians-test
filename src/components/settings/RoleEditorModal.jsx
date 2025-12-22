import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoleEditorModal({ role, open, onClose, modules }) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState(role?.permissions || {});
  const queryClient = useQueryClient();

  useEffect(() => {
    setName(role?.name || '');
    setDescription(role?.description || '');
    setPermissions(role?.permissions || {});
  }, [role]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (role) {
        return base44.entities.Role.update(role.id, data);
      }
      return base44.entities.Role.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
  });

  const togglePermission = (moduleId, permission) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [permission]: !(prev[moduleId]?.[permission])
      }
    }));
  };

  const handleSubmit = () => {
    saveMutation.mutate({
      name,
      description,
      permissions,
      is_system_role: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create Role'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
          <div>
            <Label>Role Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Manager"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this role..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="mb-3 block">Permissions</Label>
            <div className="space-y-3">
              {modules.map(module => (
                <Card key={module.id} className="p-4">
                  <h4 className="font-semibold text-sm mb-3">{module.label}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {module.permissions.map(perm => (
                      <div key={perm} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.id}-${perm}`}
                          checked={permissions[module.id]?.[perm] || false}
                          onCheckedChange={() => togglePermission(module.id, perm)}
                        />
                        <label
                          htmlFor={`${module.id}-${perm}`}
                          className="text-sm capitalize cursor-pointer"
                        >
                          {perm}
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || saveMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saveMutation.isPending ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}