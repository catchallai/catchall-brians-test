import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BrandingPanel({ branding, onChange }) {
  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ ...branding, logo_url: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const presetThemes = [
    { name: 'Professional', primary: '#1e40af', secondary: '#3b82f6', bg: '#f0f9ff' },
    { name: 'Modern', primary: '#7c3aed', secondary: '#a78bfa', bg: '#f5f3ff' },
    { name: 'Bold', primary: '#dc2626', secondary: '#ef4444', bg: '#fef2f2' },
    { name: 'Tech', primary: '#059669', secondary: '#10b981', bg: '#f0fdf4' },
    { name: 'Elegant', primary: '#475569', secondary: '#94a3b8', bg: '#f8fafc' },
  ];

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="w-4 h-4 text-violet-600" />
          Brand Styling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Themes */}
        <div>
          <Label className="text-xs">Quick Themes</Label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {presetThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() =>
                  onChange({
                    ...branding,
                    primary_color: theme.primary,
                    secondary_color: theme.secondary,
                    background_color: theme.bg,
                  })
                }
                className="group relative h-12 rounded-lg border-2 hover:border-violet-500 transition-colors overflow-hidden"
                style={{ backgroundColor: theme.bg }}
              >
                <div className="absolute inset-0 flex">
                  <div className="flex-1" style={{ backgroundColor: theme.primary }} />
                  <div className="flex-1" style={{ backgroundColor: theme.secondary }} />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Primary Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={branding.primary_color || '#7c3aed'}
                onChange={(e) => onChange({ ...branding, primary_color: e.target.value })}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={branding.primary_color || '#7c3aed'}
                onChange={(e) => onChange({ ...branding, primary_color: e.target.value })}
                className="flex-1 h-10 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Secondary Color</Label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={branding.secondary_color || '#a78bfa'}
                onChange={(e) => onChange({ ...branding, secondary_color: e.target.value })}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={branding.secondary_color || '#a78bfa'}
                onChange={(e) => onChange({ ...branding, secondary_color: e.target.value })}
                className="flex-1 h-10 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <Label className="text-xs">Company Logo</Label>
          <div className="mt-2">
            {branding.logo_url ? (
              <div className="relative group">
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="w-full h-24 object-contain bg-gray-50 dark:bg-gray-900 rounded-lg border"
                />
                <button
                  onClick={() => onChange({ ...branding, logo_url: '' })}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
                <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Upload logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Typography */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Heading Font</Label>
            <select
              value={branding.font_heading || 'Inter'}
              onChange={(e) => onChange({ ...branding, font_heading: e.target.value })}
              className="w-full h-9 px-3 rounded-md border text-xs bg-white dark:bg-gray-800"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
              <option value="Playfair Display">Playfair Display</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Body Font</Label>
            <select
              value={branding.font_body || 'Inter'}
              onChange={(e) => onChange({ ...branding, font_body: e.target.value })}
              className="w-full h-9 px-3 rounded-md border text-xs bg-white dark:bg-gray-800"
            >
              <option value="Inter">Inter</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Roboto">Roboto</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: branding.background_color || '#ffffff',
            borderColor: branding.primary_color || '#7c3aed',
          }}
        >
          <div
            style={{
              color: branding.primary_color || '#7c3aed',
              fontFamily: branding.font_heading || 'Inter',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            Your Headline
          </div>
          <div
            style={{
              color: branding.secondary_color || '#6b7280',
              fontFamily: branding.font_body || 'Inter',
              fontSize: '12px',
            }}
          >
            Your body text will look like this in the presentation
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
