import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trophy, Star, Rocket, Heart, Zap, Diamond } from 'lucide-react';
import { format } from 'date-fns';

const BADGES = {
  star: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  rocket: { icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  heart: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  trophy: { icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  lightning: { icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  diamond: { icon: Diamond, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
};

const CATEGORIES = ['teamwork', 'innovation', 'leadership', 'customer_focus', 'above_and_beyond', 'milestone', 'values'];

const EMPTY = {
  recipient_name: '', recipient_department: '', giver_name: '',
  category: 'above_and_beyond', message: '', points: 10, badge: 'star', is_public: true,
};

export default function HRISRecognition() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: recognitions = [] } = useQuery({
    queryKey: ['hris-recognitions'],
    queryFn: () => base44.entities.HRISRecognition.list('-created_date'),
  });

  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: () => base44.auth.me() });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.HRISRecognition.create({ ...data, giver_name: data.giver_name || user?.full_name || 'Anonymous' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hris-recognitions'] }); setOpen(false); setForm(EMPTY); },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Leaderboard: top recipients by points
  const leaderboard = Object.values(
    recognitions.reduce((acc, r) => {
      const key = r.recipient_name || 'Unknown';
      if (!acc[key]) acc[key] = { name: key, department: r.recipient_department, points: 0, count: 0 };
      acc[key].points += r.points || 0;
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.points - a.points).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Employee Recognition
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Celebrate achievements and shout out great work</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Give Recognition</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300">Recognition Feed</h2>
          {recognitions.length === 0 && (
            <div className="text-center py-12 text-gray-400">No recognitions yet. Be the first!</div>
          )}
          {recognitions.map((r) => {
            const badge = BADGES[r.badge] || BADGES.star;
            const BadgeIcon = badge.icon;
            return (
              <Card key={r.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${badge.bg}`}>
                      <BadgeIcon className={`w-6 h-6 ${badge.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">{r.recipient_name}</span>
                        {r.recipient_department && <span className="text-xs text-gray-400">{r.recipient_department}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700`}>
                          {r.category?.replace(/_/g, ' ')}
                        </span>
                        <span className="ml-auto text-xs font-bold text-yellow-600">+{r.points} pts</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">"{r.message}"</p>
                      <p className="text-xs text-gray-400 mt-1">
                        From {r.giver_name} · {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Leaderboard</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {leaderboard.length === 0 && <p className="text-sm text-gray-400">No data yet.</p>}
              {leaderboard.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.name}</p>
                    <p className="text-xs text-gray-400">{entry.count} recognition{entry.count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-violet-600">{entry.points} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Give Recognition</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Recipient Name</Label>
                <Input value={form.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Department</Label>
                <Input value={form.recipient_department} onChange={(e) => set('recipient_department', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Category</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Badge</Label>
                <Select value={form.badge} onValueChange={(v) => set('badge', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(BADGES).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Points</Label>
              <Input type="number" value={form.points} onChange={(e) => set('points', Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Message</Label>
              <Textarea rows={3} placeholder="Write a meaningful message…" value={form.message} onChange={(e) => set('message', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Sending…' : 'Give Recognition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}