import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Edit2, Lock, Unlock, Users, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CollaborativeDocumentEditor({ channelId, user, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [channelId]);

  const loadDocuments = async () => {
    try {
      const docs = await base44.entities.Document.filter({ channel_id: channelId });
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const saveDocument = async () => {
    try {
      if (selectedDoc) {
        await base44.entities.Document.update(selectedDoc.id, {
          content: docContent,
          last_edited_by: user?.email,
          last_edited_at: new Date().toISOString(),
          version: selectedDoc.version + 1,
        });
      } else {
        await base44.entities.Document.create({
          channel_id: channelId,
          title: newDocTitle || 'Untitled Document',
          content: docContent,
          owner_email: user?.email,
          collaborators: [user?.email],
          last_edited_by: user?.email,
          last_edited_at: new Date().toISOString(),
        });
        setNewDocTitle('');
        setShowNewDoc(false);
      }
      setIsEditing(false);
      await loadDocuments();
    } catch (err) {
      console.error('Failed to save document:', err);
    }
  };

  const toggleLock = async (doc) => {
    try {
      await base44.entities.Document.update(doc.id, {
        is_locked: !doc.is_locked,
        locked_by: !doc.is_locked ? user?.email : null,
      });
      await loadDocuments();
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const removeDocument = async (docId) => {
    try {
      await base44.entities.Document.delete(docId);
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
      await loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Documents</h3>
        <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              New Doc
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Document title"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
              />
              <Textarea
                placeholder="Start typing..."
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="min-h-96"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewDoc(false)}>
                  Cancel
                </Button>
                <Button onClick={saveDocument} disabled={!newDocTitle || !docContent}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {documents.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">No documents yet</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedDoc?.id === doc.id
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedDoc(doc);
                setDocTitle(doc.title);
                setDocContent(doc.content);
                setIsEditing(false);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Edited {formatDistanceToNow(new Date(doc.last_edited_at), { addSuffix: true })}
                  </p>
                  {doc.collaborators?.length > 1 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {doc.collaborators.length} collaborators
                      </span>
                    </div>
                  )}
                </div>
                {doc.is_locked && <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDoc && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{docTitle}</CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setSelectedDoc(null);
                  onClose?.();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <>
                <Textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="min-h-64 font-mono text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveDocument} className="bg-emerald-600 hover:bg-emerald-700">
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-3 rounded border border-gray-200 max-h-64 overflow-y-auto text-sm whitespace-pre-wrap text-gray-700">
                  {docContent}
                </div>
                {selectedDoc.owner_email === user?.email && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="gap-2 flex-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleLock(selectedDoc)}
                      className="gap-2"
                    >
                      {selectedDoc.is_locked ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeDocument(selectedDoc.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
