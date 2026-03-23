import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, File, FileText, FileImage, FileVideo } from 'lucide-react';

const getFileIcon = (type) => {
  if (type.startsWith('image/')) {
    return FileImage;
  }
  if (type.startsWith('video/')) {
    return FileVideo;
  }
  if (type.includes('pdf') || type.includes('text')) {
    return FileText;
  }
  return File;
};

const getFileCategory = (type) => {
  if (type.startsWith('image/')) {
    return 'image';
  }
  if (type.startsWith('video/')) {
    return 'video';
  }
  if (type.startsWith('audio/')) {
    return 'audio';
  }
  return 'file';
};

export default function FilePreview({ file }) {
  const [showPreview, setShowPreview] = useState(false);
  const category = getFileCategory(file.type);
  const Icon = getFileIcon(file.type);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Image preview
  if (category === 'image') {
    return (
      <div className="mt-2">
        {!showPreview ? (
          <button
            onClick={() => setShowPreview(true)}
            className="inline-block max-w-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
          >
            <img src={file.url} alt={file.name} className="w-full h-auto max-h-48 object-cover" />
          </button>
        ) : (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="max-w-4xl max-h-96 relative">
              <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-2 right-2 bg-white text-black rounded-full p-2 hover:bg-gray-200"
              >
                ✕
              </button>
              <Button onClick={handleDownload} className="absolute bottom-2 left-2" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Video preview
  if (category === 'video') {
    return (
      <div className="mt-2">
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          <video controls className="w-full max-w-sm">
            <source src={file.url} type={file.type} />
            Your browser does not support the video tag.
          </video>
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm" className="mt-2">
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      </div>
    );
  }

  // Audio preview
  if (category === 'audio') {
    return (
      <div className="mt-2">
        <audio controls className="w-full max-w-sm">
          <source src={file.url} type={file.type} />
          Your browser does not support the audio tag.
        </audio>
        <Button onClick={handleDownload} variant="outline" size="sm" className="mt-2">
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      </div>
    );
  }

  // Generic file
  return (
    <Card className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-xs">
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <Button onClick={handleDownload} variant="ghost" size="sm" className="flex-shrink-0">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
