import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Sparkles,
} from 'lucide-react';
import { parseCSV } from '@/components/utils/exportData';

export default function ImportDialog({
  open,
  onClose,
  onImport,
  entityName,
  requiredFields = [],
  optionalFields = [],
  sampleData = [],
  onImportComplete,
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setParsedData({ headers: [], data: [], count: 0, isAIProcessing: true });

    try {
      // CSV files - parse directly
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        const { headers, data } = parseCSV(text);
        setParsedData({ headers, data, count: data.length });
      }
      // All other files - use AI
      else {
        await handleAIExtraction(selectedFile);
      }
    } catch (error) {
      setErrors([error.message || 'Failed to process file']);
      setParsedData(null);
    }
  };

  const handleAIExtraction = async (file) => {
    try {
      // Upload file first
      const { base44 } = await import('@/api/base44Client');
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });

      // Build schema from required and optional fields
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      };

      [...requiredFields, ...optionalFields].forEach((field) => {
        schema.items.properties[field] = { type: 'string' };
      });

      // Extract data using AI
      setParsedData({ headers: [], data: [], count: 0, isAIProcessing: true });
      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResponse.file_url,
        json_schema: schema,
      });

      if (extractResponse.status === 'error') {
        setErrors([extractResponse.details || 'AI extraction failed']);
        setParsedData(null);
        return;
      }

      const extractedData = Array.isArray(extractResponse.output)
        ? extractResponse.output
        : [extractResponse.output];

      if (extractedData.length === 0) {
        setErrors(['No data found in the file']);
        setParsedData(null);
        return;
      }

      setParsedData({
        headers: [...requiredFields, ...optionalFields],
        data: extractedData,
        count: extractedData.length,
        aiExtracted: true,
      });
    } catch (error) {
      setErrors([error.message || 'AI extraction failed']);
      setParsedData(null);
    }
  };

  const handleImport = async () => {
    if (!parsedData) {
      return;
    }
    setIsImporting(true);
    try {
      const result = await onImport(parsedData.data);
      if (onImportComplete) {
        onImportComplete(result);
      }
      onClose();
      resetState();
    } catch (error) {
      setErrors([error.message || 'Import failed']);
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setErrors([]);
  };

  const downloadTemplate = () => {
    const headers = [...requiredFields, ...optionalFields].join(',');
    const sampleRows = sampleData
      .map((row) => [...requiredFields, ...optionalFields].map((f) => row[f] || '').join(','))
      .join('\n');

    const content = `${headers}\n${sampleRows}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onClose();
        resetState();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {entityName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Info */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-violet-900 dark:text-violet-200 mb-1">
                  AI-Powered Import
                </p>
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  Upload any file type (PDF, Excel, Word, images, etc.) and our AI will
                  automatically extract and structure your contact data.
                </p>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Or download our CSV template for traditional import.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {/* Suggested Fields */}
          {requiredFields.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested fields (AI will extract available data):
              </p>
              <div className="flex flex-wrap gap-1">
                {requiredFields.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                {parsedData?.isAIProcessing ? (
                  <>
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-violet-600">AI is extracting data...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-violet-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      {parsedData && (
                        <p className="text-sm text-emerald-600">
                          {parsedData.count} records found
                          {parsedData.aiExtracted && ' (AI extracted)'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">Click to upload any file</p>
                <p className="text-xs text-gray-500">CSV, PDF, Excel, Word, Images, etc.</p>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {errors.map((error, i) => (
                <p
                  key={i}
                  className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Preview */}
          {parsedData && parsedData.count > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Ready to import {parsedData.count} {entityName.toLowerCase()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              resetState();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!parsedData || errors.length > 0 || isImporting}>
            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Import {parsedData?.count || 0} Records
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
