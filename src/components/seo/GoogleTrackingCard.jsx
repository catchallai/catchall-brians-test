import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Chrome, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function GoogleTrackingCard({ website, onSaveTracking }) {
  const [showSettings, setShowSettings] = useState(false);
  const [gaId, setGaId] = useState(website?.ga_tracking_id || '');
  const [gscVerified, setGscVerified] = useState(website?.gsc_verified || false);

  const handleSave = () => {
    onSaveTracking({
      ga_tracking_id: gaId,
      gsc_verified: gscVerified,
    });
    setShowSettings(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Google Tracking</CardTitle>
              <p className="text-xs text-gray-500">Analytics & Search Console</p>
            </div>
          </div>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4 text-gray-400" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Google Tracking Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Google Analytics ID</Label>
                  <Input
                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Enter your GA4 or Universal Analytics ID</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Search Console Verified</p>
                    <p className="text-xs text-gray-500">Mark if site is verified in GSC</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={gscVerified}
                    onChange={(e) => setGscVerified(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Google Analytics</span>
            </div>
            {website?.ga_tracking_id ? (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 gap-1">
                <AlertCircle className="w-3 h-3" />
                Not Set
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Search Console</span>
            </div>
            {website?.gsc_verified ? (
              <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-600 gap-1">
                <AlertCircle className="w-3 h-3" />
                Not Verified
              </Badge>
            )}
          </div>
          {website?.ga_tracking_id && (
            <p className="text-xs text-gray-500 text-center">ID: {website.ga_tracking_id}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
