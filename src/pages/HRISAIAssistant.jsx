import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, User, Bot, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  'What is the current headcount by department?',
  'Who has pending time-off requests?',
  'Summarize recent performance reviews',
  'Which employees have birthdays this month?',
  'What trainings are currently active?',
  'Show me upcoming contract expirations',
  'Who are the top recognition recipients this year?',
  'What is the average tenure of active employees?',
];

export default function HRISAIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your HR AI Assistant. Ask me anything about your employees, time off, performance, training, and more.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const { data: employees = [] } = useQuery({ queryKey: ['hris-employees-ai'], queryFn: () => base44.entities.HRISEmployee.list() });
  const { data: timeOff = [] } = useQuery({ queryKey: ['hris-timeoff-ai'], queryFn: () => base44.entities.HRISTimeOffRequest.list() });
  const { data: reviews = [] } = useQuery({ queryKey: ['hris-reviews-ai'], queryFn: () => base44.entities.HRISPerformanceReview.list() });
  const { data: trainings = [] } = useQuery({ queryKey: ['hris-trainings-ai'], queryFn: () => base44.entities.TalentTraining.list() });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    const context = `
HR System Context:
- Total employees: ${employees.length}
- Active employees: ${employees.filter(e => e.status === 'active').length}
- Departments: ${[...new Set(employees.map(e => e.department).filter(Boolean))].join(', ')}
- Pending time-off requests: ${timeOff.filter(t => t.status === 'pending_approval').length}
- Recent performance reviews: ${reviews.length} total, ${reviews.filter(r => r.status === 'completed').length} completed
- Active trainings: ${trainings.filter(t => t.status === 'active').length}

Employee summary: ${employees.slice(0, 10).map(e => `${e.full_name} (${e.department}, ${e.job_title}, ${e.status})`).join('; ')}

Time off summary: ${timeOff.slice(0, 5).map(t => `${t.employee_name}: ${t.type} ${t.start_date}–${t.end_date} (${t.status})`).join('; ')}
    `.trim();

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an HR AI assistant. Answer the user's HR question using the context below. Be concise and helpful.\n\nContext:\n${context}\n\nQuestion: ${userMsg}`,
    });

    setMessages((m) => [...m, { role: 'assistant', content: result }]);
    setLoading(false);
  };

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-violet-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR AI Assistant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ask anything about your people and HR data</p>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => sendMessage(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-800 transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-600" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-tl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <Input
            placeholder="Ask about your HR data…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}