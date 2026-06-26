import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface Track {
  title: string;
  mix: string;
  url: string;
  duration: string;
}

export const SONGS: Track[] = [
  {
    title: 'Hey Pachuco!',
    mix: 'Retro Swing Mix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '6:12',
  },
  {
    title: 'Cuban Pete',
    mix: 'Rumba Tropical Mix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: '5:02',
  },
  {
    title: 'The Mask Big Band',
    mix: 'Classic Swing Jazz',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: '5:38',
  },
];

interface AudioContextType {
  isPlaying: boolean;
  currentTrackIdx: number;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTrackIdx: (idx: number) => void;
  setCurrentTime: (time: number) => void;
  setIsMuted: (muted: boolean) => void;
  togglePlay: () => void;
  handleNextTrack: () => void;
  handleSeek: (time: number) => void;
  playSynthSound: (type: 'brass' | 'rumba' | 'bass' | 'chick') => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.src = SONGS[currentTrackIdx].url;
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setCurrentTrackIdx((prev) => (prev + 1) % SONGS.length);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Sync track index
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = isPlaying;
      audioRef.current.src = SONGS[currentTrackIdx].url;
      audioRef.current.load();
      if (wasPlaying) {
        audioRef.current.play().catch((err) => {
          console.log('Autoplay blocked:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIdx]);

  // Sync play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log('Playback error:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleNextTrack = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % SONGS.length);
    setIsPlaying(true);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Sound generator synth for fun interactive sound effects!
  const playSynthSound = (type: 'brass' | 'rumba' | 'bass' | 'chick') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'brass') {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, ctx.currentTime + 0.15);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1500, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        });
      } else if (type === 'bass') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(55, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08); 
        
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        filter.Q.setValueAtTime(10, ctx.currentTime);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'chick') {
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6000, ctx.currentTime);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start();
      } else if (type === 'rumba') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.log('Web Audio context error:', e);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrackIdx,
        currentTime,
        duration,
        isMuted,
        setIsPlaying,
        setCurrentTrackIdx,
        setCurrentTime,
        setIsMuted,
        togglePlay,
        handleNextTrack,
        handleSeek,
        playSynthSound,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
