import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Eye, Lock } from 'lucide-react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';

export default function SettingsPanel({
  open,
  onClose,
  user,
  darkMode,
  onThemeToggle,
  onPreferencesUpdate,
}) {
  const [settings, setSettings] = useState({
    compactMode: false,
    showOnlineStatus: true,
    readReceipts: true,
    typingIndicators: true,
    messagePreview: true,
  });

  const handleSettingChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const SettingRow = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 px-4 border-b border-slate-700 last:border-0">
      <div className="flex-1">
        <Label className="text-sm font-medium text-white cursor-pointer">{label}</Label>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="ml-4" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-violet-400" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="display" className="gap-2 text-xs sm:text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Display</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2 text-xs sm:text-sm">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-2 mt-4">
            <div className="bg-slate-800/50 rounded-lg overflow-hidden">
              <SettingRow
                label="Dark Mode"
                description="Use dark theme for the application"
                checked={darkMode}
                onChange={onThemeToggle}
              />
              <SettingRow
                label="Compact Mode"
                description="Use compact spacing for messages and channels"
                checked={settings.compactMode}
                onChange={() => handleSettingChange('compactMode')}
              />
              <SettingRow
                label="Message Preview"
                description="Show message previews in channel list"
                checked={settings.messagePreview}
                onChange={() => handleSettingChange('messagePreview')}
              />
            </div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-2 mt-4">
            <div className="bg-slate-800/50 rounded-lg overflow-hidden">
              <SettingRow
                label="Show Online Status"
                description="Let others see when you're online"
                checked={settings.showOnlineStatus}
                onChange={() => handleSettingChange('showOnlineStatus')}
              />
              <SettingRow
                label="Read Receipts"
                description="Show when you've read messages"
                checked={settings.readReceipts}
                onChange={() => handleSettingChange('readReceipts')}
              />
              <SettingRow
                label="Typing Indicators"
                description="Show when you're typing"
                checked={settings.typingIndicators}
                onChange={() => handleSettingChange('typingIndicators')}
              />
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-2 mt-4">
            <div className="bg-slate-800/50 rounded-lg">
              <NotificationPreferences user={user} onPreferencesUpdate={onPreferencesUpdate} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
