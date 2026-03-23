import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Type, Eye, Save, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FONT_OPTIONS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway'];

export default function ReportBrandingSettings({ open, onClose }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['report-branding'],
    queryFn: () => base44.entities.ReportBranding.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportBranding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-branding'] });
      setSelectedProfile(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReportBranding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-branding'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportBranding.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-branding'] });
      setSelectedProfile(null);
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (selectedProfile) {
        setSelectedProfile({ ...selectedProfile, logo_url: file_url });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!selectedProfile) {
      return;
    }

    if (selectedProfile.id) {
      updateMutation.mutate({ id: selectedProfile.id, data: selectedProfile });
    } else {
      createMutation.mutate(selectedProfile);
    }
  };

  const handleSetDefault = async (id) => {
    // Unset all defaults
    for (const profile of profiles) {
      if (profile.is_default) {
        await base44.entities.ReportBranding.update(profile.id, { is_default: false });
      }
    }
    // Set new default
    await base44.entities.ReportBranding.update(id, { is_default: true });
    queryClient.invalidateQueries({ queryKey: ['report-branding'] });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Branding</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Profile List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Profiles</h3>
              <Button
                size="sm"
                onClick={() =>
                  setSelectedProfile({
                    name: 'New Profile',
                    primary_color: '#7c3aed',
                    secondary_color: '#06b6d4',
                    font_family: 'Inter',
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            <div className="space-y-2">
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className={`cursor-pointer transition-all ${
                    selectedProfile?.id === profile.id
                      ? 'ring-2 ring-violet-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedProfile(profile)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {profile.name}
                        </h4>
                        {profile.is_default && (
                          <Badge variant="secondary" className="mt-1">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2"
                          style={{ backgroundColor: profile.primary_color }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Editor */}
          {selectedProfile && (
            <div className="col-span-2 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Profile Name</Label>
                  <Input
                    value={selectedProfile.name}
                    onChange={(e) =>
                      setSelectedProfile({ ...selectedProfile, name: e.target.value })
                    }
                    placeholder="e.g., Client Reports, Internal Reports"
                  />
                </div>

                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={selectedProfile.company_name || ''}
                    onChange={(e) =>
                      setSelectedProfile({ ...selectedProfile, company_name: e.target.value })
                    }
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Company Logo
                  </Label>
                  <div className="flex items-center gap-4 mt-2">
                    {selectedProfile.logo_url && (
                      <img
                        src={selectedProfile.logo_url}
                        alt="Logo"
                        className="h-16 object-contain bg-gray-100 dark:bg-gray-800 rounded p-2"
                      />
                    )}
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload').click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Primary Color
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="color"
                        value={selectedProfile.primary_color}
                        onChange={(e) =>
                          setSelectedProfile({ ...selectedProfile, primary_color: e.target.value })
                        }
                        className="w-20 h-10 p-1"
                      />
                      <Input
                        value={selectedProfile.primary_color}
                        onChange={(e) =>
                          setSelectedProfile({ ...selectedProfile, primary_color: e.target.value })
                        }
                        placeholder="#7c3aed"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Secondary Color
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="color"
                        value={selectedProfile.secondary_color}
                        onChange={(e) =>
                          setSelectedProfile({
                            ...selectedProfile,
                            secondary_color: e.target.value,
                          })
                        }
                        className="w-20 h-10 p-1"
                      />
                      <Input
                        value={selectedProfile.secondary_color}
                        onChange={(e) =>
                          setSelectedProfile({
                            ...selectedProfile,
                            secondary_color: e.target.value,
                          })
                        }
                        placeholder="#06b6d4"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Font Family
                  </Label>
                  <Select
                    value={selectedProfile.font_family}
                    onValueChange={(value) =>
                      setSelectedProfile({ ...selectedProfile, font_family: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Footer Text</Label>
                  <Textarea
                    value={selectedProfile.footer_text || ''}
                    onChange={(e) =>
                      setSelectedProfile({ ...selectedProfile, footer_text: e.target.value })
                    }
                    placeholder="Custom footer text for reports..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="w-4 h-4" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-6 rounded-lg border-2"
                    style={{
                      fontFamily: selectedProfile.font_family,
                      borderColor: selectedProfile.primary_color,
                    }}
                  >
                    {selectedProfile.logo_url && (
                      <img src={selectedProfile.logo_url} alt="Logo" className="h-12 mb-4" />
                    )}
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: selectedProfile.primary_color }}
                    >
                      {selectedProfile.company_name || 'Company Name'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      This is how your reports will look with this branding.
                    </p>
                    <div
                      className="inline-block px-4 py-2 rounded text-white"
                      style={{ backgroundColor: selectedProfile.secondary_color }}
                    >
                      Sample Button
                    </div>
                    {selectedProfile.footer_text && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-4 pt-4 border-t">
                        {selectedProfile.footer_text}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {selectedProfile.id && (
                    <>
                      {!selectedProfile.is_default && (
                        <Button
                          variant="outline"
                          onClick={() => handleSetDefault(selectedProfile.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(selectedProfile.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
