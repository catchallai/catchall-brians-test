import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Video as VideoIcon, Loader } from 'lucide-react';

export default function PublicCallJoin() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadCallDetails();
  }, [callId]);

  const loadCallDetails = async () => {
    try {
      const calls = await base44.entities.VideoCall.filter({ room_id: callId });
      if (calls.length === 0) {
        setError('Call not found or has ended');
        return;
      }

      const callData = calls[0];
      if (callData.status !== 'active') {
        setError('This call has ended');
        return;
      }

      if (!callData.settings?.allow_public_join) {
        setError('Public joining is not allowed for this call');
        return;
      }

      setCall(callData);
    } catch (err) {
      setError('Failed to load call details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setJoining(true);
    try {
      const updatedParticipants = [
        ...(call.participants || []),
        {
          email: `guest-${Date.now()}@public`,
          name: guestName,
          joined_at: new Date().toISOString(),
          is_screen_sharing: false,
        },
      ];

      await base44.entities.VideoCall.update(call.id, {
        participants: updatedParticipants,
      });

      // Store guest info in session storage for the call interface
      sessionStorage.setItem(
        `call-${callId}-guest`,
        JSON.stringify({
          name: guestName,
          joinedAt: new Date().toISOString(),
        })
      );

      navigate(`/call/${callId}`, { state: { guestName, isGuest: true } });
    } catch (err) {
      setError('Failed to join call');
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="flex items-center justify-center gap-3">
            <Loader className="w-5 h-5 animate-spin text-violet-600" />
            <p className="text-gray-600">Loading call details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p className="font-semibold">{error}</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
            <VideoIcon className="w-8 h-8 text-violet-600" />
          </div>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Join Call</h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          You've been invited to join a video call
        </p>

        {/* Call Info */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Call Host</p>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-violet-600 text-white text-xs">
                {call?.started_by?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-gray-900">{call?.started_by || 'Host'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {call?.participants?.length || 1} participant(s) currently in call
          </p>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
          <Input
            placeholder="Enter your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            autoFocus
            className="w-full"
          />
        </div>

        {/* Join Button */}
        <Button
          onClick={handleJoin}
          disabled={!guestName.trim() || joining}
          className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
        >
          {joining ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <VideoIcon className="w-4 h-4" />
              Join Call
            </>
          )}
        </Button>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          💡 Tip: Allow camera and microphone access when prompted
        </p>
      </Card>
    </div>
  );
}
