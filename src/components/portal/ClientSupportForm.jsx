import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';

const FEEDBACK_TYPES = [
  { value: 'general', label: 'General Feedback' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug / Issue Report' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'nps', label: 'Overall Satisfaction' },
];

const CATEGORIES = [
  { value: 'support', label: 'Support' },
  { value: 'product_quality', label: 'Product Quality' },
  { value: 'usability', label: 'Usability' },
  { value: 'performance', label: 'Performance' },
  { value: 'feature_gap', label: 'Missing Feature' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  new:      { label: 'Submitted',  color: 'bg-blue-100 text-blue-700 border-blue-200',  icon: Clock },
  reviewed: { label: 'In Review',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
  actioned: { label: 'Actioned',   color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  archived: { label: 'Archived',   color: 'bg-gray-100 text-gray-600 border-gray-200',  icon: MessageSquare },
};

const DEFAULT_FORM = {
  feedback_type: '',
  category: '',
  message: '',
  nps_score: '',
};

export default function ClientSupportForm({ user }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  // Find contact record by email (for linking)
  const { data: contacts = [] } = useQuery({
    queryKey: ['portal-contact', user?.email],
    queryFn: () => base44.entities.Contact.filter({ email: user?.email }),
    enabled: !!user?.email,
  });
  const contact = contacts[0];

  // Fetch previous submissions by this contact
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['portal-feedback', contact?.id],
    queryFn: () =>
      base44.entities.CustomerFeedback.filter({ contact_id: contact.id }),
    enabled: !!contact?.id,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomerFeedback.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-feedback'] });
      setForm(DEFAULT_FORM);
      setShowForm(false);
      toast.success('Your request has been submitted. We\'ll be in touch soon!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.feedback_type || !form.message.trim()) {
      toast.error('Please fill in the required fields.');
      return;
    }

    // Derive sentiment from NPS score
    let sentiment = 'neutral';
    if (form.feedback_type === 'nps' && form.nps_score !== '') {
      const score = parseInt(form.nps_score);
      sentiment = score >= 9 ? 'positive' : score <= 6 ? 'negative' : 'neutral';
    }

    submitMutation.mutate({
      contact_id: contact?.id || 'portal-user',
      contact_name: user?.full_name || user?.email,
      company_name: contact?.company_name || '',
      feedback_type: form.feedback_type,
      category: form.category || 'support',
      message: form.message,
      nps_score: form.feedback_type === 'nps' && form.nps_score !== '' ? parseInt(form.nps_score) : undefined,
      sentiment,
      status: 'new',
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Support & Feedback</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Submit a support request, report an issue, or share feedback. Our team typically responds within 1 business day.
            </p>
          </div>
          {!showForm && (
            <Button className="ml-auto shrink-0 gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> New Request
            </Button>
          )}
        </div>
      </Card>

      {/* Submission form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Submit a Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.feedback_type}
                    onValueChange={v => setForm(f => ({ ...f, feedback_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <Select
                    value={form.category}
                    onValueChange={v => setForm(f => ({ ...f, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.feedback_type === 'nps' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Satisfaction Score (0 = Very Dissatisfied, 10 = Extremely Satisfied)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, nps_score: String(n) }))}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-all ${
                          form.nps_score === String(n)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Describe your request or feedback in detail…"
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitMutation.isPending} className="gap-2">
                  <Send className="w-4 h-4" />
                  {submitMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Previous submissions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Your Submissions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : submissions.length === 0 ? (
          <Card className="p-10 text-center">
            <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No submissions yet. We'd love to hear from you!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.new;
              const StatusIcon = cfg.icon;
              const typeLabel = FEEDBACK_TYPES.find(t => t.value === s.feedback_type)?.label || s.feedback_type;
              return (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                          <StatusIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{typeLabel}</p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{s.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted {s.created_date ? format(new Date(s.created_date), 'MMM d, yyyy') : 'recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                        {s.feedback_type === 'nps' && s.nps_score != null && (
                          <span className="text-xs text-gray-400">Score: {s.nps_score}/10</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}