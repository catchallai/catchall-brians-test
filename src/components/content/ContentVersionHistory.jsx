import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, User, RotateCcw } from "lucide-react";

export default function ContentVersionHistory({ articleId, open, onClose, onRestore }) {
  const { data: versions = [] } = useQuery({
    queryKey: ['content-versions', articleId],
    queryFn: () => base44.entities.ContentVersion.filter({ article_id: articleId }, '-version_number'),
    enabled: !!articleId && open
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {versions.map(version => (
            <Card key={version.id} className="border-l-4 border-l-violet-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">v{version.version_number}</Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(version.created_date).toLocaleString()}
                      </span>
                    </div>
                    {version.change_description && (
                      <p className="text-sm text-gray-600 mb-2">{version.change_description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.modified_by}
                      </span>
                      <span>{version.word_count} words</span>
                      <span>SEO: {version.seo_score}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onRestore(version)} className="gap-2">
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}