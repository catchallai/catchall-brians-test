import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import { parseCSV } from '@/components/utils/exportData';

export default function ImportDialog({ 
  open, 
  onClose, 
  onImport, 
  entityName,
  requiredFields = [],
  optionalFields = [],
  sampleData = []
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV file']);
      return;
    }
    
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const { headers, data } = parseCSV(event.target.result);
      
      // Validate required fields
      const missingFields = requiredFields.filter(f => !headers.includes(f));
      if (missingFields.length > 0) {
        setErrors([`Missing required columns: ${missingFields.join(', ')}`]);
        setParsedData(null);
        return;
      }
      
      setErrors([]);
      setParsedData({ headers, data, count: data.length });
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setIsImporting(true);
    try {
      await onImport(parsedData.data);
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
    const sampleRows = sampleData.map(row => 
      [...requiredFields, ...optionalFields].map(f => row[f] || '').join(',')
    ).join('\n');
    
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
    <Dialog open={open} onOpenChange={() => { onClose(); resetState(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {entityName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Download */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Download our template to ensure your data is formatted correctly.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {/* Required Fields */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required columns:</p>
            <div className="flex flex-wrap gap-1">
              {requiredFields.map(field => (
                <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-violet-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  {parsedData && (
                    <p className="text-sm text-emerald-600">{parsedData.count} records found</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Click to upload CSV file</p>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {errors.map((error, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
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
          <Button variant="outline" onClick={() => { onClose(); resetState(); }}>Cancel</Button>
          <Button 
            onClick={handleImport} 
            disabled={!parsedData || errors.length > 0 || isImporting}
          >
            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Import {parsedData?.count || 0} Records
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}