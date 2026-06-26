import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Film, Trophy, Calendar, EyeOff, Sparkles, X, Heart, Play, Pause, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { useAudio, SONGS } from '../context/AudioContext';

export default function TsetsmunkhProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mn' | 'en'>('mn');
  
  // Use global Audio Player hook
  const {
    isPlaying,
    currentTrackIdx,
    currentTime,
    duration,
    isMuted,
    setIsMuted,
    togglePlay,
    handleNextTrack,
    handleSeek,
    playSynthSound,
  } = useAudio();

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSeek(parseFloat(e.target.value));
  };

  return (
    <>
      {/* Floating Badge Trigger */}
      <button
        id="tsetsmunkh-profile-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2.5 bg-black/80 hover:bg-black backdrop-blur-md border border-[#e8702a]/60 hover:border-[#e8702a] text-white px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 cursor-pointer group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8702a] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8702a]"></span>
        </span>
        <Music size={14} className={`text-[#e8702a] ${isPlaying ? 'animate-spin-slow' : 'group-hover:rotate-12 transition-transform'}`} />
        <span>{isPlaying ? 'Now Playing...' : 'Play Soundtrack'}</span>
      </button>

      {/* Profile Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            id="tsetsmunkh-profile-modal-overlay"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              id="tsetsmunkh-profile-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-zinc-950/95 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Top ambient color bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#e8702a] via-amber-500 to-[#e8702a]" />

              {/* Close Button */}
              <button
                id="tsetsmunkh-profile-close"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 rounded-full transition-colors cursor-pointer"
                aria-label="Close profile"
              >
                <X size={16} />
              </button>

              {/* Card Header */}
              <div className="p-6 pb-4 flex items-center gap-4 border-b border-zinc-900">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e8702a] to-amber-600 flex items-center justify-center text-white shadow-lg shadow-[#e8702a]/20">
                  <User size={28} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-1.5">
                    Tsetsmunkh
                    <Sparkles size={14} className="text-[#e8702a]" />
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
                    Lithos Explorer & Swing Fan
                  </p>
                </div>
              </div>

              {/* Language Switcher Tabs */}
              <div className="px-6 py-2 flex gap-2 justify-start bg-zinc-900/30 border-b border-zinc-900">
                <button
                  onClick={() => setActiveTab('mn')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    activeTab === 'mn'
                      ? 'bg-[#e8702a]/20 text-[#e8702a] border border-[#e8702a]/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Монгол
                </button>
                <button
                  onClick={() => setActiveTab('en')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    activeTab === 'en'
                      ? 'bg-[#e8702a]/20 text-[#e8702a] border border-[#e8702a]/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  English
                </button>
              </div>

              {/* Profile Details (Age, sports, movie, anime) */}
              <div className="p-6 pb-4 border-b border-zinc-900 space-y-4">
                {activeTab === 'mn' ? (
                  <div className="space-y-3">
                    <p className="text-zinc-300 text-sm leading-relaxed font-light italic">
                      "Сайн байна уу, намайг Цэцмөнх гэдэг. Би 12 настай бөгөөд спортоор хичээллэх дуртай."
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Нас</span>
                        <span className="text-sm font-semibold text-white">12 настай</span>
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Кино</span>
                        <span className="text-sm font-semibold text-white">The Mask 🎭</span>
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 col-span-2">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Спорт</span>
                        <span className="text-sm font-semibold text-white">Сагсан бөмбөг, Волейбол 🏀🏐</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-zinc-300 text-sm leading-relaxed font-light italic">
                      "Hello, my name is Tsetsmunkh. I am 12 years old, and I love playing sports."
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Age</span>
                        <span className="text-sm font-semibold text-white">12 years old</span>
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Fav Movie</span>
                        <span className="text-sm font-semibold text-white">The Mask 🎭</span>
                      </div>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 col-span-2">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Sports Played</span>
                        <span className="text-sm font-semibold text-white">Basketball, Volleyball 🏀🏐</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* The Mask Soundtrack Audio Player Section */}
              <div className="p-6 bg-zinc-950 border-b border-zinc-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music size={16} className="text-[#e8702a]" />
                    <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
                      The Mask Sound Deck
                    </span>
                  </div>
                  {/* Equalizer animation when playing */}
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-[#e8702a] animate-[bounce_1s_infinite_100ms] h-3" />
                      <span className="w-0.5 bg-[#e8702a] animate-[bounce_1s_infinite_300ms] h-2" />
                      <span className="w-0.5 bg-[#e8702a] animate-[bounce_1s_infinite_500ms] h-4" />
                      <span className="w-0.5 bg-[#e8702a] animate-[bounce_1s_infinite_200ms] h-3" />
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {SONGS[currentTrackIdx].title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {SONGS[currentTrackIdx].mix}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    {formatTime(currentTime)} / {SONGS[currentTrackIdx].duration || SONGS[currentTrackIdx].duration}
                  </span>
                </div>

                {/* Seek Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={onSeekChange}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e8702a]"
                  />
                </div>

                {/* Main Player Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-[#e8702a] hover:bg-[#d2611f] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#e8702a]/20 cursor-pointer"
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-0.5" fill="currentColor" />}
                    </button>

                    {/* Next Track */}
                    <button
                      onClick={handleNextTrack}
                      className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <SkipForward size={18} />
                    </button>
                  </div>

                  <span className="text-xs font-mono text-zinc-600">Track {currentTrackIdx + 1}/3</span>
                </div>
              </div>

              {/* Interactive Web Audio Synthesizer pads */}
              <div className="p-6 bg-zinc-900/20 space-y-3">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase block">
                  Interactive Sound FX Pads (Web Audio Synth)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => playSynthSound('brass')}
                    className="bg-zinc-900 hover:bg-[#e8702a]/20 hover:border-[#e8702a]/40 border border-zinc-800 p-2.5 rounded-xl text-center text-xs text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="block text-base mb-1">🎺</span>
                    <span className="block font-mono text-[9px] text-zinc-500">Brass Hit</span>
                  </button>
                  <button
                    onClick={() => playSynthSound('rumba')}
                    className="bg-zinc-900 hover:bg-[#e8702a]/20 hover:border-[#e8702a]/40 border border-zinc-800 p-2.5 rounded-xl text-center text-xs text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="block text-base mb-1">🪘</span>
                    <span className="block font-mono text-[9px] text-zinc-500">Rumba</span>
                  </button>
                  <button
                    onClick={() => playSynthSound('chick')}
                    className="bg-zinc-900 hover:bg-[#e8702a]/20 hover:border-[#e8702a]/40 border border-zinc-800 p-2.5 rounded-xl text-center text-xs text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="block text-base mb-1">shaker</span>
                    <span className="block font-mono text-[9px] text-zinc-500">Chic</span>
                  </button>
                  <button
                    onClick={() => playSynthSound('bass')}
                    className="bg-zinc-900 hover:bg-[#e8702a]/20 hover:border-[#e8702a]/40 border border-zinc-800 p-2.5 rounded-xl text-center text-xs text-white transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="block text-base mb-1">🎸</span>
                    <span className="block font-mono text-[9px] text-zinc-500">Bass Line</span>
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-[#e8702a]" />
                  Tsetsmunkh Playlist
                </span>
                <span className="font-mono">ID: explorer_2026</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
