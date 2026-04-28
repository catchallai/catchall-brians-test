import { useRef, useState } from 'react';
import { Paperclip, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function FileUploader({ onFilesSelected, maxFiles = 5 }) {
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      return;
    }

    if (uploadedFiles.length + files.length > maxFiles) {
      toast.warning(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    const uploadedData = [];

    try {
      for (const file of files) {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        const fileData = {
          url: file_url,
          name: file.name,
          type: file.type,
          size: file.size,
        };

        uploadedData.push(fileData);
        setUploadedFiles((prev) => [...prev, fileData]);
      }

      onFilesSelected(uploadedData);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error uploading files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleClick = () => {
    if (!isUploading && uploadedFiles.length < maxFiles) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={isUploading || uploadedFiles.length >= maxFiles}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading || uploadedFiles.length >= maxFiles}
        title={
          uploadedFiles.length >= maxFiles ? `Maximum ${maxFiles} files reached` : 'Attach file'
        }
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
      >
        {isUploading ? (
          <Upload className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>

      {/* File preview list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-2 space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          {uploadedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
