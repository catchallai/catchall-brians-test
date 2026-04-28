import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [videoQuality, setVideoQuality] = useState('hd'); // 'sd', 'hd', 'fhd'
  const [mutedParticipants, setMutedParticipants] = useState({}); // Track muted participants
  const [recordingChunks, setRecordingChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const peerConnections = useRef({});
  const localStreamRef = useRef(null);

  const qualityConstraints = {
    sd: { width: 640, height: 480, frameRate: 15 },
    hd: { width: 1280, height: 720, frameRate: 24 },
    fhd: { width: 1920, height: 1080, frameRate: 30 },
  };

  const initializeLocalStream = useCallback(async () => {
    try {
      const constraints = {
        video: qualityConstraints[videoQuality],
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  }, [videoQuality]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled((prev) => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  }, []);

  const changeVideoQuality = useCallback(async (quality) => {
    setVideoQuality(quality);
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const constraints = qualityConstraints[quality];

      for (const track of videoTracks) {
        try {
          await track.applyConstraints(constraints);
        } catch (error) {
          console.error('Error applying video constraints:', error);
        }
      }
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      // Replace video track with screen share track
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = Object.values(peerConnections.current)[0]
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender && localStreamRef.current) {
        await sender.replaceTrack(screenTrack);

        // When screen sharing stops, revert to camera
        screenTrack.onended = async () => {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        };
      }

      return true;
    } catch (error) {
      console.error('Error starting screen share:', error);
      return false;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      const sender = Object.values(peerConnections.current)[0]
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender && localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      return true;
    } catch (error) {
      console.error('Error stopping screen share:', error);
      return false;
    }
  }, []);

  const muteParticipant = useCallback((participantEmail) => {
    setMutedParticipants((prev) => ({
      ...prev,
      [participantEmail]: true,
    }));
  }, []);

  const unmuteParticipant = useCallback((participantEmail) => {
    setMutedParticipants((prev) => {
      const updated = { ...prev };
      delete updated[participantEmail];
      return updated;
    });
  }, []);

  const startRecording = useCallback(async () => {
    if (!localStream) {
      return null;
    }

    try {
      const recordedChunks = [];
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(localStream);
      const destination = audioContext.createMediaStreamDestination();

      source.connect(destination);

      // Combine local and remote audio/video
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;

      const combinedStream = new MediaStream([
        ...destination.stream.getAudioTracks(),
        ...canvas.captureStream(30).getVideoTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingChunks(recordedChunks);

      return recorder;
    } catch (error) {
      console.error('Error starting recording:', error);
      return null;
    }
  }, [localStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordingChunks, { type: 'video/webm' });
          resolve(blob);
        };
        mediaRecorder.stop();
        setMediaRecorder(null);
        setRecordingChunks([]);
      });
    }
    return null;
  }, [mediaRecorder, recordingChunks]);

  const createPeerConnection = useCallback((participantId) => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [participantId]: event.streams[0],
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        delete peerConnections.current[participantId];
        setRemoteStreams((prev) => {
          const updated = { ...prev };
          delete updated[participantId];
          return updated;
        });
      }
    };

    peerConnections.current[participantId] = pc;
    return pc;
  }, []);

  const cleanupConnections = useCallback(() => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    setRemoteStreams({});
    setLocalStream(null);
    localStreamRef.current = null;
  }, []);

  useEffect(() => {
    return cleanupConnections;
  }, [cleanupConnections]);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    videoQuality,
    mutedParticipants,
    initializeLocalStream,
    toggleAudio,
    toggleVideo,
    changeVideoQuality,
    startScreenShare,
    stopScreenShare,
    muteParticipant,
    unmuteParticipant,
    startRecording,
    stopRecording,
    createPeerConnection,
    cleanupConnections,
  };
}
