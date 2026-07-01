/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import Navigation from './components/Navigation';
import RevealLayer from './components/RevealLayer';
import HeroContent from './components/HeroContent';
import TsetsmunkhProfile from './components/TsetsmunkhProfile';
import ExplorerSection from './components/ExplorerSection';
import GamesArea from './components/GamesArea';
import IdolChat from './components/IdolChat';
import MeChat from './components/MeChat';

// Asset URLs exactly as specified
const BG_IMAGE_1 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85';
const BG_IMAGE_2 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85';

export default function App() {
  // Refs for tracking mouse with linear interpolation (smoothing)
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);

  // State to track cursor position
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });

  // State for AI chatbots
  const [isIdolChatOpen, setIsIdolChatOpen] = useState(false);

  useEffect(() => {
    // Mouse listener
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      // Quick snap initialization on first movement to avoid slide-in from outside
      if (smooth.current.x === -999 && smooth.current.y === -999) {
        smooth.current = { x: e.clientX, y: e.clientY };
        setCursorPos({ x: e.clientX, y: e.clientY });
      }
    };

    // Touch listener for mobile/tablet interactive support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.current = { x: touch.clientX, y: touch.clientY };
        // Quick snap initialization on first touch
        if (smooth.current.x === -999 && smooth.current.y === -999) {
          smooth.current = { x: touch.clientX, y: touch.clientY };
          setCursorPos({ x: touch.clientX, y: touch.clientY });
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouse.current = { x: touch.clientX, y: touch.clientY };
        smooth.current = { x: touch.clientX, y: touch.clientY };
        setCursorPos({ x: touch.clientX, y: touch.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // RequestAnimationFrame LERP Loop
    const updateSpotlight = () => {
      if (smooth.current.x !== -999 && smooth.current.y !== -999 && mouse.current.x !== -999) {
        // LERP: smoothPosition += (targetPosition - smoothPosition) * coefficient (0.1 for nice soft fluid lag)
        smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
        smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
        setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      }
      rafRef.current = requestAnimationFrame(updateSpotlight);
    };

    rafRef.current = requestAnimationFrame(updateSpotlight);

    // Clean up
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      id="lithos-app-root"
      className="min-h-screen bg-white tracking-[-0.02em] selection:bg-[#e8702a]/30 selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Premium Fixed Top Navigation bar */}
      <Navigation onOpenIdolChat={() => setIsIdolChatOpen(true)} />

      {/* Main Hero Section */}
      <section
        id="lithos-hero-section"
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: '100dvh' }}
      >
        {/* Layer 1: Base Image (z-10) with Ken Burns zoom-out effect */}
        <div
          id="base-image-layer"
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom transition-transform duration-1000"
          style={{
            backgroundImage: `url(${BG_IMAGE_1})`,
          }}
        />

        {/* Layer 2: Reveal Spotlight Layer (z-30) */}
        <RevealLayer
          image={BG_IMAGE_2}
          cursorX={cursorPos.x}
          cursorY={cursorPos.y}
        />

        {/* Ambient bottom shadow gradient (z-40) to enhance readability */}
        <div
          id="hero-bottom-gradient"
          className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-t from-black/50 via-black/10 to-transparent"
        />

        {/* Layer 3: Typography Headings, Paragraphs, Buttons, and Layout Text (z-50) */}
        <HeroContent />

        {/* Floating Instruction Hint (Disappears as soon as user interacts) */}
        {cursorPos.x === -999 && (
          <div
            id="interaction-hint-container"
            className="absolute inset-x-0 bottom-28 sm:bottom-12 flex justify-center pointer-events-none z-50 animate-bounce"
          >
            <div
              id="interaction-hint-bubble"
              className="bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full flex items-center gap-2 text-white/90 text-xs tracking-wider uppercase font-medium shadow-2xl"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#e8702a] animate-ping" />
              <span>Hover or tap to peel back layers</span>
            </div>
          </div>
        )}
      </section>

      {/* Explorer spotlight section directly on the main page */}
      <ExplorerSection />

      {/* Games list / arcade area */}
      <GamesArea />

      {/* Interactive Explorer profile modal */}
      <TsetsmunkhProfile />

      {/* Interactive Chat Dialogs */}
      <IdolChat isOpen={isIdolChatOpen} onClose={() => setIsIdolChatOpen(false)} />
      <MeChat />
    </div>
  );
}

