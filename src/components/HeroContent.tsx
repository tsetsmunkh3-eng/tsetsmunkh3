import { ArrowDown } from 'lucide-react';

export default function HeroContent() {
  return (
    <>
      {/* Centered Heading */}
      <div
        id="hero-header-container"
        className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50"
      >
        <h1 id="hero-main-heading" className="text-white leading-[0.9]">
          <span
            id="hero-heading-line-1"
            className="block font-normal italic text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
            style={{
              fontFamily: 'Georgia, serif',
              letterSpacing: '-0.05em',
              animationDelay: '0.25s',
            }}
          >
            Layers hold
          </span>
          <span
            id="hero-heading-line-2"
            className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-2 hero-anim hero-reveal"
            style={{
              letterSpacing: '-0.08em',
              animationDelay: '0.42s',
            }}
          >
            tales of time
          </span>
        </h1>
      </div>

      {/* Bottom-Left Information Block */}
      <div
        id="hero-bottom-left-block"
        className="hidden sm:block absolute bottom-14 left-14 max-w-[260px] z-50 hero-anim hero-fade"
        style={{
          animationDelay: '0.7s',
        }}
      >
        <p id="hero-bottom-left-text" className="text-sm text-white/80 leading-relaxed font-light">
          Every layer of sediment records a chapter of our planet, from ancient seabeds to drifting ash, layered across millions of years beneath us.
        </p>
      </div>

      {/* Bottom-Right Interaction Block */}
      <div
        id="hero-bottom-right-block"
        className="absolute bottom-10 sm:bottom-14 left-5 right-5 sm:left-auto sm:right-14 max-w-full sm:max-w-[280px] flex flex-col items-start gap-6 z-50 hero-anim hero-fade"
        style={{
          animationDelay: '0.85s',
        }}
      >
        <p id="hero-bottom-right-text" className="text-sm text-white/80 leading-relaxed font-light">
          Our interactive maps let you peel back the crust to trace how stones, fossils, and deep time combine to shape the ground beneath your feet.
        </p>
        <button
          id="hero-btn-start-digging"
          className="group flex items-center gap-2 bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-8 py-3.5 rounded-full transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#e8702a]/20 cursor-pointer"
        >
          <span>Start Digging</span>
          <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    </>
  );
}
