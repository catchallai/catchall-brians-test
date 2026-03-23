import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot } from 'lucide-react';
import moment from 'moment';

export default function CommentThread({ project, comments, user }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.ProjectComment.create({
        project_id: project.id,
        author: user?.email,
        author_name: user?.full_name,
        content,
        mentions: extractMentions(content),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-comments'] });
      setNewComment('');
    },
  });

  const extractMentions = (text) => {
    const matches = text.match(/@[\w.]+@[\w.]+/g) || [];
    return matches.map((m) => m.slice(1));
  };

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <ScrollArea className="h-96 mb-4">
          <div className="space-y-4">
            {sortedComments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Start the conversation!
              </p>
            ) : (
              sortedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${comment.is_ai_generated ? 'bg-violet-50 p-3 rounded-lg' : ''}`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    {comment.is_ai_generated ? (
                      <AvatarFallback className="bg-violet-100 text-violet-600">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {comment.author_name?.[0] || comment.author?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {comment.is_ai_generated
                          ? 'AI Assistant'
                          : comment.author_name || comment.author}
                      </span>
                      {comment.is_ai_generated && (
                        <Badge className="bg-violet-100 text-violet-700 text-xs">AI</Badge>
                      )}
                      <span className="text-xs text-gray-400">
                        {moment(comment.created_date).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    {comment.related_item_type && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Re: {comment.related_item_type}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... Use @email to mention someone"
            className="flex-1 min-h-[60px]"
          />
          <Button
            onClick={() => createCommentMutation.mutate(newComment)}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
