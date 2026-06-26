import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Trophy, Film, EyeOff, Calendar, Sparkles, MapPin, Compass, ArrowUpRight, Flame, Play, Pause, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { useAudio, SONGS } from '../context/AudioContext';

export default function ExplorerSection() {
  const [lang, setLang] = useState<'mn' | 'en'>('mn');
  
  // Use unified synchronized global audio player
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
    <section
      id="lithos-explorer-section"
      className="relative w-full bg-zinc-950 text-white py-24 px-6 md:px-12 border-t border-zinc-900 overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#e8702a]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 text-[#e8702a] text-xs font-mono uppercase tracking-widest mb-3">
              <Compass size={14} className="animate-spin-slow" />
              <span>Lithos Team Spotlight</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair italic font-medium leading-tight">
              {lang === 'mn' ? 'Манлайлагч Судлаачтай танилц' : 'Meet Our Chief Explorer'}
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mt-3 font-light">
              {lang === 'mn' 
                ? 'Дэлхийн гүн болон түүхийн үе давхаргыг шимтэн судлагч, Lithos-ийн онцлох залуу гишүүн.' 
                : 'A passionate explorer of Earth’s layers and geological time. Meet the featured young member of Lithos.'}
            </p>
          </div>

          {/* Language Switcher pill with layout animation */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-full self-start md:self-end">
            <button
              onClick={() => setLang('mn')}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                lang === 'mn' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {lang === 'mn' && (
                <motion.div
                  layoutId="activeLangTab"
                  className="absolute inset-0 bg-[#e8702a] rounded-full z-[-1]"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              Монгол
            </button>
            <button
              onClick={() => setLang('en')}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                lang === 'en' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {lang === 'en' && (
                <motion.div
                  layoutId="activeLangTab"
                  className="absolute inset-0 bg-[#e8702a] rounded-full z-[-1]"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              English
            </button>
          </div>
        </div>

        {/* Main Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Explorer Identity Card (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900/80 to-zinc-950 border border-zinc-800/80 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            {/* Spotlight decoration */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#e8702a]/20 rounded-full blur-2xl group-hover:bg-[#e8702a]/30 transition-all duration-500" />
            
            <div className="space-y-6">
              {/* Profile Avatar / Badge */}
              <div className="relative w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[#e8702a] shadow-inner">
                <User size={38} className="transition-transform group-hover:scale-110 duration-300" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 bg-[#e8702a] rounded-full border-2 border-zinc-950 items-center justify-center">
                  <Flame size={8} className="text-white" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-playfair italic font-medium">Цэцмөнх</span>
                  <span className="text-zinc-500 font-light text-xl">/ Tsetsmunkh</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[#e8702a]/10 text-[#e8702a] border border-[#e8702a]/20 px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase">
                    Active Member
                  </span>
                  <span className="text-zinc-500 text-xs flex items-center gap-1">
                    <MapPin size={12} />
                    Ulaanbaatar, MN
                  </span>
                </div>
              </div>

              <div className="h-[1px] bg-zinc-900" />

              {/* Bio quote based on language */}
              <p className="text-zinc-300 text-sm leading-relaxed font-light italic">
                {lang === 'mn' 
                  ? '"Сайн байна уу, намайг Цэцмөнх гэдэг. Би 12 настай, спорт болон адал явдалд маш их дуртай!"'
                  : '"Hello, my name is Tsetsmunkh. I am 12 years old, and I have a great passion for sports and adventures!"'}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500 font-mono">
              <span>LITHOS MEMBER ID</span>
              <span className="text-zinc-300 font-semibold">#L-062512</span>
            </div>
          </div>

          {/* Right Column: Bento Grid of Details (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Card 1: Age */}
            <div className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#e8702a]/10 rounded-xl text-[#e8702a]">
                  <Calendar size={20} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Demographics</span>
              </div>
              <div>
                <h4 className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">
                  {lang === 'mn' ? 'Нас' : 'Age'}
                </h4>
                <p className="text-2xl font-semibold text-white">
                  {lang === 'mn' ? '12 настай' : '12 Years Old'}
                </p>
              </div>
            </div>

            {/* Card 2: Sports */}
            <div className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#e8702a]/10 rounded-xl text-[#e8702a]">
                  <Trophy size={20} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Interests</span>
              </div>
              <div>
                <h4 className="text-xs text-zinc-400 font-mono uppercase tracking-widest mb-1">
                  {lang === 'mn' ? 'Дуртай Спорт' : 'Favorite Sports'}
                </h4>
                <p className="text-lg sm:text-xl font-medium text-white leading-snug">
                  {lang === 'mn' ? 'Сагсанбөмбөг, Волейбол' : 'Basketball, Volleyball'}
                </p>
              </div>
            </div>

            {/* Card 3: Favorite Movie & Sound Track Player Bento Grid element */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between sm:col-span-2 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-[#e8702a]/10 rounded-xl text-[#e8702a] flex items-center gap-2">
                  <Film size={18} />
                  <span className="text-xs font-semibold">
                    {lang === 'mn' ? 'Дуртай Кино & Хөгжим' : 'Favorite Movie & Soundtrack'}
                  </span>
                </div>
                
                {/* Audio Equalizer bars */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#e8702a] animate-[bounce_0.8s_infinite_100ms] h-3" />
                    <span className="w-0.5 bg-[#e8702a] animate-[bounce_0.8s_infinite_300ms] h-2" />
                    <span className="w-0.5 bg-[#e8702a] animate-[bounce_0.8s_infinite_500ms] h-4" />
                    <span className="w-0.5 bg-[#e8702a] animate-[bounce_0.8s_infinite_200ms] h-3" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Movie Title Column (5 Cols) */}
                <div className="md:col-span-5">
                  <h4 className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
                    {lang === 'mn' ? 'Сонгодог инээдмийн кино' : 'Comedy Classic'}
                  </h4>
                  <p className="text-3xl sm:text-4xl font-playfair italic font-medium text-white tracking-wide leading-tight">
                    "The Mask"
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {lang === 'mn' ? 'Жим Кэрригийн шилдэг бүтээл' : 'Starring Jim Carrey'}
                  </p>
                </div>

                {/* Built-in high fidelity sound deck (7 Cols) */}
                <div className="md:col-span-7 bg-black/40 border border-zinc-900 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-[#e8702a] font-mono tracking-wider uppercase block">
                        {lang === 'mn' ? 'Киноны Сүлд Дуу' : 'Original Sound Track'}
                      </span>
                      <h5 className="text-sm font-semibold text-white mt-0.5">
                        {SONGS[currentTrackIdx].title}
                      </h5>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {formatTime(currentTime)} / {SONGS[currentTrackIdx].duration}
                    </span>
                  </div>

                  {/* Range Slider for seeking */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={onSeekChange}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e8702a] transition-all"
                  />

                  {/* Player Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={16} className="text-zinc-500" /> : <Volume2 size={16} className="text-[#e8702a]" />}
                    </button>

                    <div className="flex items-center gap-3">
                      {/* Play/Pause Button */}
                      <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-[#e8702a] hover:bg-[#d2611f] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#e8702a]/10 cursor-pointer"
                      >
                        {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} className="ml-0.5" fill="currentColor" />}
                      </button>

                      {/* Skip Forward */}
                      <button
                        onClick={handleNextTrack}
                        className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Next Track"
                      >
                        <SkipForward size={16} />
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-600">
                      {currentTrackIdx + 1} / {SONGS.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Dislikes (Anime status) */}
            <div className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 transition-all duration-300 flex items-center justify-between sm:col-span-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800/40 rounded-xl text-zinc-500">
                  <EyeOff size={20} />
                </div>
                <div>
                  <h4 className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest mb-0.5">
                    {lang === 'mn' ? 'Сонирхолгүй зүйл' : 'Dislikes'}
                  </h4>
                  <p className="text-sm font-medium text-zinc-300">
                    {lang === 'mn' ? 'Анимэ үздэггүй' : 'Does not watch Anime'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#e8702a] bg-[#e8702a]/5 px-3 py-1 rounded-full border border-[#e8702a]/10">
                {lang === 'mn' ? 'Тодорхой' : 'Verified'}
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
