import { useState } from 'react';
import { Menu, X, Globe, Map, Sparkles, BookOpen, User, Trophy, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  onOpenIdolChat: () => void;
}

export default function Navigation({ onOpenIdolChat }: NavigationProps) {
  const [activeTab, setActiveTab] = useState('Course');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = ['Course', 'Field Guides', 'Geology', 'Plans', 'Live Tour', '🎮 Games', '🤖 My Idol'];

  return (
    <>
      <nav id="main-navigation" className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent">
        {/* Left Side: Logo & Wordmark */}
        <div id="nav-brand-logo" className="flex items-center gap-2.5 select-none group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 256 256"
            fill="#ffffff"
            className="transition-transform duration-700 ease-out group-hover:rotate-180"
          >
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Lithos
          </span>
        </div>

        {/* Center Pill: Desktop Only */}
        <div
          id="nav-center-pill"
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-1.5 items-center gap-1 shadow-lg shadow-black/25"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                id={`nav-item-${item.toLowerCase().replace(' ', '-')}`}
                onClick={() => {
                  if (item === '🤖 My Idol') {
                    onOpenIdolChat();
                  } else if (item === '🎮 Games') {
                    setActiveTab(item);
                    document.getElementById('lithos-games-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setActiveTab(item);
                    document.getElementById('lithos-explorer-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all relative ${
                  isActive
                    ? 'text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    id="active-nav-bg"
                    className="absolute inset-0 bg-white/10 rounded-full z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Desktop Sign Up / Mobile Hamburger Toggle */}
        <div id="nav-right-actions" className="flex items-center gap-3">
          {/* Desktop Sign Up */}
          <button
            id="nav-btn-signup"
            className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 hover:scale-[1.03] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Sign Up
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            id="nav-btn-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-x-0 top-0 pt-20 pb-8 px-5 bg-black/95 backdrop-blur-xl border-b border-white/10 z-[90] flex flex-col gap-6 md:hidden shadow-2xl"
          >
            <div id="mobile-nav-list" className="flex flex-col gap-1.5">
              {navItems.map((item, index) => {
                const isActive = activeTab === item;
                const Icon =
                  item === 'Course' ? BookOpen :
                  item === 'Field Guides' ? Map :
                  item === 'Geology' ? Globe :
                  item === 'Plans' ? Sparkles :
                  item === '🎮 Games' ? Gamepad2 :
                  item === '🤖 My Idol' ? Trophy :
                  Globe;

                return (
                  <motion.button
                    key={item}
                    id={`mobile-nav-item-${item.toLowerCase().replace(' ', '-')}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (item === '🤖 My Idol') {
                        onOpenIdolChat();
                      } else if (item === '🎮 Games') {
                        setActiveTab(item);
                        document.getElementById('lithos-games-section')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setActiveTab(item);
                        document.getElementById('lithos-explorer-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-left font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white shadow-inner'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#e8702a]' : 'text-white/60'} />
                    <span>{item}</span>
                  </motion.button>
                );
              })}
            </div>

            <div id="mobile-nav-footer" className="h-[1px] bg-white/10 my-1" />

            <motion.button
              id="mobile-nav-btn-signup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: navItems.length * 0.05 }}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-[#e8702a] text-white py-3.5 rounded-full font-semibold text-sm hover:bg-[#d2611f] active:scale-[0.98] transition-all shadow-lg shadow-[#e8702a]/20"
            >
              <User size={16} />
              Sign Up
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
