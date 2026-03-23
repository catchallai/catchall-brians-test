import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, AlertTriangle, TrendingUp, Users, Target, Info } from 'lucide-react';

const sensitivityDescriptions = {
  low: 'Only critical anomalies and major brand risks will trigger alerts',
  medium: 'Balanced detection for significant changes and moderate risks',
  high: 'Sensitive detection for early warning on emerging trends and issues',
};

const sensitivityThresholds = {
  low: { spike: 3.0, sentiment: 40, impact: 80 },
  medium: { spike: 2.0, sentiment: 25, impact: 60 },
  high: { spike: 1.5, sentiment: 15, impact: 40 },
};

export default function AlertSettingsModal({ open, onClose, keyword, onSave, isLoading }) {
  const [settings, setSettings] = useState({
    ai_alerts_enabled: true,
    alert_sensitivity: 'medium',
  });

  useEffect(() => {
    if (keyword) {
      setSettings({
        ai_alerts_enabled: keyword.ai_alerts_enabled !== false,
        alert_sensitivity: keyword.alert_sensitivity || 'medium',
      });
    }
  }, [keyword]);

  const handleSave = () => {
    onSave({ ...keyword, ...settings });
  };

  const sensitivityValue =
    settings.alert_sensitivity === 'low' ? 0 : settings.alert_sensitivity === 'medium' ? 50 : 100;

  const handleSliderChange = (value) => {
    const sensitivity = value[0] < 33 ? 'low' : value[0] < 66 ? 'medium' : 'high';
    setSettings((prev) => ({ ...prev, alert_sensitivity: sensitivity }));
  };

  const thresholds = sensitivityThresholds[settings.alert_sensitivity];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-500" />
            AI Alert Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Alerts Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">AI Anomaly Detection</p>
                <p className="text-sm text-gray-500">Automatically detect unusual patterns</p>
              </div>
            </div>
            <Switch
              checked={settings.ai_alerts_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, ai_alerts_enabled: checked }))
              }
            />
          </div>

          {settings.ai_alerts_enabled && (
            <>
              {/* Sensitivity Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Detection Sensitivity</Label>
                  <Badge
                    className={
                      settings.alert_sensitivity === 'low'
                        ? 'bg-blue-100 text-blue-700'
                        : settings.alert_sensitivity === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }
                  >
                    {settings.alert_sensitivity.charAt(0).toUpperCase() +
                      settings.alert_sensitivity.slice(1)}
                  </Badge>
                </div>
                <Slider
                  value={[sensitivityValue]}
                  onValueChange={handleSliderChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <Info className="w-4 h-4 inline mr-1 text-gray-400" />
                  {sensitivityDescriptions[settings.alert_sensitivity]}
                </p>
              </div>

              {/* Detection Types */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">What AI Will Detect</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 border-0 bg-blue-50">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">Mention Spikes</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Alert when mentions exceed {thresholds.spike}x baseline
                    </p>
                  </Card>
                  <Card className="p-3 border-0 bg-red-50">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-900">Sentiment Shifts</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Alert on {thresholds.sentiment}%+ negative change
                    </p>
                  </Card>
                  <Card className="p-3 border-0 bg-purple-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-900">Influencer Activity</span>
                    </div>
                    <p className="text-xs text-gray-500">High-reach accounts mentioning you</p>
                  </Card>
                  <Card className="p-3 border-0 bg-orange-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-900">Brand Risk</span>
                    </div>
                    <p className="text-xs text-gray-500">Impact score above {thresholds.impact}</p>
                  </Card>
                </div>
              </div>

              {/* Impact Prioritization Info */}
              <Card className="p-4 border-0 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Smart Prioritization</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Alerts are automatically ranked by potential brand impact, considering
                      follower reach, engagement velocity, sentiment severity, and content virality.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
