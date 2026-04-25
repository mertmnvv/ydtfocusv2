"use client";

export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq, time, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.1, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    // Rising "Success" Arpeggio (C5 - E5 - G5)
    playNote(523.25, now, 0.4);
    playNote(659.25, now + 0.1, 0.4);
    playNote(783.99, now + 0.2, 0.5);
  } catch (e) {}
};

export const playErrorSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq, time, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle'; // Warmer/Thicker sound
      osc.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.2, time + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    // Descending "Failure" Pulse (A2 - A1)
    playNote(110.00, now, 0.3);
    playNote(73.42, now + 0.15, 0.4);
  } catch (e) {}
};
