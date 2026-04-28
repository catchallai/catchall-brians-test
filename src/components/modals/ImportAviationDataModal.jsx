import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Check, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

export default function ImportAviationDataModal({ open, onClose }) {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('importAviationData', { data });
      return response.data;
    },
    onSuccess: (_result) => {
      setStep(3);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        onClose();
        setFile(null);
        setCsvData(null);
        setStep(1);
      }, 2000);
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
          setFile(selectedFile);
        },
        error: (error) => {
          toast.error('Error parsing CSV: ' + error.message);
        },
      });
    }
  };

  const handleImport = () => {
    if (!csvData) {
      return;
    }
    setStep(2);
    importMutation.mutate(csvData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Aviation Companies</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-900 dark:text-white">Upload CSV File</p>
                <p className="text-sm text-gray-500 mt-1">Drag and drop or click to select</p>
              </label>
            </div>

            {csvData && (
              <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                      {file?.name}
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      {csvData.length} rows ready to import
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-3" />
            <p className="font-medium text-gray-900 dark:text-white">Importing data...</p>
            <p className="text-sm text-gray-500 mt-1">Creating companies and contacts</p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Import Complete!</p>
            <p className="text-sm text-gray-500 mt-1">
              {importMutation.data?.companiesCreated} companies and{' '}
              {importMutation.data?.contactsCreated} contacts created
            </p>
            {importMutation.data?.errors?.length > 0 && (
              <div className="mt-4 w-full">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                  Warnings:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importMutation.data.errors.map((err, i) => (
                    <p key={i} className="text-xs text-amber-700 dark:text-amber-200">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {step === 3 ? 'Close' : 'Cancel'}
          </Button>
          {step === 1 && (
            <Button
              onClick={handleImport}
              disabled={!csvData}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Upload className="w-4 h-4" />
              Import {csvData?.length || 0} Companies
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
