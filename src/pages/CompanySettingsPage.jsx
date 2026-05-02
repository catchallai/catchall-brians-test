import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, Loader, Upload, X } from 'lucide-react';

const industryOptions = [
  'aerospace',
  'manufacturing',
  'defense',
  'finance',
  'healthcare',
  'retail',
  'technology',
  'energy',
  'telecommunications',
  'transportation',
  'other',
];

export default function CompanySettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const result = await base44.entities.CompanySettings.list();
      return result[0] || null;
    },
  });

  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(() => ({
    company_name: settings?.company_name || 'AeroTech Industries',
    industry: settings?.industry || 'aerospace',
    tagline: settings?.tagline || '',
    primary_color: settings?.primary_color || '#7c3aed',
    support_email: settings?.support_email || '',
    logo_url: settings?.logo_url || '',
  }));
  const [uploading, setUploading] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Save to CompanySettings entity
      if (settings?.id) {
        await base44.entities.CompanySettings.update(settings.id, data);
      } else {
        await base44.entities.CompanySettings.create(data);
      }
      // Also run the industry focus update
      return await base44.functions.invoke('updateIndustryFocus', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('seedDemoData', {});
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (error) {
      console.error('Logo upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const industryLabel = formData.industry.charAt(0).toUpperCase() + formData.industry.slice(1);

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Company Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize branding, industry focus, and platform appearance
        </p>
      </div>

      {/* Whitelabel Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Branding & Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {formData.logo_url ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.logo_url}
                        alt="Company Logo"
                        className="h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700 p-2"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-violet-400 dark:hover:border-violet-500 transition-colors bg-gray-50 dark:bg-slate-700/50"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Change logo'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {industryOptions.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind.charAt(0).toUpperCase() + ind.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                This will update the industry scanner to focus on {industryLabel} intelligence
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g., Advanced compliance solutions"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="h-10 w-20 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                placeholder="support@company.io"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>

            {updateMutation.isSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-200">
                ✓ Settings saved successfully
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Demo Data */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Populate the platform with sample contacts, deals, vendors, transactions, and employees to see the
            system in action.
          </p>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            variant="outline"
            className="w-full gap-2"
          >
            {seedMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Demo Data'
            )}
          </Button>
          {seedMutation.isSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-200">
              ✓ Demo data created successfully
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-300 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Whitelabel Features</p>
            <p>
              Your company name, industry, and branding settings will automatically appear throughout the
              platform. The Industry Scanner will dynamically adjust to focus on your selected industry vertical.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}