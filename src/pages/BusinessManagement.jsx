import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Plus, Search, Edit2, Trash2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import BusinessModal from '@/components/business/BusinessModal';
import EmptyState from '@/components/ui/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BusinessManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.Business.list('-created_date', 100),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date', 1000);
      return users;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Business.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  const updateUserBusinessMutation = useMutation({
    mutationFn: async ({ userId, businessIds }) => {
      await base44.entities.User.update(userId, {
        assigned_businesses: businessIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
  });

  const handleEdit = (business) => {
    setEditingBusiness(business);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBusiness(null);
  };

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserBusiness = (user, businessId) => {
    const current = user.assigned_businesses || [];
    const updated = current.includes(businessId)
      ? current.filter((id) => id !== businessId)
      : [...current, businessId];
    updateUserBusinessMutation.mutate({ userId: user.id, businessIds: updated });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Management</h1>
          <p className="text-gray-500 mt-1">Manage your businesses and assign users</p>
        </div>
        <Button
          onClick={() => {
            setEditingBusiness(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Business
        </Button>
      </div>

      <Tabs defaultValue="businesses" className="w-full">
        <TabsList>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="users">User Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Business List */}
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredBusinesses.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No businesses yet"
              description="Create your first business to get started"
              actionLabel="Add Business"
              onAction={() => setShowModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-violet-100 text-violet-600">
                            {business.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{business.name}</CardTitle>
                          {business.industry && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {business.industry}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(business)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(business.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {business.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {business.description}
                      </p>
                    )}
                    <div className="space-y-1 text-xs text-gray-500">
                      {business.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          {business.website}
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {business.email}
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {business.phone}
                        </div>
                      )}
                      {business.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {business.address}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Business Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-violet-100 text-violet-600">
                          {user.full_name?.[0] || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {businesses.map((business) => (
                        <Button
                          key={business.id}
                          variant={
                            user.assigned_businesses?.includes(business.id) ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => toggleUserBusiness(user, business.id)}
                        >
                          {business.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BusinessModal open={showModal} onClose={handleCloseModal} business={editingBusiness} />
    </div>
  );
}
