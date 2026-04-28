export class ScreenRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  async startRecording(screenStream) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;

      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();
      const audioTracks = screenStream.getAudioTracks();

      audioTracks.forEach((track) => {
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(audioDestination);
      });

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();

      canvasStream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      audioDestination.stream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });

      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Failed to start screen recording:', err);
      return false;
    }
  }

  stopRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      filename: `screen-recording-${Date.now()}.webm`,
    };
  }

  getRecordingStatus() {
    return this.isRecording;
  }
}
