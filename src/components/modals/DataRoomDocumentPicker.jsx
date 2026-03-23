import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, FileText, Eye, Download } from 'lucide-react';

export default function DataRoomDocumentPicker({ open, onClose, selectedDocIds = [], onSave }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(selectedDocIds);

  const { data: documents = [] } = useQuery({
    queryKey: ['tracked-documents'],
    queryFn: () => base44.entities.TrackedDocument.list('-created_date', 200),
    enabled: open,
  });

  React.useEffect(() => {
    setSelected(selectedDocIds);
  }, [selectedDocIds, open]);

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDoc = (docId) => {
    setSelected((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Documents for Data Room</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredDocs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {documents.length === 0
                  ? 'No documents available. Upload documents in DocuTrace first.'
                  : 'No matching documents'}
              </p>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selected.includes(doc.id)
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => toggleDoc(doc.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.includes(doc.id)}
                      onCheckedChange={() => toggleDoc(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          {doc.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                        </div>
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {doc.total_views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {doc.total_downloads || 0} downloads
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selected.length} document{selected.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSave(selected);
                  onClose();
                }}
              >
                Add Documents
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
