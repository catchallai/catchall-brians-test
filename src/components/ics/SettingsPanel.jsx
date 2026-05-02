import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Eye, Lock } from 'lucide-react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';

export default function SettingsPanel({ open, onClose, user, onPreferencesUpdate }) {
  const [settings, setSettings] = useState({
    compactMode: false,
    showOnlineStatus: true,
    readReceipts: true,
    typingIndicators: true,
    messagePreview: true,
  });

  const handleSettingChange = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingRow = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 px-4 border-b border-slate-100 last:border-0">
      <div className="flex-1">
        <Label className="text-sm font-medium text-slate-900 cursor-pointer">{label}</Label>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="ml-4" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-600" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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

          <TabsContent value="display" className="space-y-2 mt-4">
            <div className="bg-slate-50 rounded-lg overflow-hidden">
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

          <TabsContent value="privacy" className="space-y-2 mt-4">
            <div className="bg-slate-50 rounded-lg overflow-hidden">
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

          <TabsContent value="notifications" className="space-y-2 mt-4">
            <div className="bg-slate-50 rounded-lg">
              <NotificationPreferences user={user} onPreferencesUpdate={onPreferencesUpdate} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}