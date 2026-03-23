import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, Send } from 'lucide-react';

export default function ComposeOutreachModal({ open, onClose, journalist, journalists }) {
  const [selectedJournalist, setSelectedJournalist] = useState('');
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [pressRelease, setPressRelease] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (journalist) {
      setSelectedJournalist(journalist.id);
    }
  }, [journalist, open]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaOutreach.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-outreach'] });
      handleClose();
    },
  });

  const generateEmail = async () => {
    const j = journalists.find((jr) => jr.id === selectedJournalist);
    if (!j) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a personalized pitch email to:
Journalist: ${j.name}
Outlet: ${j.outlet}
Beat: ${j.beat?.join(', ')}

Create a compelling, concise pitch email that:
- Has an attention-grabbing subject line
- Is personalized to their beat
- Provides value/news angle
- Includes a clear call to action
- Is under 200 words`,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            email_content: { type: 'string' },
          },
        },
      });
      setSubject(result.subject || '');
      setEmailContent(result.email_content || '');
    } catch (error) {
      console.error('Generation failed:', error);
    }
    setIsGenerating(false);
  };

  const handleClose = () => {
    setSelectedJournalist('');
    setSubject('');
    setEmailContent('');
    setPressRelease('');
    setFollowUpDate('');
    onClose();
  };

  const handleSave = (status) => {
    saveMutation.mutate({
      journalist_id: selectedJournalist,
      subject,
      email_content: emailContent,
      press_release: pressRelease,
      follow_up_date: followUpDate || null,
      status,
      ai_generated: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Outreach</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Journalist *</Label>
            <Select value={selectedJournalist} onValueChange={setSelectedJournalist}>
              <SelectTrigger>
                <SelectValue placeholder="Select journalist" />
              </SelectTrigger>
              <SelectContent>
                {journalists.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name} - {j.outlet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={generateEmail}
            disabled={isGenerating || !selectedJournalist}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI Generate Email
          </Button>

          <div>
            <Label>Subject Line *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label>Email Content *</Label>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Write your pitch..."
              rows={8}
            />
          </div>

          <div>
            <Label>Press Release (Optional)</Label>
            <Textarea
              value={pressRelease}
              onChange={(e) => setPressRelease(e.target.value)}
              placeholder="Attach press release content..."
              rows={4}
            />
          </div>

          <div>
            <Label>Schedule Follow-up</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saveMutation.isPending || !selectedJournalist || !subject}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave('sent')}
              disabled={saveMutation.isPending || !selectedJournalist || !subject || !emailContent}
              className="gap-2"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
