// Notification sound utilities
export const playNotificationSound = (soundType = 'bell') => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;

  const sounds = {
    bell: () => {
      const notes = [
        { freq: 523.25, duration: 0.1 },
        { freq: 659.25, duration: 0.1 },
        { freq: 783.99, duration: 0.2 },
      ];

      notes.forEach((note, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = note.freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + note.duration);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + note.duration);
      });
    },

    chime: () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.5);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    },

    ding: () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 600;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    },

    pop: () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    },

    whoosh: () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    },
  };

  if (sounds[soundType]) {
    sounds[soundType]();
  }
};

// Check if in do-not-disturb time
export const isInDND = (dndStartTime, dndEndTime) => {
  if (!dndStartTime || !dndEndTime) {
    return false;
  }

  const now = new Date();
  const [startHour, startMin] = dndStartTime.split(':').map(Number);
  const [endHour, endMin] = dndEndTime.split(':').map(Number);

  const startDate = new Date();
  startDate.setHours(startHour, startMin, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMin, 0);

  // Handle overnight DND (e.g., 22:00 to 08:00)
  if (startDate > endDate) {
    return now >= startDate || now < endDate;
  }

  return now >= startDate && now < endDate;
};
