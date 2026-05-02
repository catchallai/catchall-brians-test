import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import DataRoomModal from '@/components/modals/DataRoomModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import {
  FolderOpen,
  Plus,
  Send,
  Eye,
  Trash2,
  Edit,
  FileText,
  Mail,
  Calendar,
  Copy,
  Share2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortalUserManagement from '@/components/dataroom/PortalUserManagement';
import PortalSettings from '@/components/dataroom/PortalSettings';

export default function DataRooms() {
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [sendingRoom, setSendingRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomForPortal, setSelectedRoomForPortal] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dataRooms = [], isLoading } = useQuery({
    queryKey: ['data-rooms'],
    queryFn: async () => {
      const rooms = await base44.entities.DataRoom.filter(
        { business_id: user?.business_id },
        '-created_date'
      );
      return rooms;
    },
    enabled: !!user,
  });

  const { data: portals = [] } = useQuery({
    queryKey: ['dataroom-portals', selectedRoomForPortal?.id],
    queryFn: () =>
      base44.entities.DataRoomPortal.filter({
        dataroom_id: selectedRoomForPortal?.id,
      }),
    enabled: !!selectedRoomForPortal?.id,
  });

  const createPortalMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createDataRoomPortal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataroom-portals', selectedRoomForPortal?.id] });
      toast.success('External portal created');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.DataRoom.create({
        ...data,
        business_id: user?.business_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      setShowModal(false);
      setEditingRoom(null);
      toast.success('Data room created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataRoom.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      setShowModal(false);
      setEditingRoom(null);
      toast.success('Data room updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataRoom.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      setDeleteRoom(null);
      toast.success('Data room deleted');
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (room) => {
      const response = await base44.functions.invoke('sendResendEmail', {
        to: room.recipient_email,
        subject: `Access to ${room.name} Data Room`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">📁 ${room.name}</h2>
            <p>Hi ${room.recipient_name},</p>
            <p>You've been granted access to a secure data room:</p>
            <p><strong>${room.description || room.name}</strong></p>
            <p>${room.document_ids?.length || 0} document(s) available</p>
            <p style="margin: 30px 0;">
              <a href="${room.share_link}" 
                 style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Data Room
              </a>
            </p>
            ${room.access_password ? '<p style="color: #666; font-size: 14px;">🔒 This data room is password protected.</p>' : ''}
            <p style="color: #666; font-size: 14px;">Access expires: ${new Date(room.expires_at).toLocaleDateString()}</p>
            <p>Best regards,<br/>${user?.full_name || 'The Team'}</p>
          </div>
        `,
      });

      if (!response.data.success) {
        throw new Error('Failed to send invitation');
      }

      return await base44.entities.DataRoom.update(room.id, {
        status: 'active',
        resend_email_id: response.data.emailId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-rooms'] });
      setSendingRoom(null);
      toast.success('Invitation sent');
    },
  });

  const handleCopyLink = (shareLink) => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied to clipboard');
  };

  const filteredRooms = dataRooms.filter(
    (room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.draft;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Rooms</h1>
          <p className="text-gray-500 dark:text-gray-400">Secure document collections</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Data Room
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search data rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {selectedRoomForPortal ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedRoomForPortal(null)}>
            ← Back to Data Rooms
          </Button>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">
              {selectedRoomForPortal.name} - External Portal Management
            </h2>
            <Tabs defaultValue="portals" className="space-y-4">
              <TabsList>
                <TabsTrigger value="portals">Portals</TabsTrigger>
              </TabsList>
              <TabsContent value="portals">
                {portals.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No external portals yet. Create one to allow vendors to access files.
                    </p>
                    <Button
                      onClick={() =>
                        createPortalMutation.mutate({
                          dataroom_id: selectedRoomForPortal.id,
                          name: `${selectedRoomForPortal.name} - External Portal`,
                          allow_upload: true,
                          allow_download: true,
                        })
                      }
                      disabled={createPortalMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Portal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {portals.map((portal) => (
                      <Card key={portal.id} className="p-4">
                        <PortalUserManagement
                          portalId={portal.id}
                          portalAccessCode={portal.access_code}
                        />
                        <div className="mt-4 pt-4 border-t">
                          <PortalSettings portal={portal} portalId={portal.id} />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          Icon={FolderOpen}
          title="No data rooms"
          description="Create a data room to organize and share multiple documents"
          actionLabel="Create Data Room"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-violet-600" />
                      {room.name}
                    </CardTitle>
                    <Badge className={`mt-2 ${getStatusColor(room.status)}`}>{room.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {room.description || 'No description'}
                </p>

                <div className="space-y-2 text-sm">
                  {room.recipient_email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      {room.recipient_email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FileText className="w-4 h-4" />
                    {room.document_ids?.length || 0} documents
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Eye className="w-4 h-4" />
                    {room.total_views || 0} views
                  </div>
                  {room.expires_at && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Expires {new Date(room.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => setSelectedRoomForPortal(room)}
                     className="gap-1"
                   >
                     <Share2 className="w-4 h-4" />
                     External
                   </Button>
                   {room.status === 'draft' && (
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => setSendingRoom(room)}
                       disabled={sendMutation.isPending}
                     >
                       <Send className="w-4 h-4 mr-1" />
                       Send
                     </Button>
                   )}
                   {room.share_link && (
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => handleCopyLink(room.share_link)}
                     >
                       <Copy className="w-4 h-4" />
                     </Button>
                   )}
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={() => {
                       setEditingRoom(room);
                       setShowModal(true);
                     }}
                   >
                     <Edit className="w-4 h-4" />
                   </Button>
                   <Button size="sm" variant="outline" onClick={() => setDeleteRoom(room)}>
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <DataRoomModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingRoom(null);
          }}
          onSave={(data) => {
            if (editingRoom) {
              updateMutation.mutate({ id: editingRoom.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          dataRoom={editingRoom}
        />
      )}

      <ConfirmDialog
        open={!!deleteRoom}
        onClose={() => setDeleteRoom(null)}
        onConfirm={() => deleteMutation.mutate(deleteRoom.id)}
        title="Delete Data Room"
        description="This will permanently delete this data room. Documents will not be deleted."
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={!!sendingRoom}
        onClose={() => setSendingRoom(null)}
        onConfirm={() => sendMutation.mutate(sendingRoom)}
        title="Send Data Room Invitation"
        description={`Send access invitation to ${sendingRoom?.recipient_email}?`}
        confirmLabel="Send"
        isLoading={sendMutation.isPending}
      />
    </div>
  );
}