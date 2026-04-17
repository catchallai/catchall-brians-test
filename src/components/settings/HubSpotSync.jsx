import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function HubSpotSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState('both');
  const [direction, setDirection] = useState('bidirectional');
  const [results, setResults] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('syncHubspot', {
        syncType,
        direction,
      });

      if (response.data.success) {
        setResults(response.data.results);
        toast.success('Sync completed successfully');
      } else {
        throw new Error(response.data.error || 'Sync failed');
      }
    } catch (error) {
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img
            src="https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png"
            className="w-6 h-6"
            alt="HubSpot"
          />
          HubSpot Sync
        </CardTitle>
        <CardDescription>
          Sync your contacts and companies between Catchall and HubSpot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              What to sync
            </label>
            <Select value={syncType} onValueChange={setSyncType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacts">Contacts only</SelectItem>
                <SelectItem value="companies">Companies only</SelectItem>
                <SelectItem value="both">Both contacts and companies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Sync direction
            </label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_hubspot">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Catchall to HubSpot
                  </div>
                </SelectItem>
                <SelectItem value="from_hubspot">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    HubSpot to Catchall
                  </div>
                </SelectItem>
                <SelectItem value="bidirectional">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />
                    Bidirectional (both ways)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSync} disabled={syncing} className="w-full">
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-gray-900 dark:text-white">Sync Results</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Contacts Created</span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {results.contactsCreated}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Contacts Updated</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {results.contactsUpdated}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Companies Created</span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {results.companiesCreated}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Companies Updated</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {results.companiesUpdated}
                </p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Errors ({results.errors.length})</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results.errors.map((error, idx) => (
                    <p key={idx} className="text-xs text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            <strong>Note:</strong> Matching is done by email for contacts and domain for companies.
          </p>
          <p>
            Bidirectional sync will update existing records with the most recent data from either
            system.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
