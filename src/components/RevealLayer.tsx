import { useLayoutEffect, useRef, useState, useEffect } from 'react';

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
}

const SPOTLIGHT_R = 260;

export default function RevealLayer({ image, cursorX, cursorY }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const revealDiv = revealRef.current;
    if (!canvas || !revealDiv) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // If cursor hasn't moved yet, the mask is completely transparent
    if (cursorX === -999 && cursorY === -999) {
      revealDiv.style.maskImage = 'none';
      revealDiv.style.webkitMaskImage = 'none';
      return;
    }

    // Build radial gradient at (cursorX, cursorY)
    const gradient = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      SPOTLIGHT_R
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
    gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.88, 'rgba(255, 255, 255, 0.12)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Fill an arc of radius SPOTLIGHT_R
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    try {
      const dataUrl = canvas.toDataURL();
      const maskStyle = `url(${dataUrl})`;
      revealDiv.style.maskImage = maskStyle;
      revealDiv.style.webkitMaskImage = maskStyle;
      revealDiv.style.maskSize = '100% 100%';
      revealDiv.style.webkitMaskSize = '100% 100%';
    } catch (err) {
      console.error('Error generating mask image:', err);
    }
  }, [cursorX, cursorY, dimensions, image]);

  return (
    <>
      {/* Hidden canvas for masking calculations */}
      <canvas
        id="mask-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      {/* Reveal Image Layer */}
      <div
        id="reveal-layer-container"
        ref={revealRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none transition-transform duration-500"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />
    </>
  );
}
