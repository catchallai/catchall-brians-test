import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrackingModal from './TrackingModal';

export default function TrackingIntegrationCard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="glass-card rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Website Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor website traffic, visitor behavior, and analytics
              </p>
              <div className="mt-3 flex gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  Connected
                </span>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} className="whitespace-nowrap">
            Configure
          </Button>
        </div>
      </div>

      <TrackingModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}