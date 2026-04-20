import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataManagement() {
  const [enriching, setEnriching] = useState(false);
  const [enrichResults, setEnrichResults] = useState(null);

  const handleEnrichAllCompanies = async () => {
    setEnriching(true);
    setEnrichResults(null);

    try {
      const response = await base44.functions.invoke('enrichAllCompanies');
      setEnrichResults(response);
      toast.success(`Enriched ${response.enriched} companies`);
    } catch (error) {
      toast.error('Failed to enrich companies: ' + error.message);
    } finally {
      setEnriching(false);
    }
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Company Enrichment</h3>
          <p className="text-sm text-gray-500">
            Enrich all companies with AI-powered data including descriptions, industry trends, and
            competitors.
          </p>

          <Button onClick={handleEnrichAllCompanies} disabled={enriching} className="gap-2">
            {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {enriching ? 'Enriching...' : 'Enrich All Companies'}
          </Button>

          {enrichResults && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Enriched {enrichResults.enriched} of {enrichResults.total} companies
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {enrichResults.enriched > 0
                      ? 'Company data updated with descriptions, industry trends, and competitors.'
                      : 'No new companies to enrich.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This operation uses AI to fetch current company data from the internet. It may take a
              few minutes depending on the number of companies.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
