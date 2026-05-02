import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, FileUp, Loader, X } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';

export default function ComplianceEvidenceUploader({ complianceItemId, onEvidenceAdded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);

    try {
      // Upload file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      // Determine file type
      let fileType = 'other';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type.includes('document') || file.name.endsWith('.docx') || file.name.endsWith('.doc'))
        fileType = 'document';

      // Create evidence record with scan pending
      const evidence = await base44.entities.ComplianceEvidence.create({
        compliance_item_id: complianceItemId,
        file_url: fileUrl,
        file_name: file.name,
        file_type: fileType,
        description: description || null,
        uploaded_by: (await base44.auth.me()).email,
        scan_status: 'pending',
      });

      // Trigger async scan
      try {
        await base44.functions.invoke('scanEvidenceFile', {
          file_url: fileUrl,
          file_name: file.name,
          compliance_item_id: complianceItemId,
        });
      } catch (err) {
        console.error('Scan failed:', err);
        // Continue even if scan fails - evidence is still recorded
      }

      // Invalidate queries to refresh evidence list
      queryClient.invalidateQueries({ queryKey: ['compliance-evidence', complianceItemId] });

      // Reset form
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onEvidenceAdded) {
        onEvidenceAdded(evidence);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="w-5 h-5" />
          Upload Evidence
        </CardTitle>
        <CardDescription>
          Attach files, screenshots, or documents as evidence. Files are automatically scanned for sensitive
          information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragging
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-sm font-medium">Uploading and scanning...</p>
              </>
            ) : (
              <>
                <FileUp className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium">Drag and drop files here, or click to select</p>
                <p className="text-xs text-gray-500">Supported: PDF, images, documents</p>
              </>
            )}
          </div>
          {!uploading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3"
            >
              Select File
            </Button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            placeholder="Add context about this evidence (what it proves, where it came from, etc.)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            rows={3}
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">Security Scan</p>
          <p>
            All uploaded files are automatically scanned for sensitive information including SSNs, API keys,
            passwords, and PII. High-risk files will be flagged for review.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}