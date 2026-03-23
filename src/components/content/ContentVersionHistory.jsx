import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, RotateCcw, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContentVersionHistory({ articleId, open, onClose, onRestore }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['content-versions', articleId],
    queryFn: async () => {
      if (!articleId) {
        return [];
      }
      return await base44.entities.ContentVersion.filter(
        { article_id: articleId },
        '-version_number'
      );
    },
    enabled: !!articleId && open,
  });

  const { data: article } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      if (!articleId) {
        return null;
      }
      const articles = await base44.entities.GeneratedArticle.filter({ id: articleId });
      return articles[0];
    },
    enabled: !!articleId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No version history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current Version */}
            {article && (
              <Card className="border-2 border-violet-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-violet-600 text-white">Current</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(article.updated_date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {article.content?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{article.word_count} words</span>
                        <span>SEO: {article.seo_score}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Versions */}
            {versions.map((version) => (
              <Card key={version.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Version {version.version_number}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(version.created_date).toLocaleString()}
                        </span>
                      </div>
                      {version.modified_by && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <User className="w-3 h-3" />
                          {version.modified_by}
                        </div>
                      )}
                      {version.change_description && (
                        <p className="text-sm text-gray-700 mb-2">{version.change_description}</p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {version.content?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{version.word_count} words</span>
                        {version.seo_score && <span>SEO: {version.seo_score}%</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(version)}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
