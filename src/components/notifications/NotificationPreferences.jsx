import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Bell, Volume2, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { playNotificationSound } from './NotificationSounds';

export default function NotificationPreferences({ user, onPreferencesUpdate }) {
  const [prefs, setPrefs] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen && user) {
      loadPreferences();
    }
  }, [isOpen, user]);

  const loadPreferences = async () => {
    try {
      const records = await base44.entities.NotificationPreference.filter({
        user_email: user?.email,
      });
      setPrefs(
        records[0] || {
          user_email: user?.email,
          messages_enabled: true,
          mentions_enabled: true,
          updates_enabled: true,
          sound_enabled: true,
          sound_type: 'bell',
          do_not_disturb_enabled: false,
          desktop_notifications_enabled: true,
          muted_channels: [],
        }
      );
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (prefs.id) {
        await base44.entities.NotificationPreference.update(prefs.id, prefs);
      } else {
        await base44.entities.NotificationPreference.create(prefs);
      }
      onPreferencesUpdate?.(prefs);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePref = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  if (!prefs) {
    return (
      <Button variant="ghost" size="icon" title="Notification settings" disabled>
        <Settings className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Notification settings">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="messages">New Messages</Label>
                <Switch
                  id="messages"
                  checked={prefs.messages_enabled}
                  onCheckedChange={(val) => updatePref('messages_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mentions">Mentions</Label>
                <Switch
                  id="mentions"
                  checked={prefs.mentions_enabled}
                  onCheckedChange={(val) => updatePref('mentions_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="updates">Important Updates</Label>
                <Switch
                  id="updates"
                  checked={prefs.updates_enabled}
                  onCheckedChange={(val) => updatePref('updates_enabled', val)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="desktop">Desktop Notifications</Label>
                <Switch
                  id="desktop"
                  checked={prefs.desktop_notifications_enabled}
                  onCheckedChange={(val) => updatePref('desktop_notifications_enabled', val)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sound Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sound Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Enable Sound</Label>
                <Switch
                  id="sound"
                  checked={prefs.sound_enabled}
                  onCheckedChange={(val) => updatePref('sound_enabled', val)}
                />
              </div>

              {prefs.sound_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="sound-type">Sound Type</Label>
                  <div className="flex gap-2">
                    <Select
                      value={prefs.sound_type}
                      onValueChange={(val) => updatePref('sound_type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['bell', 'chime', 'ding', 'pop', 'whoosh'].map((sound) => (
                          <SelectItem key={sound} value={sound}>
                            {sound.charAt(0).toUpperCase() + sound.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => playNotificationSound(prefs.sound_type)}
                      className="px-3"
                    >
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Do Not Disturb */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Do Not Disturb
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dnd">Enable DND</Label>
                <Switch
                  id="dnd"
                  checked={prefs.do_not_disturb_enabled}
                  onCheckedChange={(val) => updatePref('do_not_disturb_enabled', val)}
                />
              </div>

              {prefs.do_not_disturb_enabled && (
                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <Label htmlFor="dnd-start" className="text-xs">
                      Start Time
                    </Label>
                    <Input
                      id="dnd-start"
                      type="time"
                      value={prefs.dnd_start_time || '22:00'}
                      onChange={(e) => updatePref('dnd_start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dnd-end" className="text-xs">
                      End Time
                    </Label>
                    <Input
                      id="dnd-end"
                      type="time"
                      value={prefs.dnd_end_time || '08:00'}
                      onChange={(e) => updatePref('dnd_end_time', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
