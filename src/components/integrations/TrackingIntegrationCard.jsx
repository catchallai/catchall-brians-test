import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import TrackingModal from './TrackingModal';

export default function TrackingIntegrationCard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="glass-card rounded-2xl border-2 border-violet-200 dark:border-violet-900/30 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-900/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Activity className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-violet-900 dark:text-violet-100">Website Tracking</CardTitle>
                <CardDescription className="text-violet-700 dark:text-violet-300">
                  Monitor website visitors and track key events
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Generate tracking keys and snippets to monitor website activity, visitor behavior, and custom events.
          </p>
          <Button onClick={() => setShowModal(true)} className="w-full">
            Configure
          </Button>
        </CardContent>
      </Card>

      <TrackingModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}