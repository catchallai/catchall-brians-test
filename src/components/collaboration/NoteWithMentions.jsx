import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SendIcon } from 'lucide-react';
import MentionInput from './MentionInput';

export default function NoteWithMentions({ entityType, entityId, businessId, onNoteAdded }) {
  const [noteText, setNoteText] = useState('');
  const [mentions, setMentions] = useState([]);
  const queryClient = useQueryClient();

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', entityType, entityId] });
      setNoteText('');
      setMentions([]);
      onNoteAdded?.();
    },
  });

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      return;
    }

    const userData = await base44.auth.me();

    await createActivityMutation.mutate({
      business_id: businessId,
      entity_type: entityType,
      entity_id: entityId,
      activity_type: 'note_added',
      title: 'Added a note',
      description: noteText,
      performed_by: userData.email,
      performed_by_name: userData.full_name,
      mentions: mentions,
    });
  };

  return (
    <div className="space-y-3">
      <MentionInput
        value={noteText}
        onChange={setNoteText}
        onMentionsChange={setMentions}
        placeholder="Add a note... Type @ to mention team members"
        businessId={businessId}
      />
      <Button
        onClick={handleAddNote}
        disabled={!noteText.trim() || createActivityMutation.isPending}
        className="w-full gap-2"
      >
        <SendIcon className="w-4 h-4" />
        Add Note
      </Button>
    </div>
  );
}
