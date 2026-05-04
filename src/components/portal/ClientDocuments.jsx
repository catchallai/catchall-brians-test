import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText, Download, Eye, Search, FolderOpen,
  Clock, CheckCircle, AlertCircle, Shield
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: 'bg-gray-100 text-gray-600 border-gray-200' },
  sent:     { label: 'Sent',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  viewed:   { label: 'Viewed',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  signed:   { label: 'Signed',   color: 'bg-green-100 text-green-700 border-green-200' },
  expired:  { label: 'Expired',  color: 'bg-red-100 text-red-600 border-red-200' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-200' },
  active:   { label: 'Active',   color: 'bg-green-100 text-green-700 border-green-200' },
};

const DOC_TYPE_LABELS = {
  nda: 'NDA',
  media_release: 'Media Release',
  contractor_agreement: 'Contractor Agreement',
  location_release: 'Location Release',
  talent_release: 'Talent Release',
  custom: 'Document',
};

function DocTypeIcon() {
  return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
}

export default function ClientDocuments({ user }) {
  const [search, setSearch] = useState('');

  // Fetch legal documents shared with this user's email
  const { data: legalDocs = [], isLoading: loadingLegal } = useQuery({
    queryKey: ['client-legal-docs', user?.email],
    queryFn: () =>
      base44.entities.LegalDocument.filter({ recipient_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch data rooms shared with this user's email
  const { data: dataRooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['client-data-rooms', user?.email],
    queryFn: () =>
      base44.entities.DataRoom.filter({ recipient_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  // Fetch tracked documents in those data rooms
  const { data: trackedDocs = [], isLoading: loadingTracked } = useQuery({
    queryKey: ['client-tracked-docs', dataRooms.map(r => r.id).join(',')],
    queryFn: async () => {
      const allDocIds = dataRooms.flatMap(r => r.document_ids || []);
      if (!allDocIds.length) return [];
      const all = await base44.entities.TrackedDocument.list();
      return all.filter(d => allDocIds.includes(d.id));
    },
    enabled: dataRooms.length > 0,
  });

  const isLoading = loadingLegal || loadingRooms;

  const filteredLegal = legalDocs.filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTracked = trackedDocs.filter(d =>
    !search || d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDocs = legalDocs.length + trackedDocs.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: totalDocs, Icon: FileText, color: 'text-blue-600' },
          { label: 'Data Rooms', value: dataRooms.length, Icon: FolderOpen, color: 'text-violet-600' },
          { label: 'Signed', value: legalDocs.filter(d => d.status === 'signed').length, Icon: CheckCircle, color: 'text-green-600' },
          { label: 'Pending Review', value: legalDocs.filter(d => ['sent','viewed'].includes(d.status)).length, Icon: Clock, color: 'text-amber-600' },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Legal Documents */}
      {filteredLegal.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-500" /> Legal Documents
          </h2>
          <div className="space-y-3">
            {filteredLegal.map(doc => {
              const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <DocTypeIcon />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              {DOC_TYPE_LABELS[doc.document_type] || 'Document'}
                            </span>
                            {doc.sent_date && (
                              <span className="text-xs text-gray-400">
                                · Sent {format(new Date(doc.sent_date), 'MMM d, yyyy')}
                              </span>
                            )}
                            {doc.expires_date && (
                              <span className="text-xs text-gray-400">
                                · Expires {format(new Date(doc.expires_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                        {doc.signature_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.signature_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Room Documents */}
      {dataRooms.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-500" /> Shared Data Rooms
          </h2>
          <div className="space-y-4">
            {dataRooms.map(room => {
              const roomDocs = filteredTracked.filter(d =>
                (room.document_ids || []).includes(d.id)
              );
              return (
                <Card key={room.id} className="overflow-hidden">
                  <CardHeader className="pb-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        {room.name}
                      </CardTitle>
                      <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        {roomDocs.length} file{roomDocs.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {room.description && (
                      <p className="text-xs text-gray-500 mt-1">{room.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {roomDocs.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No files in this room</p>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {roomDocs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-xs text-gray-400 truncate">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {doc.file_url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                  </a>
                                </Button>
                              )}
                              {room.allow_downloads && doc.file_url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={doc.file_url} download>
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalDocs === 0 && dataRooms.length === 0 && (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">No documents yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Documents and data rooms shared with {user?.email} will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}