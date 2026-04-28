import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BarChart3, Plus, X } from 'lucide-react';

export default function PollWidget({ channelId, user }) {
  const [polls, setPolls] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const loadPolls = async () => {
    try {
      const activePoll = await base44.entities.Poll.filter({
        channel_id: channelId,
        status: 'active',
      });
      setPolls(activePoll || []);
    } catch (err) {
      console.error('Failed to load polls:', err);
    }
  };

  React.useEffect(() => {
    loadPolls();
  }, [channelId]);

  const createPoll = async () => {
    if (!pollQuestion || pollOptions.filter((o) => o.trim()).length < 2) {
      return;
    }

    try {
      const formattedOptions = pollOptions
        .filter((o) => o.trim())
        .map((text, idx) => ({
          id: `opt-${idx}`,
          text: text.trim(),
          votes: [],
          vote_count: 0,
        }));

      await base44.entities.Poll.create({
        channel_id: channelId,
        question: pollQuestion,
        options: formattedOptions,
        created_by: user?.email,
        created_by_name: user?.full_name,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setPollQuestion('');
      setPollOptions(['', '']);
      setShowCreatePoll(false);
      await loadPolls();
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
  };

  const vote = async (pollId, optionId) => {
    try {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) {
        return;
      }

      const updatedOptions = poll.options.map((opt) => {
        if (opt.id === optionId) {
          const votes = [...(opt.votes || [])];
          if (!votes.includes(user?.email)) {
            votes.push(user?.email);
          }
          return { ...opt, votes, vote_count: votes.length };
        }
        return opt;
      });

      await base44.entities.Poll.update(pollId, {
        options: updatedOptions,
        total_votes: updatedOptions.reduce((sum, opt) => sum + opt.vote_count, 0),
      });

      await loadPolls();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const closePoll = async (pollId) => {
    try {
      await base44.entities.Poll.update(pollId, { status: 'closed' });
      await loadPolls();
    } catch (err) {
      console.error('Failed to close poll:', err);
    }
  };

  const maxVotes = Math.max(...polls.flatMap((p) => p.options.map((o) => o.vote_count)), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Quick Polls
        </h3>
        <Dialog open={showCreatePoll} onOpenChange={setShowCreatePoll}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a Poll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="What's your question?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Options</label>
                {pollOptions.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Option ${idx + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[idx] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                    />
                    {idx >= 2 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newOptions = pollOptions.filter((_, i) => i !== idx);
                          setPollOptions(newOptions);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                >
                  Add Option
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreatePoll(false)}>
                  Cancel
                </Button>
                <Button onClick={createPoll} className="bg-blue-600 hover:bg-blue-700">
                  Create Poll
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {polls.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">No active polls</p>
        ) : (
          polls.map((poll) => {
            return (
              <Card key={poll.id} className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900 mb-2">{poll.question}</p>
                    <Badge variant="outline" className="text-xs">
                      {poll.total_votes} votes
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {poll.options?.map((option) => {
                      const percentage = maxVotes > 0 ? (option.vote_count / maxVotes) * 100 : 0;
                      const userVoted = option.votes?.includes(user?.email);
                      return (
                        <button
                          key={option.id}
                          onClick={() => vote(poll.id, option.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-sm ${userVoted ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                            >
                              {option.text}
                            </span>
                            <span className="text-xs text-gray-600">{option.vote_count}</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2 border border-blue-200 overflow-hidden">
                            <div
                              className={`h-full transition-all ${userVoted ? 'bg-blue-600' : 'bg-blue-400'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {poll.created_by === user?.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closePoll(poll.id)}
                      className="w-full text-xs"
                    >
                      Close Poll
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
